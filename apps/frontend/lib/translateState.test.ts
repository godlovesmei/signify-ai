import { describe, expect, it } from 'vitest';

import {
  createLetterAccumulatorState,
  mapCameraStateToDetectionStatus,
  reduceLetterAccumulator,
  type LetterAccumulatorConfig,
} from '@/lib/translateState';

const accumulatorConfig: LetterAccumulatorConfig = {
  voteBufferSize: 3,
  weightedVoteThreshold: 0.67,
  fastCommitThreshold: 0.92,
  releaseFrameCount: 3,
};

describe('translateState mapCameraStateToDetectionStatus', () => {
  it('maps idle to idle', () => {
    expect(mapCameraStateToDetectionStatus('idle')).toBe('idle');
  });

  it('maps requesting and loading to loading', () => {
    expect(mapCameraStateToDetectionStatus('requesting')).toBe('loading');
    expect(mapCameraStateToDetectionStatus('loading')).toBe('loading');
  });

  it('maps ready to ready', () => {
    expect(mapCameraStateToDetectionStatus('ready')).toBe('ready');
  });

  it('maps detecting to detecting', () => {
    expect(mapCameraStateToDetectionStatus('detecting')).toBe('detecting');
  });

  it('maps camera errors to error', () => {
    expect(mapCameraStateToDetectionStatus('error-permission')).toBe('error');
    expect(mapCameraStateToDetectionStatus('error-device')).toBe('error');
  });
});

describe('translateState reduceLetterAccumulator', () => {
  it('commits a high-confidence letter once while the same gesture is held', () => {
    let state = createLetterAccumulatorState();

    const first = reduceLetterAccumulator(
      state,
      { letter: 'A', confidence: 0.97 },
      accumulatorConfig
    );
    expect(first.commit).toEqual({ letter: 'A', confidence: 0.97 });
    state = first.state;

    for (let i = 0; i < 8; i += 1) {
      const next = reduceLetterAccumulator(
        state,
        { letter: 'A', confidence: 0.99 },
        accumulatorConfig
      );
      expect(next.commit).toBeNull();
      state = next.state;
    }
  });

  it('allows a different stable letter after a committed letter', () => {
    let state = createLetterAccumulatorState();

    const first = reduceLetterAccumulator(
      state,
      { letter: 'A', confidence: 0.97 },
      accumulatorConfig
    );
    state = first.state;

    const second = reduceLetterAccumulator(
      state,
      { letter: 'B', confidence: 0.96 },
      accumulatorConfig
    );

    expect(second.commit).toEqual({ letter: 'B', confidence: 0.96 });
  });

  it('requires a deliberate no-hand release before repeating the same letter', () => {
    let state = createLetterAccumulatorState();

    const first = reduceLetterAccumulator(
      state,
      { letter: 'A', confidence: 0.97 },
      accumulatorConfig
    );
    state = first.state;

    for (let i = 0; i < accumulatorConfig.releaseFrameCount - 1; i += 1) {
      const release = reduceLetterAccumulator(
        state,
        { letter: null, confidence: null },
        accumulatorConfig
      );
      expect(release.commit).toBeNull();
      state = release.state;
    }

    const stillLocked = reduceLetterAccumulator(
      state,
      { letter: 'A', confidence: 0.98 },
      accumulatorConfig
    );
    expect(stillLocked.commit).toBeNull();
    state = stillLocked.state;

    for (let i = 0; i < accumulatorConfig.releaseFrameCount; i += 1) {
      const release = reduceLetterAccumulator(
        state,
        { letter: null, confidence: null },
        accumulatorConfig
      );
      state = release.state;
    }

    const repeated = reduceLetterAccumulator(
      state,
      { letter: 'A', confidence: 0.98 },
      accumulatorConfig
    );
    expect(repeated.commit).toEqual({ letter: 'A', confidence: 0.98 });
  });

  it('uses weighted voting for lower-confidence repeated predictions', () => {
    let state = createLetterAccumulatorState();

    for (const confidence of [0.72, 0.76]) {
      const next = reduceLetterAccumulator(
        state,
        { letter: 'K', confidence },
        accumulatorConfig
      );
      expect(next.commit).toBeNull();
      state = next.state;
    }

    const committed = reduceLetterAccumulator(
      state,
      { letter: 'K', confidence: 0.74 },
      accumulatorConfig
    );

    expect(committed.commit?.letter).toBe('K');
    expect(committed.commit?.confidence).toBeCloseTo(0.74);
  });
});
