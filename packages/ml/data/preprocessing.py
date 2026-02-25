import csv
import logging
import os
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────

TARGET_SIZE = (224, 224)   # MobileNetV2 input size
PADDING_RATIO = 0.15       # Add 15 % padding around the bounding box
MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)   # ImageNet mean
STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)   # ImageNet std


# ── Low-level helpers ─────────────────────────────────────────────────────────

def _add_padding(xmin, ymin, xmax, ymax, img_w, img_h, ratio=PADDING_RATIO):
    """Expand a bounding box by `ratio` on each side, clipped to image bounds."""
    pad_x = int((xmax - xmin) * ratio)
    pad_y = int((ymax - ymin) * ratio)
    xmin = max(0, xmin - pad_x)
    ymin = max(0, ymin - pad_y)
    xmax = min(img_w, xmax + pad_x)
    ymax = min(img_h, ymax + pad_y)
    return xmin, ymin, xmax, ymax


def crop_image(image: Image.Image, xmin, ymin, xmax, ymax) -> Image.Image:
    """Crop a PIL image to the given bounding box with padding."""
    img_w, img_h = image.size
    xmin, ymin, xmax, ymax = _add_padding(xmin, ymin, xmax, ymax, img_w, img_h)
    return image.crop((xmin, ymin, xmax, ymax))


def resize_image(image: Image.Image, size=TARGET_SIZE) -> Image.Image:
    return image.resize(size, Image.BILINEAR)


def normalize_array(img_array: np.ndarray) -> np.ndarray:
    """
    Convert uint8 HxWx3 array to float32, scale to [0,1],
    then apply ImageNet mean/std normalization.
    """
    img = img_array.astype(np.float32) / 255.0
    return (img - MEAN) / STD


def pil_to_array(image: Image.Image) -> np.ndarray:
    image = image.convert("RGB")
    return np.array(image, dtype=np.uint8)


# ── High-level pipeline ───────────────────────────────────────────────────────

def process_single(image_path: str, xmin: int, ymin: int,
                   xmax: int, ymax: int) -> np.ndarray:
    """
    Full preprocessing for one sample:
    load → crop → resize → normalize → return float32 array (224,224,3)
    """
    image = Image.open(image_path).convert("RGB")
    cropped = crop_image(image, xmin, ymin, xmax, ymax)
    resized = resize_image(cropped)
    array = pil_to_array(resized)
    return normalize_array(array)


def build_manifest(
    csv_path: str,
    image_dir: str,
    output_csv: str,
    output_dir: str,
    target_size: tuple = TARGET_SIZE,
) -> dict:
    """
    Read a Roboflow CSV, crop each image to its bounding box,
    save the crop as a JPEG, and write a manifest CSV that maps
    each saved crop to its class label.

    Returns a dict with basic stats: total, per-class counts, skipped.
    """
    csv_path    = Path(csv_path)
    image_dir   = Path(image_dir)
    output_dir  = Path(output_dir)
    output_csv  = Path(output_csv)

    output_dir.mkdir(parents=True, exist_ok=True)
    output_csv.parent.mkdir(parents=True, exist_ok=True)

    stats = {"total": 0, "skipped": 0, "classes": {}}
    rows_out = []

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    logger.info("Processing %d rows from %s", len(rows), csv_path)

    for row in rows:
        filename = row["filename"]
        label    = row["class"].strip()
        xmin     = int(float(row["xmin"]))
        ymin     = int(float(row["ymin"]))
        xmax     = int(float(row["xmax"]))
        ymax     = int(float(row["ymax"]))

        src_path = image_dir / filename
        if not src_path.exists():
            logger.warning("Image not found, skipping: %s", src_path)
            stats["skipped"] += 1
            continue

        # Build a unique output filename
        stem      = Path(filename).stem
        out_name  = f"{stem}_crop.jpg"
        out_path  = output_dir / out_name

        try:
            image   = Image.open(src_path).convert("RGB")
            img_w, img_h = image.size
            xmin_p, ymin_p, xmax_p, ymax_p = _add_padding(
                xmin, ymin, xmax, ymax, img_w, img_h
            )
            crop = image.crop((xmin_p, ymin_p, xmax_p, ymax_p))
            crop = crop.resize(target_size, Image.BILINEAR)
            crop.save(out_path, "JPEG", quality=95)
        except Exception as exc:
            logger.error("Failed to process %s: %s", filename, exc)
            stats["skipped"] += 1
            continue

        rows_out.append({"filepath": str(out_path), "label": label})
        stats["total"] += 1
        stats["classes"][label] = stats["classes"].get(label, 0) + 1

    # Write manifest
    with open(output_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["filepath", "label"])
        writer.writeheader()
        writer.writerows(rows_out)

    logger.info(
        "Done. Saved %d crops to %s. Skipped %d.",
        stats["total"], output_dir, stats["skipped"]
    )
    return stats


# ── TF-level augmentation (used inside dataset.py) ───────────────────────────

def tf_augment(image: tf.Tensor) -> tf.Tensor:
    """
    Lightweight augmentation applied during training.
    Expects a float32 tensor in [0, 1] range (before ImageNet normalization).
    """
    image = tf.image.random_flip_left_right(image)
    image = tf.image.random_brightness(image, max_delta=0.15)
    image = tf.image.random_contrast(image, lower=0.8, upper=1.2)
    image = tf.image.random_saturation(image, lower=0.8, upper=1.2)
    image = tf.clip_by_value(image, 0.0, 1.0)
    return image


def tf_normalize(image: tf.Tensor) -> tf.Tensor:
    """Apply ImageNet mean/std normalization to a [0,1] float32 tensor."""
    mean = tf.constant(MEAN)
    std  = tf.constant(STD)
    return (image - mean) / std