import type { CameraState, DetectionStatusState } from '@/components/features/translation';

export function mapCameraStateToDetectionStatus(state: CameraState): DetectionStatusState {
  if (state === 'detecting') return 'detecting';
  if (state === 'ready') return 'ready';
  if (state === 'loading' || state === 'requesting') return 'loading';
  if (state === 'error-permission' || state === 'error-device') return 'error';
  return 'idle';
}