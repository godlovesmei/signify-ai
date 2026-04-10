#!/usr/bin/env python3
"""
Smoke test: load a training image, run it through the exact inference
preprocessing pipeline, and check the model's prediction.

Usage (from repo root):
    python scripts/test_inference_static.py

Expected result:
    The model should predict the correct class with high confidence (>0.90).
    If it doesn't, there is still a preprocessing mismatch between training
    and inference.
"""

import csv
import io
import json
import logging
import sys
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image

logging.basicConfig(level=logging.DEBUG, format="%(message)s")
logger = logging.getLogger(__name__)

# ── Paths (relative to repo root) ────────────────────────────────────────────

MODEL_DIR      = Path("models/exports/bisindo_v2_ls/saved_model")
LABEL_MAP_PATH = Path("models/exports/bisindo_v2_ls/label_map.json")
TRAIN_CSV      = Path("data/processed/bisindo_v1/manifests/train.csv")


# ── Inference preprocessing (mirrors ml_service.py exactly) ───────────────────

def preprocess_inference(image_bytes: bytes) -> np.ndarray:
    """Exact copy of MLService._preprocess — keep in sync."""
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    arr   = np.array(image, dtype=np.uint8)
    logger.debug("[inference] decode  — shape=%s dtype=%s min=%d max=%d mean=%.1f",
                 arr.shape, arr.dtype, arr.min(), arr.max(), arr.mean())

    gray = np.dot(arr[..., :3], [0.299, 0.587, 0.114]).astype(np.uint8)
    logger.debug("[inference] gray   — shape=%s dtype=%s min=%d max=%d mean=%.1f",
                 gray.shape, gray.dtype, gray.min(), gray.max(), gray.mean())

    rgb = np.stack([gray, gray, gray], axis=-1)

    rgb = np.array(
        Image.fromarray(rgb).resize((224, 224), Image.BILINEAR),
        dtype=np.uint8,
    )
    logger.debug("[inference] resize — shape=%s dtype=%s min=%d max=%d mean=%.1f",
                 rgb.shape, rgb.dtype, rgb.min(), rgb.max(), rgb.mean())

    arr_f = rgb.astype(np.float32) / 255.0
    logger.debug("[inference] norm   — shape=%s dtype=%s min=%.4f max=%.4f mean=%.4f",
                 arr_f.shape, arr_f.dtype, arr_f.min(), arr_f.max(), arr_f.mean())

    return np.expand_dims(arr_f, axis=0)


# ── Training preprocessing (mirrors dataset.py exactly) ──────────────────────

def preprocess_training(filepath: str) -> np.ndarray:
    """Exact copy of the tf.data pipeline: decode → resize → /255."""
    raw   = tf.io.read_file(filepath)
    image = tf.image.decode_jpeg(raw, channels=3)
    image = tf.image.resize(image, (224, 224))
    image = tf.cast(image, tf.float32) / 255.0
    # tf_normalize is identity — no-op
    arr = image.numpy()
    logger.debug("[training]  pipe   — shape=%s dtype=%s min=%.4f max=%.4f mean=%.4f",
                 arr.shape, arr.dtype, arr.min(), arr.max(), arr.mean())
    return np.expand_dims(arr, axis=0)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if not MODEL_DIR.exists():
        sys.exit(f"Model not found: {MODEL_DIR}")
    if not LABEL_MAP_PATH.exists():
        sys.exit(f"Label map not found: {LABEL_MAP_PATH}")
    if not TRAIN_CSV.exists():
        sys.exit(f"Training manifest not found: {TRAIN_CSV}")

    # Load model
    logger.info("Loading model from %s ...", MODEL_DIR)
    loaded = tf.saved_model.load(str(MODEL_DIR))
    infer  = loaded.signatures["serving_default"]
    input_key = list(infer.structured_input_signature[1].keys())[0]
    output_key = list(infer.structured_outputs.keys())[0]

    label_map = json.loads(LABEL_MAP_PATH.read_text())
    logger.info("Loaded %d classes\n", len(label_map))

    # Pick one sample per class from training CSV
    samples_by_class: dict[str, str] = {}
    with open(TRAIN_CSV, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            label = row["label"].strip()
            if label not in samples_by_class:
                samples_by_class[label] = row["filepath"]
    if not samples_by_class:
        sys.exit("No samples found in training CSV")

    results = {"correct": 0, "wrong": 0, "missing": 0}

    for expected_label in sorted(samples_by_class.keys()):
        filepath = samples_by_class[expected_label]
        if not Path(filepath).exists():
            logger.warning("SKIP  %s — file not found: %s", expected_label, filepath)
            results["missing"] += 1
            continue

        # ── Run through INFERENCE preprocessing ──────────────────────
        image_bytes = Path(filepath).read_bytes()
        arr_inf = preprocess_inference(image_bytes)

        output = infer(**{input_key: tf.constant(arr_inf)})
        probs  = output[output_key][0].numpy()
        pred_idx  = int(np.argmax(probs))
        pred_conf = float(probs[pred_idx])
        pred_label = label_map[str(pred_idx)]

        ok = pred_label == expected_label
        tag = "OK " if ok else "FAIL"
        logger.info("[%s] expected=%-2s  predicted=%-2s  conf=%.4f", tag, expected_label, pred_label, pred_conf)

        if not ok:
            results["wrong"] += 1
            # Show top-3 for failures
            top3 = np.argsort(probs)[::-1][:3]
            for rank, idx in enumerate(top3, 1):
                logger.info("       #%d  %s  %.4f", rank, label_map[str(idx)], float(probs[idx]))
        else:
            results["correct"] += 1

        # ── Compare inference vs training preprocessing ──────────────
        arr_train = preprocess_training(filepath)
        diff = np.abs(arr_inf - arr_train)
        logger.debug("  pixel diff  — max=%.6f mean=%.6f\n",
                      diff.max(), diff.mean())

    logger.info("\n=== Summary ===")
    total = results["correct"] + results["wrong"]
    logger.info("Correct: %d/%d (%.1f%%)", results["correct"], total,
                100 * results["correct"] / total if total else 0)
    logger.info("Wrong:   %d/%d", results["wrong"], total)
    logger.info("Missing: %d", results["missing"])

    if results["wrong"] > 0:
        logger.info("\nFailed classes → likely preprocessing mismatch or model issue.")
    else:
        logger.info("\nAll classes predicted correctly from training images.")
        logger.info("If live webcam still fails → issue is in frontend crop/flip pipeline.")


if __name__ == "__main__":
    main()
