import { YOLO_MODEL_MANIFEST } from '@/lib/yoloModel';

export function rgbaToTensorData(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  inputSize: number = YOLO_MODEL_MANIFEST.inputSize,
): Float32Array {
  if (width !== inputSize || height !== inputSize) {
    throw new Error(`Expected ${inputSize}x${inputSize} input, received ${width}x${height}`);
  }

  const pixelCount = width * height;
  if (rgba.length < pixelCount * 4) {
    throw new Error('RGBA buffer is smaller than the declared image size');
  }

  const tensor = new Float32Array(pixelCount * 3);
  const greenOffset = pixelCount;
  const blueOffset = pixelCount * 2;

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const rgbaOffset = pixel * 4;
    tensor[pixel] = rgba[rgbaOffset] / 255;
    tensor[greenOffset + pixel] = rgba[rgbaOffset + 1] / 255;
    tensor[blueOffset + pixel] = rgba[rgbaOffset + 2] / 255;
  }

  return tensor;
}

export function imageDataToTensorData(
  imageData: ImageData,
  inputSize: number = YOLO_MODEL_MANIFEST.inputSize,
): Float32Array {
  return rgbaToTensorData(imageData.data, imageData.width, imageData.height, inputSize);
}

export function rgbaBufferToTensorData(
  buffer: ArrayBuffer,
  width: number,
  height: number,
  inputSize: number = YOLO_MODEL_MANIFEST.inputSize,
): Float32Array {
  return rgbaToTensorData(new Uint8ClampedArray(buffer), width, height, inputSize);
}
