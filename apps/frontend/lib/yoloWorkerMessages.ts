import type { TranslatePredictionResponse } from '@/lib/translateApi';

export type YoloWorkerRequest = {
  type: 'predict';
  id: number;
  width: number;
  height: number;
  buffer: ArrayBuffer;
};

export type YoloWorkerResponse =
  | {
      type: 'result';
      id: number;
      result: TranslatePredictionResponse;
    }
  | {
      type: 'error';
      id: number;
      error: string;
    };
