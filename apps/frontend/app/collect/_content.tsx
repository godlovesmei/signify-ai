'use client';

/**
 * /collect — Landmark training data collection page.
 *
 * Guides the user through all 26 BISINDO letters, recording normalized
 * MediaPipe hand landmark vectors for each sign. The collected dataset
 * is saved to localStorage and can be downloaded as JSON.
 *
 * Download the JSON, then run:
 *   python packages/ml/scripts/train_mlp.py --dataset collected_data.json
 *
 * Place the output weights.json + label_map.json in:
 *   apps/frontend/public/models/landmark_mlp/
 *
 * After that, the translate page will automatically use the MLP classifier.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { CheckCircle, Circle, Download, RefreshCw, Video } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { normalizeLandmarks } from '@/hooks/useLandmarkClassifier';

// ── Constants ──────────────────────────────────────────────────────────────

const LETTERS         = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const SAMPLES_PER_LETTER = 50;   // samples to collect per letter
const CAPTURE_INTERVAL   = 200;  // ms between captures (5 fps)
const STORAGE_KEY        = 'signify:collect:dataset';
const MEDIAPIPE_VISION_VERSION = '0.10.32';

// ── Types ──────────────────────────────────────────────────────────────────

interface Sample {
  label:     string;
  landmarks: number[];   // 63 normalized floats
}

interface Dataset {
  version:   number;
  collected: string;     // ISO timestamp
  samples:   Sample[];
}

// ── MediaPipe init ─────────────────────────────────────────────────────────

async function createHandLandmarker(): Promise<HandLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(
    `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VISION_VERSION}/wasm`,
  );
  return HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode:                'VIDEO',
    numHands:                   1,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence:  0.5,
    minTrackingConfidence:      0.5,
  });
}

// ── Storage helpers ────────────────────────────────────────────────────────

function loadDataset(): Dataset {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Dataset;
  } catch { /* ignore */ }
  return { version: 1, collected: new Date().toISOString(), samples: [] };
}

function saveDataset(ds: Dataset) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ds)); } catch { /* quota */ }
}

function countByLabel(samples: Sample[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of samples) counts[s.label] = (counts[s.label] ?? 0) + 1;
  return counts;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function CollectPageContent() {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mpReady,       setMpReady]       = useState(false);
  const [cameraReady,   setCameraReady]   = useState(false);
  const [currentIdx,    setCurrentIdx]    = useState(0);
  const [isRecording,   setIsRecording]   = useState(false);
  const [dataset,       setDataset]       = useState<Dataset>(() => loadDataset());
  const [handDetected,  setHandDetected]  = useState(false);
  const [statusMsg,     setStatusMsg]     = useState('');

  const counts  = countByLabel(dataset.samples);
  const current = LETTERS[currentIdx];
  const total   = dataset.samples.length;
  const done    = LETTERS.filter(l => (counts[l] ?? 0) >= SAMPLES_PER_LETTER).length;

  // Load MediaPipe
  useEffect(() => {
    createHandLandmarker()
      .then(lm => { landmarkerRef.current = lm; setMpReady(true); })
      .catch(e  => console.error('MediaPipe init failed:', e));
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  // Start webcam
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (e) {
      setStatusMsg('Camera access denied.');
    }
  }, []);

  // Recording loop
  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(() => {
    if (!mpReady || !cameraReady || isRecording) return;
    setIsRecording(true);
    setStatusMsg(`Recording "${current}"…`);

    timerRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || !landmarkerRef.current || video.readyState < 2) return;

      const result = landmarkerRef.current.detectForVideo(video, performance.now());
      const lms    = result.hand_landmarks?.[0];

      if (!lms || lms.length < 21) {
        setHandDetected(false);
        return;
      }
      setHandDetected(true);

      const normalized = normalizeLandmarks(
        lms.map(lm => ({ x: lm.x, y: lm.y, z: lm.z })),
      );

      setDataset(prev => {
        const currentCount = countByLabel(prev.samples)[current] ?? 0;
        if (currentCount >= SAMPLES_PER_LETTER) {
          stopRecording();
          return prev;
        }
        const next: Dataset = {
          ...prev,
          samples: [...prev.samples, { label: current, landmarks: normalized }],
        };
        saveDataset(next);
        return next;
      });
    }, CAPTURE_INTERVAL);
  }, [mpReady, cameraReady, isRecording, current, stopRecording]);

  // Auto-stop when letter is done
  useEffect(() => {
    const count = counts[current] ?? 0;
    if (isRecording && count >= SAMPLES_PER_LETTER) {
      stopRecording();
      setStatusMsg(`"${current}" complete! Move to next letter.`);
    }
  }, [counts, current, isRecording, stopRecording]);

  // Navigate letters
  const goNext = useCallback(() => {
    stopRecording();
    setCurrentIdx(i => Math.min(i + 1, LETTERS.length - 1));
    setHandDetected(false);
    setStatusMsg('');
  }, [stopRecording]);

  const goPrev = useCallback(() => {
    stopRecording();
    setCurrentIdx(i => Math.max(i - 1, 0));
    setHandDetected(false);
    setStatusMsg('');
  }, [stopRecording]);

  const resetLetter = useCallback(() => {
    stopRecording();
    setDataset(prev => {
      const next: Dataset = {
        ...prev,
        samples: prev.samples.filter(s => s.label !== current),
      };
      saveDataset(next);
      return next;
    });
    setStatusMsg('');
  }, [stopRecording, current]);

  // Download dataset as JSON
  const downloadDataset = useCallback(() => {
    const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `bisindo_landmarks_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [dataset]);

  const currentCount = counts[current] ?? 0;
  const progress     = Math.min(currentCount / SAMPLES_PER_LETTER, 1);
  const letterDone   = currentCount >= SAMPLES_PER_LETTER;

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/30 px-4">
        <Logo size="sm" />
        <h1 className="text-sm font-semibold">Collect Landmark Data</h1>
        <button
          onClick={downloadDataset}
          disabled={total === 0}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-40 hover:bg-muted/80"
        >
          <Download className="h-3.5 w-3.5" />
          Download ({total} samples)
        </button>
      </header>

      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:flex-row md:p-6">
        {/* Left — webcam + controls */}
        <div className="flex flex-col gap-4 md:w-[380px] md:shrink-0">
          {/* Camera */}
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover [transform:scaleX(-1)]"
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
                <Video className="h-8 w-8 text-muted-foreground" />
                <button
                  onClick={startCamera}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Enable Camera
                </button>
              </div>
            )}
            {cameraReady && (
              <div className={`absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                handDetected ? 'bg-primary/90 text-white' : 'bg-black/60 text-white/70'
              }`}>
                <span className={`h-2 w-2 rounded-full ${handDetected ? 'bg-white' : 'bg-white/40'}`} />
                {handDetected ? 'Hand detected' : 'No hand'}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Letter "{current}"</span>
              <span>{currentCount} / {SAMPLES_PER_LETTER}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-200"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          {/* Status */}
          {statusMsg && (
            <p className="text-center text-sm text-muted-foreground">{statusMsg}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {!letterDone ? (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!cameraReady || !mpReady}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-40 ${
                  isRecording
                    ? 'bg-destructive text-white'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}
              >
                {!mpReady ? 'Loading…' : isRecording ? 'Stop Recording' : `Record "${current}"`}
              </button>
            ) : (
              <button
                onClick={goNext}
                disabled={currentIdx === LETTERS.length - 1}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                Next Letter →
              </button>
            )}
            <button
              onClick={resetLetter}
              title="Re-record this letter"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Nav */}
          <div className="flex items-center justify-between text-sm">
            <button onClick={goPrev} disabled={currentIdx === 0} className="text-primary disabled:opacity-30">← Prev</button>
            <span className="text-muted-foreground">{currentIdx + 1} / {LETTERS.length}</span>
            <button onClick={goNext} disabled={currentIdx === LETTERS.length - 1} className="text-primary disabled:opacity-30">Next →</button>
          </div>
        </div>

        {/* Right — letter grid */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Overall progress */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between text-sm font-medium">
              <span>Overall progress</span>
              <span className="text-primary">{done} / {LETTERS.length} letters complete</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${(done / LETTERS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Letter grid */}
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-7 md:grid-cols-6 lg:grid-cols-9">
            {LETTERS.map((letter, i) => {
              const count    = counts[letter] ?? 0;
              const complete = count >= SAMPLES_PER_LETTER;
              const active   = i === currentIdx;
              return (
                <button
                  key={letter}
                  onClick={() => { stopRecording(); setCurrentIdx(i); setHandDetected(false); setStatusMsg(''); }}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-bold transition-all ${
                    active
                      ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary ring-offset-1'
                      : complete
                      ? 'border-primary/30 bg-primary/5 text-primary'
                      : 'border-border bg-card text-foreground hover:border-primary/40'
                  }`}
                >
                  {letter}
                  {complete ? (
                    <CheckCircle className="absolute bottom-1 right-1 h-3 w-3 text-primary" />
                  ) : count > 0 ? (
                    <span className="absolute bottom-0.5 right-1 text-[9px] tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Instructions */}
          <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">How to collect data</p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>Enable camera and wait for hand detection indicator</li>
              <li>Make the BISINDO sign for the current letter</li>
              <li>Press <strong>Record</strong> — hold the sign steady for ~10 seconds</li>
              <li>Repeat for all 26 letters, then click <strong>Download</strong></li>
              <li>Run: <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">python packages/ml/scripts/train_mlp.py --dataset &lt;file.json&gt;</code></li>
              <li>Place output files in <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">public/models/landmark_mlp/</code></li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
