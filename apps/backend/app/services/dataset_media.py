"""Bounded full video decoding. Only generated file paths enter argv; no shell."""
import json
import math
import os
from pathlib import Path
import shutil
import signal
import subprocess
from fractions import Fraction
from app.services.dataset_errors import DatasetError


class VideoInspector:
    def __init__(self, settings):
        self.settings = settings

    def run_tool(self, tool, args, directory, name, file_limit=1048576):
        executable = shutil.which(tool)
        limiter = shutil.which("prlimit")
        if os.name != "posix" or not executable or not limiter:
            raise DatasetError(503, "media_tools_unavailable", "FFmpeg, FFprobe dan pembatas resource Linux diperlukan.")
        stdout, stderr = directory / (name + ".out"), directory / (name + ".err")
        command = [limiter, "--as=" + str(self.settings.process_memory_mib * 1024 * 1024),
                   "--cpu=" + str(self.settings.process_timeout_seconds + 1),
                   "--fsize=" + str(file_limit), "--nofile=64", "--", executable, *args]
        environment = {"PATH": os.environ.get("PATH", "/usr/bin:/bin"), "LANG": "C", "LC_ALL": "C",
                       "OMP_NUM_THREADS": "1", "OPENBLAS_NUM_THREADS": "1"}
        try:
            with stdout.open("wb") as out, stderr.open("wb") as err:
                process = subprocess.Popen(command, stdin=subprocess.DEVNULL, stdout=out, stderr=err,
                                           cwd=directory, env=environment, start_new_session=True)
                try:
                    result = process.wait(timeout=self.settings.process_timeout_seconds)
                except subprocess.TimeoutExpired:
                    os.killpg(process.pid, signal.SIGKILL)
                    process.wait()
                    raise DatasetError(422, "media_processing_limit", "Pemeriksaan video melewati batas pemrosesan.") from None
            if result != 0 or stdout.stat().st_size > 1048576:
                raise DatasetError(422, "invalid_video", "Video tidak dapat dibaca atau didekode secara utuh.")
            return stdout.read_bytes()
        except OSError:
            raise DatasetError(503, "media_resource_unavailable", "Resource pemeriksaan video belum tersedia.") from None

    def browser_preview(self, source: Path):
        """Create a temporary playable copy; never modify the submitted source."""
        target = source.parent / "preview.webm"
        self.run_tool(self.settings.ffmpeg, [
            "-v", "error", "-nostdin", "-max_alloc", "67108864",
            "-protocol_whitelist", "file,pipe", "-format_whitelist", "avi,mov,matroska,webm",
            "-cpucount", "1", "-threads", "1", "-filter_threads", "1", "-i", str(source),
            "-map", "0:v:0", "-an", "-sn", "-dn", "-c:v", "libvpx", "-threads", "1",
            "-deadline", "realtime", "-cpu-used", "8", "-b:v", "1500k", "-pix_fmt", "yuv420p",
            "-map_metadata", "-1", "-f", "webm", str(target),
        ], source.parent, "preview", file_limit=self.settings.playback_max_bytes)
        if not target.is_file() or not 0 < target.stat().st_size <= self.settings.playback_max_bytes:
            raise DatasetError(422, "video_preview_failed", "Pratinjau video tidak dapat dibuat.")
        return target.read_bytes(), "video/webm"

    def inspect(self, source: Path, policy):
        directory = source.parent
        common = ["-v", "error", "-max_alloc", "67108864", "-protocol_whitelist", "file,pipe",
                  "-format_whitelist", "avi,mov,matroska,webm"]
        output = self.run_tool(self.settings.ffprobe,
                               [*common, "-show_streams", "-show_format", "-of", "json", str(source)],
                               directory, "probe")
        try:
            data = json.loads(output)
            videos = [s for s in data["streams"] if s.get("codec_type") == "video"]
            if len(videos) != 1:
                raise ValueError()
            stream = videos[0]
            width, height = int(stream["width"]), int(stream["height"])
            codec = stream["codec_name"]
            rotation = next((float(s["rotation"]) for s in stream.get("side_data_list", [])
                             if "rotation" in s), float(stream.get("tags", {}).get("rotate", 0)))
            if (width <= 0 or height <= 0 or not codec
                    or not math.isfinite(rotation) or rotation % 90):
                raise ValueError()
            if int(rotation) % 180:
                width, height = height, width
            fmt = data["format"]["format_name"]
            if fmt == "avi":
                mime = "video/x-msvideo"
            elif "mov" in fmt.split(","):
                brand = data["format"].get("tags", {}).get("major_brand", "")
                mime = "video/quicktime" if brand.strip() == "qt" else "video/mp4"
            elif "matroska" in fmt.split(","):
                with source.open("rb") as handle:
                    prefix = handle.read(4096)
                mime = "video/webm" if b"webm" in prefix else "video/x-matroska"
            else:
                raise ValueError()
        except (ValueError, KeyError, TypeError, OverflowError, ZeroDivisionError):
            raise DatasetError(422, "video_metadata_incomplete", "Metadata atau stream video tidak lengkap.") from None
        if mime not in policy.allowed_mime_types:
            raise DatasetError(422, "container_not_allowed", "Container video tidak sesuai policy aktif.")
        if min(width, height) < policy.min_short_side_px or max(width, height) > policy.max_long_side_px:
            raise DatasetError(422, "resolution_not_allowed", "Resolusi video tidak sesuai policy aktif.")
        # Live MediaRecorder/WebM streams may report avg_frame_rate=0/0.
        # Validate the full stream and derive FPS from decoded frames/timestamps.
        progress = directory / "decode.progress"
        decoded = self.run_tool(self.settings.ffmpeg,
                      [*common, "-cpucount", "1", "-nostdin", "-xerror", "-err_detect", "explode", "-threads", "1",
                       "-filter_threads", "1", "-filter_complex_threads", "1", "-i", str(source),
                       "-map", "0:v:0", "-an", "-sn", "-dn", "-fps_mode", "passthrough",
                       "-enc_time_base", "demux", "-c:v", "wrapped_avframe", "-threads", "1",
                       "-progress", str(progress), "-f", "framecrc", "-"], directory, "decode")
        try:
            if progress.stat().st_size > 1048576:
                raise ValueError()
            values = dict(line.split("=", 1) for line in progress.read_text().splitlines() if "=" in line)
            frames = int(values["frame"])
            if frames <= 0 or values.get("progress") != "end":
                raise ValueError()
            # FFmpeg 6 progress may stop at the last PTS, excluding its duration.
            # Use decoded presentation intervals in the original demux time base.
            time_base = None
            first_pts = last_pts = end_pts = None
            decoded_frames = 0
            for line in decoded.decode("ascii").splitlines():
                if line.startswith("#tb 0: "):
                    if time_base is not None:
                        raise ValueError()
                    time_base = Fraction(line.split(":", 1)[1].strip())
                elif line and not line.startswith("#"):
                    stream_index, _dts, pts, frame_duration, _size, _crc = line.split(",", 5)
                    pts, frame_duration = int(pts), int(frame_duration)
                    if (int(stream_index) != 0 or frame_duration <= 0
                            or (last_pts is not None and pts <= last_pts)):
                        raise ValueError()
                    if first_pts is None:
                        first_pts = pts
                    last_pts = pts
                    frame_end = pts + frame_duration
                    end_pts = frame_end if end_pts is None else max(end_pts, frame_end)
                    decoded_frames += 1
            if time_base is None or time_base <= 0 or decoded_frames != frames:
                raise ValueError()
            elapsed = (end_pts - first_pts) * time_base
            duration = math.ceil(elapsed * 1000)
            fps = float(frames / elapsed)
        except (OSError, KeyError, ValueError, ZeroDivisionError, OverflowError):
            raise DatasetError(422, "video_metadata_incomplete", "Durasi hasil dekode tidak tersedia.") from None
        if not policy.min_duration_ms <= duration <= policy.max_duration_ms:
            raise DatasetError(422, "duration_not_allowed", "Durasi aktual video tidak sesuai policy aktif.")
        return {"duration_ms": duration, "width": width, "height": height,
                "fps": fps, "mime_type": mime, "container": fmt, "codec": codec}
