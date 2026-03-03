# packages/ml/training/metrics.py
"""
Post-training evaluation utilities untuk BISINDO MobileNetV2.

log_classification_report() dipanggil di Trainer._evaluate() setelah training
selesai untuk menghasilkan per-class precision/recall/f1 report.
"""

import csv
import logging
from pathlib import Path
from typing import Dict

import numpy as np
import tensorflow as tf

logger = logging.getLogger(__name__)


def log_classification_report(
    model:     tf.keras.Model,
    dataset:   tf.data.Dataset,
    label_map: Dict[str, int],
    output_dir: str,
    split: str = "val",
) -> Dict:
    """
    Jalankan inferensi pada `dataset`, lalu hitung dan simpan:
      - Per-class precision, recall, f1-score, support
      - Confusion matrix (sebagai CSV)
      - Overall accuracy

    Args:
        model      : model Keras yang sudah ditraining
        dataset    : tf.data.Dataset (batched, tidak di-repeat)
        label_map  : {class_name: int_index}
        output_dir : direktori output untuk menyimpan report
        split      : nama split ("val" atau "test"), dipakai di nama file

    Returns:
        Dict berisi per-class metrics dan overall accuracy.
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # ── Kumpulkan prediksi dan ground truth ───────────────────────────────────
    all_preds  = []
    all_labels = []

    logger.info("Running inference for classification report (%s)...", split)
    for images, labels in dataset:
        logits = model(images, training=False)
        preds  = tf.argmax(logits, axis=-1).numpy()
        all_preds.extend(preds.tolist())
        all_labels.extend(labels.numpy().tolist())

    all_preds  = np.array(all_preds,  dtype=np.int32)
    all_labels = np.array(all_labels, dtype=np.int32)

    num_classes = len(label_map)
    index_to_label = {v: k for k, v in label_map.items()}

    # ── Per-class metrics ─────────────────────────────────────────────────────
    report_rows = []
    for class_idx in range(num_classes):
        class_name = index_to_label.get(class_idx, str(class_idx))

        tp = int(np.sum((all_preds == class_idx) & (all_labels == class_idx)))
        fp = int(np.sum((all_preds == class_idx) & (all_labels != class_idx)))
        fn = int(np.sum((all_preds != class_idx) & (all_labels == class_idx)))
        support = int(np.sum(all_labels == class_idx))

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall    = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1        = (
            2 * precision * recall / (precision + recall)
            if (precision + recall) > 0 else 0.0
        )

        report_rows.append({
            "class":     class_name,
            "precision": round(precision, 4),
            "recall":    round(recall,    4),
            "f1":        round(f1,        4),
            "support":   support,
        })

    # Overall accuracy
    accuracy = float(np.mean(all_preds == all_labels))

    # ── Log ke console ────────────────────────────────────────────────────────
    logger.info("=== Classification Report (%s) ===", split)
    logger.info("%-6s  %-10s  %-8s  %-8s  %-8s", "Class", "Name", "Prec", "Rec", "F1")
    for row in report_rows:
        logger.info(
            "%-6s  %-10s  %-8.4f  %-8.4f  %-8.4f  (n=%d)",
            row["class"], row["class"],
            row["precision"], row["recall"], row["f1"], row["support"],
        )
    logger.info("Overall accuracy: %.4f  (%d/%d)", accuracy,
                int(accuracy * len(all_labels)), len(all_labels))

    # ── Simpan report CSV ─────────────────────────────────────────────────────
    report_path = output_dir / f"{split}_classification_report.csv"
    with open(report_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["class", "precision", "recall", "f1", "support"])
        writer.writeheader()
        writer.writerows(report_rows)
        writer.writerow({
            "class":     "OVERALL",
            "precision": "",
            "recall":    "",
            "f1":        "",
            "support":   f"accuracy={accuracy:.4f}",
        })
    logger.info("Report saved → %s", report_path)

    # ── Simpan confusion matrix CSV ───────────────────────────────────────────
    cm = np.zeros((num_classes, num_classes), dtype=np.int32)
    for true, pred in zip(all_labels, all_preds):
        cm[true][pred] += 1

    cm_path = output_dir / f"{split}_confusion_matrix.csv"
    class_names = [index_to_label[i] for i in range(num_classes)]
    with open(cm_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["true \\ pred"] + class_names)
        for i, row in enumerate(cm):
            writer.writerow([class_names[i]] + row.tolist())
    logger.info("Confusion matrix saved → %s", cm_path)

    return {
        "accuracy":    accuracy,
        "per_class":   report_rows,
        "confusion_matrix": cm,
    }