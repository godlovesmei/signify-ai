# packages/ml/data/dataset.py
import csv
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import tensorflow as tf

from ml.data.preprocessing import TARGET_SIZE, tf_augment, tf_normalize

logger   = logging.getLogger(__name__)
AUTOTUNE = tf.data.AUTOTUNE


def get_label_map(train_csv: str) -> Dict[str, int]:
    labels = set()
    with open(train_csv, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            labels.add(row["label"].strip())
    label_map = {label: idx for idx, label in enumerate(sorted(labels))}
    logger.info("Label map: %d classes → %s", len(label_map), label_map)
    return label_map


def save_label_map(label_map: Dict[str, int], output_path: str) -> None:
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


def _load_image(filepath: tf.Tensor, label: tf.Tensor) -> Tuple[tf.Tensor, tf.Tensor]:
    raw   = tf.io.read_file(filepath)
    image = tf.image.decode_jpeg(raw, channels=3)
    image = tf.image.resize(image, TARGET_SIZE, method=tf.image.ResizeMethod.BILINEAR, antialias=False)
    image = tf.cast(image, tf.float32) / 255.0
    return image, label


def _augment_and_normalize(
    image: tf.Tensor, label: tf.Tensor, augment: bool
) -> Tuple[tf.Tensor, tf.Tensor]:
    if augment:
        image = tf_augment(image)
    image = tf_normalize(image)
    return image, label


def build_dataset(
    csv_path: str,
    label_map: Dict[str, int],
    batch_size: int = 32,
    augment: bool = False,
    shuffle: bool = False,
    cache: bool = True,
    repeat: bool = False,
    one_hot_labels: bool = False,
    num_classes: Optional[int] = None,
) -> tf.data.Dataset:
    """
    Build a single tf.data.Dataset from a manifest CSV.

    Pipeline order:
        from_tensor_slices → map(load) → [cache] → [shuffle] → map(augment+norm) → batch → [repeat] → prefetch

    Returns:
        Batched, prefetched tf.data.Dataset yielding (image, label) pairs.
        image shape : (batch, 224, 224, 3) float32  range [0, 1]
        label shape : (batch,)             int32 (default)
                    : (batch, num_classes) float32 (if one_hot_labels=True)
    """
    if one_hot_labels and num_classes is None:
        raise ValueError("num_classes must be provided when one_hot_labels=True")

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

    if one_hot_labels:
        ds = ds.map(
            lambda img, lbl: (img, tf.one_hot(lbl, depth=num_classes, dtype=tf.float32)),
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
    one_hot_labels: bool = False,
    num_classes: Optional[int] = None,
) -> Tuple[tf.data.Dataset, tf.data.Dataset, Optional[tf.data.Dataset]]:
    if label_map is None:
        label_map = get_label_map(train_csv)

    train_ds = build_dataset(
        train_csv, label_map,
        batch_size=batch_size, augment=augment,
        shuffle=True, cache=cache, repeat=False,
        one_hot_labels=one_hot_labels, num_classes=num_classes,
    )
    val_ds = build_dataset(
        val_csv, label_map,
        batch_size=batch_size, augment=False,
        shuffle=False, cache=cache, repeat=False,
        one_hot_labels=one_hot_labels, num_classes=num_classes,
    )
    test_ds = None
    if test_csv:
        test_ds = build_dataset(
            test_csv, label_map,
            batch_size=batch_size, augment=False,
            shuffle=False, cache=False, repeat=False,
            one_hot_labels=one_hot_labels, num_classes=num_classes,
        )

    return train_ds, val_ds, test_ds


def dataset_info(csv_path: str, label_map: Dict[str, int]) -> Dict:
    _, labels = _read_manifest(csv_path, label_map)
    reverse   = {v: k for k, v in label_map.items()}
    counts    = {}
    for idx in labels:
        name         = reverse[idx]
        counts[name] = counts.get(name, 0) + 1
    return {"total": len(labels), "per_class": counts}