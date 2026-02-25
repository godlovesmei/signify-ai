"""
metrics.py
----------
Evaluation utilities: per-class accuracy, confusion matrix,
classification report saved to disk.

Used by trainer.py after each training run and by evaluate.py standalone.
"""

import csv
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import tensorflow as tf

logger = logging.getLogger(__name__)


# ── Prediction helpers ────────────────────────────────────────────────────────

def collect_predictions(
    model: tf.keras.Model,
    dataset: tf.data.Dataset,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Run inference over an entire dataset.

    Returns:
        y_true: 1-D int array of ground-truth labels
        y_pred: 1-D int array of predicted labels (argmax of softmax)
    """
    y_true_list, y_pred_list = [], []

    for images, labels in dataset:
        preds  = model(images, training=False)
        y_pred = tf.argmax(preds, axis=1).numpy()
        y_true = labels.numpy()
        y_true_list.append(y_true)
        y_pred_list.append(y_pred)

    y_true = np.concatenate(y_true_list)
    y_pred = np.concatenate(y_pred_list)
    return y_true, y_pred


# ── Core metrics ──────────────────────────────────────────────────────────────

def accuracy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.mean(y_true == y_pred))


def top_k_accuracy(
    model: tf.keras.Model,
    dataset: tf.data.Dataset,
    k: int = 5,
) -> float:
    """Compute top-k accuracy by collecting raw probabilities."""
    y_true_list, probs_list = [], []
    for images, labels in dataset:
        probs = model(images, training=False).numpy()
        y_true_list.append(labels.numpy())
        probs_list.append(probs)
    y_true = np.concatenate(y_true_list)
    probs  = np.concatenate(probs_list, axis=0)

    top_k = np.argsort(probs, axis=1)[:, -k:]
    correct = np.array([y_true[i] in top_k[i] for i in range(len(y_true))])
    return float(np.mean(correct))


def per_class_accuracy(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    num_classes: int,
) -> Dict[int, float]:
    """Return {class_index: accuracy} for each class."""
    result = {}
    for cls in range(num_classes):
        mask = y_true == cls
        if mask.sum() == 0:
            result[cls] = float("nan")
        else:
            result[cls] = float(np.mean(y_pred[mask] == cls))
    return result


# ── Confusion matrix ─────────────────────────────────────────────────────────

def confusion_matrix(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    num_classes: int,
) -> np.ndarray:
    """Return a (num_classes, num_classes) int32 confusion matrix."""
    cm = np.zeros((num_classes, num_classes), dtype=np.int32)
    for t, p in zip(y_true, y_pred):
        cm[t, p] += 1
    return cm


def save_confusion_matrix(
    cm: np.ndarray,
    label_map: Dict[str, int],
    output_path: str,
) -> None:
    """Save the confusion matrix as a CSV file."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    index_to_label = {v: k for k, v in label_map.items()}
    labels = [index_to_label[i] for i in range(len(label_map))]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([""] + labels)   # header row
        for i, row in enumerate(cm):
            writer.writerow([labels[i]] + row.tolist())

    logger.info("Confusion matrix saved to %s", output_path)


# ── Classification report ─────────────────────────────────────────────────────

def classification_report(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    label_map: Dict[str, int],
) -> Dict:
    """
    Compute per-class precision, recall, F1 and support.
    Returns a dict compatible with JSON serialization.
    """
    index_to_label = {v: k for k, v in label_map.items()}
    num_classes    = len(label_map)
    report         = {}

    for cls in range(num_classes):
        label = index_to_label[cls]
        tp = int(np.sum((y_pred == cls) & (y_true == cls)))
        fp = int(np.sum((y_pred == cls) & (y_true != cls)))
        fn = int(np.sum((y_pred != cls) & (y_true == cls)))
        support = int(np.sum(y_true == cls))

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall    = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1        = (2 * precision * recall / (precision + recall)
                     if (precision + recall) > 0 else 0.0)

        report[label] = {
            "precision": round(precision, 4),
            "recall":    round(recall, 4),
            "f1":        round(f1, 4),
            "support":   support,
        }

    # Macro averages
    precisions = [v["precision"] for v in report.values()]
    recalls    = [v["recall"] for v in report.values()]
    f1s        = [v["f1"] for v in report.values()]
    report["macro_avg"] = {
        "precision": round(float(np.mean(precisions)), 4),
        "recall":    round(float(np.mean(recalls)), 4),
        "f1":        round(float(np.mean(f1s)), 4),
        "support":   int(len(y_true)),
    }
    report["overall_accuracy"] = round(accuracy(y_true, y_pred), 4)
    return report


def save_classification_report(report: Dict, output_path: str) -> None:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    logger.info("Classification report saved to %s", output_path)


# ── Convenience function (used by trainer.py) ─────────────────────────────────

def log_classification_report(
    model: tf.keras.Model,
    dataset: tf.data.Dataset,
    label_map: Dict[str, int],
    output_dir: str,
    split: str = "val",
) -> Dict:
    """
    Full evaluation pipeline:
    collect predictions → build report + confusion matrix → save both → return report.
    """
    output_dir = Path(output_dir) / "eval" / split

    logger.info("Collecting predictions on '%s' split...", split)
    y_true, y_pred = collect_predictions(model, dataset)

    report = classification_report(y_true, y_pred, label_map)
    save_classification_report(report, str(output_dir / "report.json"))

    cm = confusion_matrix(y_true, y_pred, num_classes=len(label_map))
    save_confusion_matrix(cm, label_map, str(output_dir / "confusion_matrix.csv"))

    logger.info(
        "[%s] accuracy=%.4f  macro_f1=%.4f",
        split,
        report["overall_accuracy"],
        report["macro_avg"]["f1"],
    )
    return report