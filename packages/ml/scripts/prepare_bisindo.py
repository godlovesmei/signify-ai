# packages/ml/scripts/prepare_bisindo.py
"""
Prepare BISINDO v1 dataset: build manifest CSVs from Roboflow annotations.

NOTE: Images from Roboflow are already cropped and resized to 244x244.
      The bbox columns in _annotations.csv are leftover annotation metadata
      and do NOT need to be applied again. This script only maps each
      image filepath to its class label.

Output structure:
    data/processed/bisindo_v1/
    └── manifests/
        ├── train.csv
        ├── valid.csv
        └── test.csv

Each manifest CSV has two columns: filepath, label

Usage (run from repo root):
    python packages/ml/scripts/prepare_bisindo.py
"""

import csv
import logging
import sys
from pathlib import Path

logging.basicConfig(
    level   = logging.INFO,
    format  = "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt = "%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Paths ─────────────────────────────────────────────────────────────────────

# Repo root  (scripts/ → ml/ → packages/ → signify-ai/)
BASE_DIR   = Path(__file__).resolve().parents[3]

# Where Roboflow put the downloaded dataset
SOURCE_DIR = BASE_DIR / "data" / "processed" / "bisindo_v1"

# Where manifests will be written
MANIFEST_DIR = SOURCE_DIR / "manifests"

# Roboflow uses "valid", not "val"
SPLITS = ["train", "valid", "test"]


def build_manifest_from_annotations(
    annotations_csv: Path,
    image_dir: Path,
    output_csv: Path,
) -> dict:
    """
    Read a Roboflow _annotations.csv and write a manifest CSV
    (filepath, label) pointing at the already-processed images.

    One annotation row per unique filename — if Roboflow wrote multiple
    bbox rows for the same image file, only the first is used (the image
    itself is already the full sign, so bbox is irrelevant).

    Returns {"total": int, "skipped": int, "classes": {name: count}}
    """
    stats    = {"total": 0, "skipped": 0, "classes": {}}
    rows_out = []
    seen     = set()   # deduplicate: one manifest row per image file

    with open(annotations_csv, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    logger.info("Reading %d annotation rows from %s", len(rows), annotations_csv)

    for row in rows:
        filename = row["filename"].strip()
        label    = row["class"].strip()

        # Skip duplicate filenames
        if filename in seen:
            continue
        seen.add(filename)

        img_path = image_dir / filename
        if not img_path.exists():
            logger.warning("Image not found, skipping: %s", img_path)
            stats["skipped"] += 1
            continue

        rows_out.append({"filepath": str(img_path), "label": label})
        stats["total"]          += 1
        stats["classes"][label]  = stats["classes"].get(label, 0) + 1

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    with open(output_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["filepath", "label"])
        writer.writeheader()
        writer.writerows(rows_out)

    logger.info(
        "Manifest written: %d images → %s  (skipped %d)",
        stats["total"], output_csv, stats["skipped"],
    )
    return stats


def main():
    all_stats = {}

    for split in SPLITS:
        annotations_csv = SOURCE_DIR / split / "_annotations.csv"
        image_dir       = SOURCE_DIR / split
        output_csv      = MANIFEST_DIR / f"{split}.csv"

        if not annotations_csv.exists():
            logger.warning("Annotations not found, skipping: %s", annotations_csv)
            continue

        logger.info("=== Processing split: %s ===", split)
        stats = build_manifest_from_annotations(annotations_csv, image_dir, output_csv)
        all_stats[split] = stats

    # Summary
    logger.info("=== Summary ===")
    for split, stats in all_stats.items():
        logger.info(
            "%-6s  total=%d  classes=%d  skipped=%d",
            split, stats["total"], len(stats["classes"]), stats["skipped"],
        )


if __name__ == "__main__":
    main()