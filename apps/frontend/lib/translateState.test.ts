import { describe, expect, it } from 'vitest';

import { mapCameraStateToDetectionStatus } from '@/lib/translateState';

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