# packages/ml/data/dataset.py
"""
Build tf.data.Dataset pipelines from manifest CSVs produced by prepare_bisindo.py.

Manifest CSV format: filepath, label
  - filepath : absolute path to a cropped JPEG image
  - label    : class name string (e.g. "A", "B", …)
"""

import csv
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import tensorflow as tf

from ml.data.preprocessing import TARGET_SIZE, tf_augment, tf_normalize

logger   = logging.getLogger(__name__)
AUTOTUNE = tf.data.AUTOTUNE


# ── Label utilities ───────────────────────────────────────────────────────────

def get_label_map(train_csv: str) -> Dict[str, int]:
    """
    Build a sorted, deterministic {class_name: int_index} map
    from the training manifest only (so val/test indices stay consistent).
    """
    labels = set()
    with open(train_csv, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            labels.add(row["label"].strip())
    label_map = {label: idx for idx, label in enumerate(sorted(labels))}
    logger.info("Label map: %d classes → %s", len(label_map), label_map)
    return label_map


def save_label_map(label_map: Dict[str, int], output_path: str) -> None:
    """Persist label map as CSV for use during inference."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["label", "index"])
        for label, idx in sorted(label_map.items(), key=lambda x: x[1]):
            writer.writerow([label, idx])
    logger.info("Label map saved to %s", output_path)


def load_label_map(path: str) -> Dict[str, int]:
    label_map = {}
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            label_map[row["label"]] = int(row["index"])
    return label_map


# ── CSV → (filepath, label_index) lists ──────────────────────────────────────

def _read_manifest(csv_path: str, label_map: Dict[str, int]) -> Tuple[List[str], List[int]]:
    filepaths, labels = [], []
    skipped = 0
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            label = row["label"].strip()
            if label not in label_map:
                logger.warning("Unknown label '%s' in %s — skipping", label, csv_path)
                skipped += 1
                continue
            filepaths.append(row["filepath"])
            labels.append(label_map[label])
    if skipped:
        logger.warning("Skipped %d rows with unknown labels in %s", skipped, csv_path)
    return filepaths, labels


# ── Image loading ─────────────────────────────────────────────────────────────

def _load_image(filepath: tf.Tensor, label: tf.Tensor) -> Tuple[tf.Tensor, tf.Tensor]:
    """
    Read a JPEG from disk and decode to a float32 [0, 1] tensor.

    Decodes as 3-channel RGB even though the source images are grayscale
    (R=G=B). This keeps the tensor shape consistent with MobileNetV2's
    expected (224, 224, 3) input.
    """
    raw   = tf.io.read_file(filepath)
    image = tf.image.decode_jpeg(raw, channels=3)
    image = tf.image.resize(image, TARGET_SIZE)
    image = tf.cast(image, tf.float32) / 255.0   # → [0, 1]
    return image, label


def _augment_and_normalize(
    image: tf.Tensor, label: tf.Tensor, augment: bool
) -> Tuple[tf.Tensor, tf.Tensor]:
    if augment:
        image = tf_augment(image)          # operates on [0, 1]
    image = tf_normalize(image)            # [0, 1] → [-1, 1]
    return image, label


# ── Public API ────────────────────────────────────────────────────────────────

def build_dataset(
    csv_path: str,
    label_map: Dict[str, int],
    batch_size: int = 32,
    augment: bool = False,
    shuffle: bool = False,
    cache: bool = True,
    repeat: bool = False,
) -> tf.data.Dataset:
    """
    Build a single tf.data.Dataset from a manifest CSV.

    Pipeline order:
        from_tensor_slices → map(load) → [cache] → [shuffle] → map(augment+norm) → batch → [repeat] → prefetch

    Caching after load but before shuffle+augmentation means:
      - Images are decoded from disk only once (fast subsequent epochs)
      - Shuffle and augmentation are re-applied randomly on each epoch

    Args:
        csv_path:   Path to the manifest CSV.
        label_map:  {class_name: int_index} dict.
        batch_size: Mini-batch size.
        augment:    Apply random augmentation (train only).
        shuffle:    Shuffle before each epoch (train only).
        cache:      Cache decoded images in RAM after first epoch.
        repeat:     Repeat indefinitely (for use with Model.fit + steps_per_epoch).

    Returns:
        Batched, prefetched tf.data.Dataset yielding (image, label) pairs.
        image shape : (batch, 224, 224, 3) float32  range [-1, 1]
        label shape : (batch,)             int32
    """
    filepaths, labels = _read_manifest(csv_path, label_map)
    n = len(filepaths)
    logger.info("Building dataset from %s: %d samples", csv_path, n)

    ds = tf.data.Dataset.from_tensor_slices(
        (filepaths, tf.cast(labels, tf.int32))
    )

    ds = ds.map(_load_image, num_parallel_calls=AUTOTUNE)

    if cache:
        ds = ds.cache()

    if shuffle:
        ds = ds.shuffle(buffer_size=min(n, 5000), reshuffle_each_iteration=True)

    ds = ds.map(
        lambda img, lbl: _augment_and_normalize(img, lbl, augment),
        num_parallel_calls=AUTOTUNE,
    )

    ds = ds.batch(batch_size, drop_remainder=False)

    if repeat:
        ds = ds.repeat()

    ds = ds.prefetch(AUTOTUNE)
    return ds


def build_datasets(
    train_csv: str,
    val_csv: str,
    test_csv: Optional[str] = None,
    label_map: Optional[Dict[str, int]] = None,
    batch_size: int = 32,
    augment: bool = True,
    cache: bool = True,
) -> Tuple[tf.data.Dataset, tf.data.Dataset, Optional[tf.data.Dataset]]:
    """
    Convenience wrapper: build train, val, and optionally test datasets.
    Label map is derived from train_csv if not provided.

    Returns:
        (train_ds, val_ds, test_ds)  — test_ds is None if test_csv is None.
    """
    if label_map is None:
        label_map = get_label_map(train_csv)

    train_ds = build_dataset(
        train_csv, label_map,
        batch_size=batch_size, augment=augment,
        shuffle=True, cache=cache, repeat=False,
    )
    val_ds = build_dataset(
        val_csv, label_map,
        batch_size=batch_size, augment=False,
        shuffle=False, cache=cache, repeat=False,
    )
    test_ds = None
    if test_csv:
        test_ds = build_dataset(
            test_csv, label_map,
            batch_size=batch_size, augment=False,
            shuffle=False, cache=False, repeat=False,
        )

    return train_ds, val_ds, test_ds


def dataset_info(csv_path: str, label_map: Dict[str, int]) -> Dict:
    """Return per-class sample counts for a manifest CSV."""
    _, labels = _read_manifest(csv_path, label_map)
    reverse   = {v: k for k, v in label_map.items()}
    counts    = {}
    for idx in labels:
        name         = reverse[idx]
        counts[name] = counts.get(name, 0) + 1
    return {"total": len(labels), "per_class": counts}