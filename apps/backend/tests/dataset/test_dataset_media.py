"""Real decoded timelines, policy boundaries, and bounded failure handling."""
from fractions import Fraction
import json

import pytest

from app.services.dataset_errors import DatasetError
from test_dataset_api import FFMPEG, FFPROBE, real_media


def test_synthetic_avi_has_explicit_frame_and_packet_durations(real_media):
    inspector, path, _ = real_media
    data = json.loads(inspector.run_tool(
        FFPROBE, ["-v", "error", "-show_format", "-show_streams", "-show_frames",
                  "-show_packets", "-of", "json", str(path)], path.parent, "fixture-timeline"))
    stream = data["streams"][0]
    assert Fraction(data["format"]["duration"]) == Fraction(1, 5)
    assert Fraction(stream["duration"]) == Fraction(1, 5)
    assert stream["nb_frames"] == "2"
    assert Fraction(stream["avg_frame_rate"]) == Fraction(stream["r_frame_rate"]) == 10
    for kind in ("frame", "packet"):
        entries = [entry for entry in data["packets_and_frames"] if entry["type"] == kind]
        assert [Fraction(entry["pts_time"]) for entry in entries] == [0, Fraction(1, 10)]
        assert [Fraction(entry["duration_time"]) for entry in entries] == [Fraction(1, 10)] * 2


@pytest.mark.parametrize("count,rate,duration_ms,fps", [
    (1, "10", 100, 10),
    (20, "10", 2000, 10),
    (3, "30000/1001", 101, 30000 / 1001),
])
def test_decoded_duration_includes_final_frame_and_preserves_precise_fps(
        real_media, count, rate, duration_ms, fps):
    inspector, path, policy = real_media
    video = path.parent / "explicit-duration.avi"
    inspector.run_tool(FFMPEG, [
        "-v", "error", "-cpucount", "1", "-f", "lavfi", "-i", "color=s=64x48:r=" + rate,
        "-frames:v", str(count), "-c:v", "rawvideo", "-threads", "1", str(video),
    ], path.parent, "generate-explicit-duration")
    result = inspector.inspect(video, policy)
    assert result["duration_ms"] == duration_ms
    assert result["fps"] == pytest.approx(fps, rel=1e-12)


@pytest.mark.parametrize("container,codec,mime", [
    ("matroska", "ffv1", "video/x-matroska"),
    ("webm", "libvpx", "video/webm"),
])
def test_variable_frame_timestamps_determine_duration_and_fps(
        real_media, monkeypatch, container, codec, mime):
    inspector, path, policy = real_media
    video = path.parent / "variable-timestamps.bin"
    # Frame PTS are 500, 600, 900 ms, with a final 100 ms interval:
    # (1000 - 500) ms = 500 ms and 3 / 0.5 = 6 fps.
    inspector.run_tool(FFMPEG, [
        "-v", "error", "-cpucount", "1", "-f", "lavfi", "-i", "color=s=64x48:r=10",
        "-vf", "settb=1/1000,setpts='if(eq(N,0),500,if(eq(N,1),600,900))'",
        "-frames:v", "3", "-fps_mode", "passthrough", "-enc_time_base", "1:1000",
        "-c:v", codec, "-threads", "1", "-f", container, str(video),
    ], path.parent, "generate-variable-timestamps")
    run_tool = inspector.run_tool

    def misleading_metadata(tool, args, directory, name):
        output = run_tool(tool, args, directory, name)
        if name == "probe":
            data = json.loads(output)
            data["format"]["duration"] = "0.100000"
            data["streams"][0].update(duration="0.100000", nb_frames="1",
                                       avg_frame_rate="120/1", r_frame_rate="120/1")
            return json.dumps(data).encode()
        return output

    monkeypatch.setattr(inspector, "run_tool", misleading_metadata)
    policy.allowed_mime_types = [mime]
    result = inspector.inspect(video, policy)
    assert result["duration_ms"] == 500
    assert result["fps"] == 6


@pytest.mark.parametrize("minimum,maximum,accepted", [
    (200, 200, True), (201, 10000, False), (1, 199, False),
])
def test_duration_policy_uses_complete_decoded_interval(real_media, minimum, maximum, accepted):
    inspector, path, policy = real_media
    policy.min_duration_ms, policy.max_duration_ms = minimum, maximum
    if accepted:
        assert inspector.inspect(path, policy)["duration_ms"] == 200
    else:
        with pytest.raises(DatasetError) as exc:
            inspector.inspect(path, policy)
        assert exc.value.code == "duration_not_allowed"


@pytest.mark.parametrize("out_time_us", ["100000", "200000", "N/A"])
def test_progress_time_is_not_used_as_decoded_duration(real_media, monkeypatch, out_time_us):
    inspector, path, policy = real_media
    run_tool = inspector.run_tool

    def change_progress(tool, args, directory, name):
        output = run_tool(tool, args, directory, name)
        if name == "decode":
            progress = directory / "decode.progress"
            progress.write_text("frame=2\nout_time_us=" + out_time_us + "\nprogress=end\n")
        return output

    monkeypatch.setattr(inspector, "run_tool", change_progress)
    result = inspector.inspect(path, policy)
    assert result["duration_ms"] == 200
    assert result["fps"] == 10


@pytest.mark.parametrize("invalid_output", [
    b"",  # A finished progress report alone does not prove valid timing.
    b"#tb 0: 1/10\n0, 0, 0, 0, 480, 0x0\n0, 1, 1, 1, 480, 0x0\n",
    b"#tb 0: 1/10\n0, 0, 0, 1, 480, 0x0\n0, 0, 0, 1, 480, 0x0\n",
    b"#tb 0: 1/10\n0, 0, 0, 1, 480, 0x0\n",  # Count mismatch.
    b"#tb 0: 0/0\n0, 0, 0, 1, 480, 0x0\n0, 1, 1, 1, 480, 0x0\n",
])
def test_incomplete_decoded_timing_fails_closed(real_media, monkeypatch, invalid_output):
    inspector, path, policy = real_media
    run_tool = inspector.run_tool

    def invalid_timing(tool, args, directory, name):
        output = run_tool(tool, args, directory, name)
        return invalid_output if name == "decode" else output

    monkeypatch.setattr(inspector, "run_tool", invalid_timing)
    with pytest.raises(DatasetError) as exc:
        inspector.inspect(path, policy)
    assert exc.value.code == "video_metadata_incomplete"


def test_truncated_final_frame_is_rejected_after_valid_first_frame(real_media):
    inspector, path, policy = real_media
    content = path.read_bytes()
    first_frame_end = content.index(b"movi") + 4 + 8 + 64 * 48 * 3
    path.write_bytes(content[:first_frame_end + 8 + 64])
    with pytest.raises(DatasetError) as exc:
        inspector.inspect(path, policy)
    assert exc.value.code == "invalid_video"
    assert (path.parent / "decode.err").exists()


def test_media_tool_output_file_limit_is_enforced(real_media):
    inspector, path, _ = real_media
    with pytest.raises(DatasetError) as exc:
        inspector.run_tool("/usr/bin/head", ["-c", "1048577", "/dev/zero"], path.parent, "oversized")
    assert exc.value.code == "invalid_video"
    assert (path.parent / "oversized.out").stat().st_size <= 1048576
