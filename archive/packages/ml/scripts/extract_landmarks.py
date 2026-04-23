# packages/ml/scripts/extract_landmarks.py
"""
Extract MediaPipe hand landmarks from training images.

For each image in the train/valid/test manifests, runs MediaPipe Hands
(static image mode) and normalises the 21 landmarks to a 63-float vector
that is position- and scale-invariant. Skips images where no hand is found.

Run from repo root:
    python packages/ml/scripts/extract_landmarks.py

Outputs (in data/processed/bisindo_v1/landmarks/):
    train_features.npy   shape (N, 63)  float32
    train_labels.npy     shape (N,)     str
    valid_features.npy / valid_labels.npy
    test_features.npy  / test_labels.npy
"""

import csv
import logging
import sys
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python.vision import HandLandmarker, HandLandmarkerOptions, RunningMode

logging.basicConfig(
    level   = logging.INFO,
    format  = "%(asctime)s | %(levelname)s | %(message)s",
    datefmt = "%H:%M:%S",
)
logger = logging.getLogger(__name__)

MANIFESTS = {
    "train": "data/processed/bisindo_v1/manifests/train.csv",
    "valid": "data/processed/bisindo_v1/manifests/valid.csv",
    "test":  "data/processed/bisindo_v1/manifests/test.csv",
}
LANDMARKER_MODEL = "models/hand_landmarker.task"
OUTPUT_DIR = Path("data/processed/bisindo_v1/landmarks")


def normalize_landmarks(landmarks) -> np.ndarray:
    """
    Normalise 21 MediaPipe landmarks to a 63-float position/scale-invariant vector.

    Steps:
      1. Subtract wrist position (landmark 0)  → translation-invariant
      2. Divide by distance from wrist to middle-finger MCP (landmark 9)
         → scale-invariant
      3. Flatten to shape (63,)
    """
    coords = np.array([[lm.x, lm.y, lm.z] for lm in landmarks], dtype=np.float32)
    coords -= coords[0]                         # subtract wrist
    scale = float(np.linalg.norm(coords[9]))    # wrist → middle MCP distance
    if scale > 1e-6:
        coords /= scale
    return coords.flatten()


def extract_split(split: str, manifest_path: str, output_dir: Path):
    with open(manifest_path, newline="") as f:
        rows = list(csv.DictReader(f))

    features: list[np.ndarray] = []
    labels:   list[str]        = []
    failed = 0

    options = HandLandmarkerOptions(
        base_options           = mp_python.BaseOptions(model_asset_path=LANDMARKER_MODEL),
        running_mode           = RunningMode.IMAGE,
        num_hands              = 1,
        min_hand_detection_confidence = 0.3,
        min_hand_presence_confidence  = 0.3,
        min_tracking_confidence       = 0.3,
    )
    with HandLandmarker.create_from_options(options) as detector:
        for i, row in enumerate(rows):
            img = cv2.imread(row["filepath"])
            if img is None:
                failed += 1
                continue

            mp_image = mp.Image(
                image_format = mp.ImageFormat.SRGB,
                data         = cv2.cvtColor(img, cv2.COLOR_BGR2RGB),
            )
            result = detector.detect(mp_image)
            if not result.hand_landmarks:
                failed += 1
                continue

            features.append(normalize_landmarks(result.hand_landmarks[0]))
            labels.append(row["label"])

            if (i + 1) % 1000 == 0:
                logger.info("%-5s  %5d / %5d  (skipped: %d)", split, i + 1, len(rows), failed)

    X = np.array(features, dtype=np.float32)
    y = np.array(labels)
    np.save(output_dir / f"{split}_features.npy", X)
    np.save(output_dir / f"{split}_labels.npy",   y)
    logger.info("%-5s  done: %d saved, %d skipped (%.1f%%)",
                split, len(X), failed, 100 * failed / max(len(rows), 1))


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for split, path in MANIFESTS.items():
        extract_split(split, path, OUTPUT_DIR)
    logger.info("Landmarks saved to %s", OUTPUT_DIR)


if __name__ == "__main__":
    main()
