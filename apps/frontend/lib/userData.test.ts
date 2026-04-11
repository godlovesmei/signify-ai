import { beforeEach, describe, expect, it } from 'vitest';

import {
  appendHistoryEntry,
  clearHistoryEntries,
  getHistoryEntries,
  getHistorySessions,
  getPracticeStats,
  recordPracticeAttempt,
  resetPracticeStats,
} from '@/lib/userData';

function installWindowStorageMock() {
  const store = new Map<string, string>();

  const localStorage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };

  Object.defineProperty(globalThis, 'window', {
    value: { localStorage },
    configurable: true,
    writable: true,
  });
}

describe('userData utilities', () => {
  beforeEach(() => {
    installWindowStorageMock();
    clearHistoryEntries();
    resetPracticeStats();
  });

  it('records a correct practice attempt and updates streaks', () => {
    const next = recordPracticeAttempt('a', true);

    expect(next.totalAttempts).toBe(1);
    expect(next.correctAttempts).toBe(1);
    expect(next.currentStreak).toBe(1);
    expect(next.bestStreak).toBe(1);
    expect(next.byLetter.A.attempts).toBe(1);
    expect(next.byLetter.A.correct).toBe(1);
    expect(next.lastPlayedAt).not.toBeNull();
  });

  it('ignores invalid practice letters', () => {
    const baseline = getPracticeStats();
    const next = recordPracticeAttempt('#', true);

    expect(next).toEqual(baseline);
  });

  it('sorts history entries by timestamp ascending', () => {
    appendHistoryEntry({
      id: '2',
      sessionId: 's1',
      text: 'B',
      confidence: 0.8,
      timestamp: '2026-04-12T02:00:00.000Z',
      language: 'BISINDO',
    });

    appendHistoryEntry({
      id: '1',
      sessionId: 's1',
      text: 'A',
      confidence: 0.9,
      timestamp: '2026-04-12T01:00:00.000Z',
      language: 'BISINDO',
    });

    const entries = getHistoryEntries();
    expect(entries).toHaveLength(2);
    expect(entries[0].id).toBe('1');
    expect(entries[1].id).toBe('2');
  });

  it('builds grouped history sessions with aggregates', () => {
    appendHistoryEntry({
      id: '1',
      sessionId: 's1',
      text: 'A',
      confidence: 0.9,
      timestamp: '2026-04-12T01:00:00.000Z',
      language: 'BISINDO',
    });
    appendHistoryEntry({
      id: '2',
      sessionId: 's1',
      text: 'B',
      confidence: 0.7,
      timestamp: '2026-04-12T01:01:00.000Z',
      language: 'BISINDO',
    });
    appendHistoryEntry({
      id: '3',
      sessionId: 's2',
      text: 'C',
      confidence: 0.8,
      timestamp: '2026-04-12T03:00:00.000Z',
      language: 'BISINDO',
    });

    const sessions = getHistorySessions();

    expect(sessions).toHaveLength(2);
    // Sessions are sorted descending by endedAt.
    expect(sessions[0].sessionId).toBe('s2');
    expect(sessions[1].sessionId).toBe('s1');
    expect(sessions[1].text).toBe('AB');
    expect(sessions[1].averageConfidence).toBeCloseTo(0.8, 4);
  });
});
