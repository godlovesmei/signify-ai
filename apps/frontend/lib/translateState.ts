import type { CameraState, DetectionStatusState } from '@/components/features/translation';

export type LetterVoteEntry = {
  letter: string;
  confidence: number;
};

export type LetterCommit = LetterVoteEntry;

export type LetterAccumulatorConfig = {
  voteBufferSize: number;
  weightedVoteThreshold: number;
  fastCommitThreshold: number;
  releaseFrameCount: number;
};

export type LetterAccumulatorState = {
  voteBuffer: LetterVoteEntry[];
  lockedLetter: string | null;
  noHandFrames: number;
};

export function mapCameraStateToDetectionStatus(state: CameraState): DetectionStatusState {
  if (state === 'detecting') return 'detecting';
  if (state === 'ready') return 'ready';
  if (state === 'loading' || state === 'requesting') return 'loading';
  if (state === 'error-permission' || state === 'error-device') return 'error';
  return 'idle';
}

export function createLetterAccumulatorState(): LetterAccumulatorState {
  return {
    voteBuffer: [],
    lockedLetter: null,
    noHandFrames: 0,
  };
}

function normalizeLetter(letter: string | null | undefined) {
  const normalized = letter?.trim().toUpperCase();
  return normalized && /^[A-Z]$/.test(normalized) ? normalized : null;
}

function weightedVote(
  voteBuffer: LetterVoteEntry[],
  fallbackConfidence: number,
  threshold: number
): LetterCommit | null {
  const scores: Record<string, number> = {};
  const confidencesByLetter: Record<string, number[]> = {};

  for (const entry of voteBuffer) {
    const weight = Math.pow(entry.confidence, 2);
    scores[entry.letter] = (scores[entry.letter] ?? 0) + weight;
    (confidencesByLetter[entry.letter] ??= []).push(entry.confidence);
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;

  const [winner, winnerWeight] = sorted[0];
  const totalWeight = Object.values(scores).reduce((a, b) => a + b, 0);
  if (totalWeight <= 0 || winnerWeight / totalWeight < threshold) return null;

  const winnerConfidences = confidencesByLetter[winner] ?? [fallbackConfidence];
  const confidence =
    winnerConfidences.reduce((a, b) => a + b, 0) / winnerConfidences.length;

  return { letter: winner, confidence };
}

export function reduceLetterAccumulator(
  state: LetterAccumulatorState,
  input: { letter: string | null; confidence: number | null },
  config: LetterAccumulatorConfig
): { state: LetterAccumulatorState; commit: LetterCommit | null } {
  const letter = normalizeLetter(input.letter);
  const confidence =
    typeof input.confidence === 'number' && Number.isFinite(input.confidence)
      ? Math.max(0, Math.min(1, input.confidence))
      : null;

  if (!letter || confidence === null) {
    const noHandFrames = state.noHandFrames + 1;

    return {
      state: {
        voteBuffer: [],
        lockedLetter:
          noHandFrames >= config.releaseFrameCount ? null : state.lockedLetter,
        noHandFrames,
      },
      commit: null,
    };
  }

  if (state.lockedLetter === letter) {
    return {
      state: {
        ...state,
        voteBuffer: [],
        noHandFrames: 0,
      },
      commit: null,
    };
  }

  if (confidence >= config.fastCommitThreshold) {
    return {
      state: {
        voteBuffer: [],
        lockedLetter: letter,
        noHandFrames: 0,
      },
      commit: { letter, confidence },
    };
  }

  const voteBuffer = [...state.voteBuffer, { letter, confidence }].slice(
    -config.voteBufferSize
  );

  if (voteBuffer.length < config.voteBufferSize) {
    return {
      state: {
        voteBuffer,
        lockedLetter: state.lockedLetter,
        noHandFrames: 0,
      },
      commit: null,
    };
  }

  const commit = weightedVote(voteBuffer, confidence, config.weightedVoteThreshold);

  return {
    state: {
      voteBuffer: commit ? [] : voteBuffer,
      lockedLetter: commit ? commit.letter : state.lockedLetter,
      noHandFrames: 0,
    },
    commit,
  };
}
