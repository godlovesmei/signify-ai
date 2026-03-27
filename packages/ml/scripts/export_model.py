# packages/ml/scripts/export_model.py
"""
Export trained BISINDO model ke dua format:
  1. SavedModel  → dipakai FastAPI backend (full TF serving)
  2. TFLite      → opsional, untuk edge/mobile deployment

Usage (jalankan dari repo root setelah training selesai):
    python packages/ml/scripts/export_model.py

    # Atau dengan path custom:
    python packages/ml/scripts/export_model.py \
        --checkpoint models/checkpoints/bisindo_v1/phase2_best.weights.h5 \
        --output_dir models/exports/bisindo_v1
"""

import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import numpy as np
import tensorflow as tf

from ml.data.dataset import load_label_map
from ml.training.trainer import TrainerConfig, build_model

logging.basicConfig(
    level   = logging.INFO,
    format  = "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt = "%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Argparse ──────────────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(description="Export BISINDO model")
    p.add_argument(
        "--checkpoint",
        default="models/checkpoints/bisindo_v2/phase2_best.weights.h5",
        help="Path ke file .weights.h5 hasil training phase 2",
    )
    p.add_argument(
        "--label_map",
        default="data/processed/bisindo_v1/manifests/label_map.csv",
        help="Path ke label_map.csv",
    )
    p.add_argument(
        "--output_dir",
        default="models/exports/bisindo_v1",
        help="Direktori output untuk SavedModel dan TFLite",
    )
    p.add_argument(
        "--num_classes", type=int, default=26,
    )
    p.add_argument(
        "--no_tflite", action="store_true",
        help="Skip konversi TFLite (lebih cepat jika hanya butuh SavedModel)",
    )
    return p.parse_args()


# ── Helpers ───────────────────────────────────────────────────────────────────

def load_trained_model(
    checkpoint_path: str,
    num_classes: int,
    input_shape: tuple = (224, 224, 3),
) -> tf.keras.Model:
    """
    Rebuild arsitektur model dan load bobot dari checkpoint.
    Semua layer dibuat trainable=True saat export (tidak ada efek saat inference).
    """
    logger.info("Building model architecture...")
    model = build_model(
        num_classes  = num_classes,
        input_shape  = input_shape,
        dropout_rate = 0.3,
    )

    # Unfreeze base supaya bobot phase 2 bisa termuat dengan benar
    base = model.layers[1]
    base.trainable = True

    logger.info("Loading weights from %s", checkpoint_path)
    model.load_weights(checkpoint_path)
    logger.info("Weights loaded successfully")
    return model


def verify_model(model: tf.keras.Model, label_map: dict) -> None:
    """Jalankan satu dummy inference untuk verifikasi model bisa dipakai."""
    dummy_input = np.zeros((1, 224, 224, 3), dtype=np.float32)
    output      = model(dummy_input, training=False)
    pred_idx    = int(np.argmax(output[0]))
    idx_to_label = {v: k for k, v in label_map.items()}
    logger.info(
        "Verification OK — dummy input → class '%s' (idx=%d, confidence=%.4f)",
        idx_to_label.get(pred_idx, "?"), pred_idx, float(output[0][pred_idx]),
    )


# ── Export SavedModel ─────────────────────────────────────────────────────────

def export_saved_model(model: tf.keras.Model, output_dir: Path) -> Path:
    """
    Export ke TF SavedModel format.
    FastAPI backend akan load model dari path ini via tf.saved_model.load().
    """
    saved_model_path = output_dir / "saved_model"
    logger.info("Exporting SavedModel → %s", saved_model_path)
    model.export(str(saved_model_path))
    logger.info("SavedModel export complete")
    return saved_model_path


# ── Export TFLite ─────────────────────────────────────────────────────────────

def export_tflite(saved_model_path: Path, output_dir: Path) -> Path:
    """
    Convert SavedModel → TFLite dengan optimasi float16.
    Cocok untuk deployment ringan atau inference di browser via TF.js.
    """
    tflite_path = output_dir / "model.tflite"
    logger.info("Converting to TFLite → %s", tflite_path)

    converter = tf.lite.TFLiteConverter.from_saved_model(str(saved_model_path))

    # Float16 quantization: ukuran model ~50% lebih kecil, akurasi hampir sama
    converter.optimizations        = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.float16]

    tflite_model = converter.convert()
    tflite_path.write_bytes(tflite_model)

    size_mb = tflite_path.stat().st_size / (1024 * 1024)
    logger.info("TFLite export complete — size: %.2f MB", size_mb)
    return tflite_path


# ── Save label map as JSON ────────────────────────────────────────────────────

def export_label_map_json(label_map: dict, output_dir: Path) -> Path:
    """
    Simpan label map sebagai JSON supaya mudah dibaca oleh backend/frontend.
    Format: {"0": "A", "1": "B", ...}  (index → class name)
    """
    import json
    idx_to_label = {str(v): k for k, v in label_map.items()}
    json_path    = output_dir / "label_map.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(idx_to_label, f, ensure_ascii=False, indent=2)
    logger.info("Label map JSON → %s", json_path)
    return json_path


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    args       = parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Load label map
    label_map = load_label_map(args.label_map)
    logger.info("Loaded label map: %d classes", len(label_map))

    # Override num_classes dari label map (lebih aman)
    num_classes = len(label_map)
    if num_classes != args.num_classes:
        logger.warning(
            "num_classes arg=%d tapi label_map punya %d class — pakai %d",
            args.num_classes, num_classes, num_classes,
        )

    # Load model + weights
    model = load_trained_model(args.checkpoint, num_classes)

    # Verifikasi
    verify_model(model, label_map)

    # Export label map JSON
    export_label_map_json(label_map, output_dir)

    # Export SavedModel
    saved_model_path = export_saved_model(model, output_dir)

    # Export TFLite (opsional)
    if not args.no_tflite:
        export_tflite(saved_model_path, output_dir)

    logger.info("=== Export selesai ===")
    logger.info("Output directory: %s", output_dir)
    logger.info("  saved_model/  ← untuk FastAPI backend")
    if not args.no_tflite:
        logger.info("  model.tflite  ← untuk edge deployment")
    logger.info("  label_map.json")


if __name__ == "__main__":
    main()