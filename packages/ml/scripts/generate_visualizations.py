# packages/ml/scripts/generate_visualizations.py
"""
Post-training visualization suite for BISINDO EfficientNetV2B0.

Generates publication-quality figures for research/paper purposes.
All outputs are saved as .png files to --output_dir (default: reports/figures/).

Usage (from repo root, signify-ml env):
    python packages/ml/scripts/generate_visualizations.py \
        --history    models/checkpoints/bisindo_v2/training_history.json \
        --phase1_csv models/checkpoints/bisindo_v2/phase1_history.csv \
        --phase2_csv models/checkpoints/bisindo_v2/phase2_history.csv \
        --model      models/checkpoints/bisindo_v2/final_model.keras \
        --test_csv   data/processed/bisindo_v1/manifests/test.csv \
        --label_map  data/processed/bisindo_v1/manifests/label_map.csv \
        --output_dir reports/figures \
        --v1_acc 0.9901 --v1_top5 0.9998

    # Optional flags:
    --skip_gradcam          # Grad-CAM is slow (~5 min for 26 classes), skip if needed
    --skip_roc              # ROC curve (memory-intensive for 26 classes)
    --skip_samples          # Sample prediction grid

Outputs:
    REQUIRED (6 figures)
      learning_curves.png         — train/val accuracy & loss per epoch
      confusion_matrix.png        — 26×26 normalized heatmap
      classification_report.png   — precision/recall/F1 per class heatmap
      f1_bar_chart.png            — per-class F1 score, sorted, color-coded
      architecture_diagram.png    — model pipeline block diagram
      model_comparison.png        — MobileNetV2 v1 vs EfficientNetV2B0 v2 bar chart

    IMPORTANT (4 figures + 1 table)
      lr_schedule.png             — learning rate per epoch (both phases)
      roc_curves.png              — one-vs-rest ROC with macro AUC
      gradcam_samples.png         — one Grad-CAM sample per class (26-panel grid)
      experiment_table.md         — markdown comparison table

    SUPPLEMENTARY (4 figures)
      class_distribution.png      — sample count per class (train/val/test)
      confidence_distribution.png — histogram of max softmax probabilities on test set
      topk_accuracy.png           — Top-1, Top-3, Top-5 accuracy bars
      sample_predictions.png      — grid of correct/incorrect predictions
"""

import argparse
import csv
import json
import logging
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import tensorflow as tf
from sklearn.metrics import (
    auc,
    classification_report,
    confusion_matrix,
    roc_curve,
)
from sklearn.preprocessing import label_binarize

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from ml.data.dataset import build_dataset, load_label_map

logging.basicConfig(
    level   = logging.INFO,
    format  = "%(asctime)s | %(levelname)s | %(message)s",
    datefmt = "%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Global style ──────────────────────────────────────────────────────────────

DPI         = 150
CLR_TRAIN   = "#2563eb"   # blue  — training metrics
CLR_VAL     = "#dc2626"   # red   — validation metrics
CLR_V1      = "#6b7280"   # gray  — MobileNetV2 v1 (baseline)
CLR_V2      = "#2563eb"   # blue  — EfficientNetV2B0 v2

plt.rcParams.update({
    "font.family":        "DejaVu Sans",
    "axes.spines.top":    False,
    "axes.spines.right":  False,
    "axes.grid":          True,
    "grid.alpha":         0.35,
    "grid.linestyle":     "--",
    "figure.dpi":         DPI,
})


# ── Argparse ──────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Generate post-training visualizations")

    p.add_argument("--history",   default="models/checkpoints/bisindo_v2/training_history.json")
    p.add_argument("--model",     default="models/checkpoints/bisindo_v2/final_model.keras")
    p.add_argument("--test_csv",  default="data/processed/bisindo_v1/manifests/test.csv")
    p.add_argument("--train_csv", default="data/processed/bisindo_v1/manifests/train.csv")
    p.add_argument("--val_csv",   default="data/processed/bisindo_v1/manifests/valid.csv")
    p.add_argument("--label_map", default="data/processed/bisindo_v1/manifests/label_map.csv")
    p.add_argument("--output_dir", default="reports/figures")
    p.add_argument("--batch_size", type=int, default=32)

    # Comparison metrics for MobileNetV2 v1
    p.add_argument("--v1_acc",   type=float, default=0.9901,
                   help="MobileNetV2 v1 top-1 accuracy (from previous training run)")
    p.add_argument("--v1_top5",  type=float, default=None,
                   help="MobileNetV2 v1 top-5 accuracy (optional)")
    p.add_argument("--v1_label", type=str,   default="MobileNetV2 v1",
                   help="Display label for v1 model in comparison chart")

    p.add_argument("--phase1_csv", default=None,
                   help="CSV fallback for phase1 history (used when JSON arrays are empty)")
    p.add_argument("--phase2_csv", default=None,
                   help="CSV fallback for phase2 history (used when JSON arrays are empty)")

    p.add_argument("--skip_gradcam",  action="store_true",
                   help="Skip Grad-CAM (slow: ~5 min for 26 classes)")
    p.add_argument("--skip_roc",      action="store_true",
                   help="Skip ROC curve (memory-intensive for 26 classes)")
    p.add_argument("--skip_samples",  action="store_true",
                   help="Skip sample prediction grid")

    return p.parse_args()


# ── Data helpers ──────────────────────────────────────────────────────────────

def load_history(path: str) -> Dict:
    """Load training_history.json saved by trainer.py."""
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _load_phase_from_csv(csv_path: str) -> Dict[str, List[float]]:
    """Load a phase history CSV into the same dict format as the JSON structure."""
    csv_to_json = {
        "accuracy": "accuracy",
        "val_accuracy": "val_accuracy",
        "loss": "loss",
        "val_loss": "val_loss",
        "learning_rate": "lr",
    }
    result: Dict[str, List[float]] = {v: [] for v in csv_to_json.values()}
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            for csv_col, json_key in csv_to_json.items():
                if csv_col in row:
                    result[json_key].append(float(row[csv_col]))
    return result


def build_combined_history(
    history: Dict,
    phase1_csv: Optional[str] = None,
    phase2_csv: Optional[str] = None,
) -> Dict:
    """
    Concatenate phase1 and phase2 metrics into continuous sequences.
    Falls back to CSV files when JSON arrays are empty.
    Returns dict with keys: accuracy, val_accuracy, loss, val_loss, lr, phase_boundary.
    """
    p1 = history["phase1"]
    p2 = history["phase2"]

    # Fallback to CSV when JSON arrays are empty or incomplete
    if phase1_csv and not p1.get("accuracy"):
        logger.info("Phase1 JSON empty — falling back to CSV: %s", phase1_csv)
        p1 = _load_phase_from_csv(phase1_csv)

    if phase2_csv and (not p2.get("accuracy") or not p2.get("lr")):
        logger.info("Phase2 JSON incomplete — falling back to CSV: %s", phase2_csv)
        p2 = _load_phase_from_csv(phase2_csv)

    combined = {}
    for key in ("accuracy", "val_accuracy", "loss", "val_loss", "lr"):
        combined[key] = p1.get(key, []) + p2.get(key, [])
    combined["phase_boundary"] = len(p1.get("accuracy", []))
    return combined


def get_predictions(
    model: tf.keras.Model,
    test_ds: tf.data.Dataset,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Run inference on the full test set once and return:
        y_true  — true integer labels
        y_pred  — predicted integer labels (argmax)
        y_proba — softmax probability matrix (n_samples, n_classes)
    """
    logger.info("Running inference on test set (cached for all visualizations)...")
    all_true, all_proba = [], []
    for images, labels in test_ds:
        proba = model(images, training=False).numpy()
        all_true.append(labels.numpy())
        all_proba.append(proba)

    y_true  = np.concatenate(all_true)
    y_proba = np.concatenate(all_proba)
    y_pred  = np.argmax(y_proba, axis=1)
    logger.info("Inference complete: %d samples, %d classes", len(y_true), y_proba.shape[1])
    return y_true, y_pred, y_proba


# ── 1. Learning Curves ────────────────────────────────────────────────────────

def plot_learning_curves(combined: Dict, output_dir: Path) -> None:
    """Accuracy and loss curves for both phases, with phase boundary marker."""
    epochs = range(1, len(combined["accuracy"]) + 1)
    boundary = combined["phase_boundary"]

    fig, (ax_acc, ax_loss) = plt.subplots(1, 2, figsize=(14, 5))
    fig.suptitle("EfficientNetV2B0 — Training History (BISINDO 26-class)", fontsize=13, y=1.01)

    for ax, metric, title in [
        (ax_acc,  ("accuracy",     "val_accuracy"), "Accuracy"),
        (ax_loss, ("loss",         "val_loss"),     "Loss"),
    ]:
        train_key, val_key = metric
        ax.plot(epochs, combined[train_key], color=CLR_TRAIN, lw=1.8, label="Train")
        ax.plot(epochs, combined[val_key],   color=CLR_VAL,   lw=1.8, label="Val",   linestyle="--")
        if boundary > 0:
            ax.axvline(boundary, color="#6b7280", lw=1.2, linestyle=":", label=f"Phase 2 starts (ep {boundary})")
        ax.set_title(title)
        ax.set_xlabel("Epoch")
        ax.legend(framealpha=0.4)

    ax_acc.set_ylabel("Accuracy")
    ax_acc.yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f"{v:.1%}"))
    ax_loss.set_ylabel("Loss")

    fig.tight_layout()
    out = output_dir / "learning_curves.png"
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved: %s", out)


# ── 2. Confusion Matrix ───────────────────────────────────────────────────────

def plot_confusion_matrix(
    y_true:    np.ndarray,
    y_pred:    np.ndarray,
    label_map: Dict[str, int],
    output_dir: Path,
) -> None:
    """Normalized 26×26 confusion matrix heatmap."""
    classes = [k for k, _ in sorted(label_map.items(), key=lambda x: x[1])]
    cm      = confusion_matrix(y_true, y_pred, normalize="true")

    fig, ax = plt.subplots(figsize=(15, 13))
    im = ax.imshow(cm, interpolation="nearest", cmap="Blues", vmin=0, vmax=1)
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)

    ax.set(
        xticks     = range(len(classes)),
        yticks     = range(len(classes)),
        xticklabels = classes,
        yticklabels = classes,
        xlabel      = "Predicted",
        ylabel      = "True",
        title       = "Confusion Matrix — EfficientNetV2B0 (normalized, test set)",
    )
    ax.tick_params(axis="x", rotation=45)

    # Annotate cells where recall < 0.95 to highlight errors
    thresh = 0.5
    for i in range(len(classes)):
        for j in range(len(classes)):
            val = cm[i, j]
            if val > 0.01:   # skip near-zero cells to avoid clutter
                ax.text(
                    j, i, f"{val:.2f}",
                    ha="center", va="center", fontsize=6,
                    color="white" if val > thresh else "black",
                )

    fig.tight_layout()
    out = output_dir / "confusion_matrix.png"
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved: %s", out)


# ── 3. Classification Report Heatmap ─────────────────────────────────────────

def plot_classification_report_heatmap(
    y_true:    np.ndarray,
    y_pred:    np.ndarray,
    label_map: Dict[str, int],
    output_dir: Path,
) -> None:
    """Per-class precision, recall, F1 as a color-coded heatmap."""
    classes = [k for k, _ in sorted(label_map.items(), key=lambda x: x[1])]
    report  = classification_report(y_true, y_pred, target_names=classes, output_dict=True)

    metrics = ["precision", "recall", "f1-score"]
    data    = np.array([[report[cls][m] for m in metrics] for cls in classes])

    fig, ax = plt.subplots(figsize=(7, 13))
    im = ax.imshow(data, aspect="auto", cmap="RdYlGn", vmin=0.7, vmax=1.0)
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)

    ax.set(
        xticks      = range(len(metrics)),
        yticks      = range(len(classes)),
        xticklabels = ["Precision", "Recall", "F1-Score"],
        yticklabels = classes,
        title       = "Classification Report — Per-class Metrics (test set)",
    )

    for i, cls in enumerate(classes):
        for j, metric in enumerate(metrics):
            val = data[i, j]
            ax.text(j, i, f"{val:.3f}", ha="center", va="center", fontsize=8,
                    color="black" if val > 0.75 else "white")

    # Summary row (macro avg)
    macro = report["macro avg"]
    summary = f"Macro avg — P: {macro['precision']:.3f}  R: {macro['recall']:.3f}  F1: {macro['f1-score']:.3f}"
    ax.set_xlabel(summary, fontsize=9)

    fig.tight_layout()
    out = output_dir / "classification_report.png"
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved: %s", out)


# ── 4. Model Comparison Bar Chart ─────────────────────────────────────────────

def plot_model_comparison(
    v2_acc:    float,
    v2_top5:   Optional[float],
    v1_acc:    float,
    v1_top5:   Optional[float],
    v1_label:  str,
    output_dir: Path,
) -> None:
    """Side-by-side bar chart comparing v1 (MobileNetV2) vs v2 (EfficientNetV2B0)."""
    v2_label = "EfficientNetV2B0 v2"
    has_top5 = v1_top5 is not None and v2_top5 is not None

    if has_top5:
        metrics = ["Top-1 Accuracy", "Top-5 Accuracy"]
        v1_vals = [v1_acc, v1_top5]
        v2_vals = [v2_acc, v2_top5]
    else:
        metrics = ["Top-1 Accuracy"]
        v1_vals = [v1_acc]
        v2_vals = [v2_acc]

    x     = np.arange(len(metrics))
    width = 0.35

    fig, ax = plt.subplots(figsize=(8, 5))
    bars_v1 = ax.bar(x - width / 2, v1_vals, width, label=v1_label,  color=CLR_V1, alpha=0.85)
    bars_v2 = ax.bar(x + width / 2, v2_vals, width, label=v2_label, color=CLR_V2, alpha=0.85)

    # Value labels on bars
    for bar in [*bars_v1, *bars_v2]:
        h = bar.get_height()
        ax.text(
            bar.get_x() + bar.get_width() / 2, h + 0.002,
            f"{h:.2%}", ha="center", va="bottom", fontsize=9, fontweight="bold",
        )

    # Y-axis range: zoom in to show difference clearly
    all_vals  = v1_vals + v2_vals
    y_min     = max(0, min(all_vals) - 0.03)
    ax.set_ylim(y_min, 1.02)
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f"{v:.0%}"))
    ax.set(
        xticks    = x,
        xticklabels = metrics,
        ylabel    = "Accuracy",
        title     = "Model Comparison — BISINDO 26-class Test Set",
    )
    ax.legend(framealpha=0.5)
    ax.grid(axis="x", alpha=0)   # only horizontal grid

    fig.tight_layout()
    out = output_dir / "model_comparison.png"
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved: %s", out)


# ── 5. Learning Rate Schedule ─────────────────────────────────────────────────

def plot_lr_schedule(combined: Dict, output_dir: Path) -> None:
    """Learning rate per epoch for both phases."""
    combined_lr = combined.get("lr", [])
    boundary    = combined.get("phase_boundary", 0)
    if not combined_lr:
        logger.warning("No lr data available — skipping lr_schedule.png")
        return

    epochs = range(1, len(combined_lr) + 1)

    fig, ax = plt.subplots(figsize=(10, 4))
    ax.semilogy(list(epochs[:boundary]),  combined_lr[:boundary],
                color=CLR_TRAIN, lw=1.8, label="Phase 1")
    ax.semilogy(list(epochs[boundary:]),  combined_lr[boundary:],
                color=CLR_V2,   lw=1.8, label="Phase 2", linestyle="--")
    if boundary > 0:
        ax.axvline(boundary, color="#6b7280", lw=1, linestyle=":", label=f"Phase 2 starts (ep {boundary})")

    ax.set(
        xlabel = "Epoch",
        ylabel = "Learning Rate (log scale)",
        title  = "Learning Rate Schedule",
    )
    ax.legend(framealpha=0.4)
    fig.tight_layout()

    out = output_dir / "lr_schedule.png"
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved: %s", out)


# ── 6. ROC Curves ─────────────────────────────────────────────────────────────

def plot_roc_curves(
    y_true:    np.ndarray,
    y_proba:   np.ndarray,
    label_map: Dict[str, int],
    output_dir: Path,
) -> None:
    """One-vs-Rest ROC curve with macro-average AUC."""
    n_classes = len(label_map)
    classes   = [k for k, _ in sorted(label_map.items(), key=lambda x: x[1])]
    y_bin     = label_binarize(y_true, classes=range(n_classes))

    fig, ax = plt.subplots(figsize=(10, 8))

    # Per-class ROC (thin, low alpha)
    all_fpr, all_tpr = [], []
    for i, cls in enumerate(classes):
        fpr, tpr, _ = roc_curve(y_bin[:, i], y_proba[:, i])
        roc_auc     = auc(fpr, tpr)
        ax.plot(fpr, tpr, lw=0.8, alpha=0.35, color=CLR_V2)
        all_fpr.append(fpr)
        all_tpr.append(tpr)

    # Macro-average ROC (interpolated)
    mean_fpr  = np.linspace(0, 1, 500)
    mean_tpr  = np.mean([np.interp(mean_fpr, fpr, tpr) for fpr, tpr in zip(all_fpr, all_tpr)], axis=0)
    macro_auc = auc(mean_fpr, mean_tpr)
    ax.plot(mean_fpr, mean_tpr, color=CLR_TRAIN, lw=2.5, label=f"Macro avg (AUC = {macro_auc:.4f})")

    ax.plot([0, 1], [0, 1], "k--", lw=1, alpha=0.5, label="Random classifier")
    ax.set(
        xlim   = [0, 1],
        ylim   = [0, 1.01],
        xlabel = "False Positive Rate",
        ylabel = "True Positive Rate",
        title  = f"ROC Curves — EfficientNetV2B0 ({n_classes}-class One-vs-Rest)",
    )
    ax.legend(loc="lower right", framealpha=0.5)

    fig.tight_layout()
    out = output_dir / "roc_curves.png"
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved: %s (macro AUC = %.4f)", out, macro_auc)


# ── 7. Grad-CAM Samples ───────────────────────────────────────────────────────

def _find_last_conv_name(base_model: tf.keras.Model) -> str:
    """Find the last Conv2D layer in the base model (EfficientNetV2B0)."""
    for layer in reversed(base_model.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            return layer.name
    raise ValueError("No Conv2D layer found in base model. Check model architecture.")


def _compute_gradcam(
    grad_model: tf.keras.Model,
    head_model: tf.keras.Model,
    img_norm:   tf.Tensor,     # (1, 224, 224, 3) float32 in [0, 1]
    class_idx:  int,
) -> np.ndarray:
    """Return Grad-CAM heatmap (224×224) for the given class index."""
    img_batch = tf.expand_dims(img_norm, axis=0)

    with tf.GradientTape() as tape:
        conv_out, base_out = grad_model(img_batch, training=False)
        tape.watch(conv_out)
        preds = head_model(base_out, training=False)
        loss  = preds[:, class_idx]

    grads = tape.gradient(loss, conv_out)
    if grads is None:
        return np.zeros((224, 224), dtype=np.float32)

    pooled      = tf.reduce_mean(grads, axis=(0, 1, 2)).numpy()
    conv_np     = conv_out[0].numpy().copy()
    conv_np    *= pooled[np.newaxis, np.newaxis, :]
    heatmap     = np.mean(conv_np, axis=-1)
    heatmap     = np.maximum(heatmap, 0)
    max_val     = np.max(heatmap)
    if max_val > 0:
        heatmap /= max_val
    return cv2.resize(heatmap.astype(np.float32), (224, 224))


def plot_gradcam_samples(
    model:      tf.keras.Model,
    test_csv:   str,
    label_map:  Dict[str, int],
    output_dir: Path,
) -> None:
    """
    26-panel Grad-CAM grid: one representative sample per class.
    Uses the first correctly-classified test image for each class.

    Normalization: EfficientNetV2B0 expects [0, 1] (include_preprocessing=False).
    Last conv layer is found automatically from the base model.
    """
    logger.info("Generating Grad-CAM samples (26 classes)...")
    classes     = [k for k, _ in sorted(label_map.items(), key=lambda x: x[1])]
    idx_to_cls  = {v: k for k, v in label_map.items()}

    # Build per-class sample index from test CSV
    class_images: Dict[str, List[str]] = {cls: [] for cls in classes}
    with open(test_csv, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            lbl = row["label"].strip()
            if lbl in class_images:
                class_images[lbl].append(row["filepath"])

    # Build grad_model + head_model (same pattern as gradcam.py, fixed for EfficientNetV2B0)
    base           = model.layers[1]
    last_conv_name = _find_last_conv_name(base)
    logger.info("Using last conv layer for Grad-CAM: %s", last_conv_name)

    last_conv  = base.get_layer(last_conv_name)
    grad_model = tf.keras.Model(
        inputs  = base.input,
        outputs = [last_conv.output, base.output],
    )
    head_input = tf.keras.Input(shape=base.output_shape[1:])
    x = head_input
    for layer in model.layers[2:]:
        x = layer(x)
    head_model = tf.keras.Model(inputs=head_input, outputs=x)

    n_cols  = 6
    n_rows  = 5   # ceil(26 / 6) = 5
    fig, axes = plt.subplots(n_rows, n_cols, figsize=(n_cols * 3.5, n_rows * 3.5))
    fig.suptitle("Grad-CAM — One Sample per Class (EfficientNetV2B0)", fontsize=13)

    for ax in axes.flat:
        ax.axis("off")

    for idx, cls in enumerate(classes):
        ax  = axes[idx // n_cols, idx % n_cols]
        imgs = class_images.get(cls, [])
        if not imgs:
            ax.set_title(f"{cls}\n(no samples)", fontsize=8)
            continue

        # Find first correctly predicted sample for this class
        overlay_img = None
        for img_path in imgs:
            raw  = tf.io.read_file(img_path)
            img  = tf.image.decode_jpeg(raw, channels=3)
            img  = tf.image.resize(img, [224, 224])
            # EfficientNetV2B0 normalization: [0, 255] → [0, 1]
            norm = tf.cast(img, tf.float32) / 255.0

            preds     = model(tf.expand_dims(norm, 0), training=False)
            pred_idx  = int(tf.argmax(preds[0]))
            if pred_idx != idx:
                continue   # skip misclassified samples

            heatmap   = _compute_gradcam(grad_model, head_model, norm, idx)
            img_uint8 = img.numpy().astype("uint8")
            heat_col  = cv2.applyColorMap(np.uint8(255 * heatmap), cv2.COLORMAP_JET)
            heat_rgb  = cv2.cvtColor(heat_col, cv2.COLOR_BGR2RGB)
            overlay_img = (img_uint8 * 0.55 + heat_rgb * 0.45).astype("uint8")
            conf      = float(preds[0][idx])
            break

        if overlay_img is not None:
            ax.imshow(overlay_img)
            ax.set_title(f"{cls}  ({conf:.1%})", fontsize=8)
        else:
            ax.set_title(f"{cls}\n(all misclassified)", fontsize=8, color=CLR_VAL)

    fig.tight_layout()
    out = output_dir / "gradcam_samples.png"
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved: %s", out)


# ── 8. Experiment Table ───────────────────────────────────────────────────────

def export_experiment_table(
    v2_acc:    float,
    v2_top5:   Optional[float],
    v1_acc:    float,
    v1_top5:   Optional[float],
    v1_label:  str,
    y_true:    np.ndarray,
    y_pred:    np.ndarray,
    output_dir: Path,
) -> None:
    """Markdown table summarising both models side-by-side."""
    v2_label = "EfficientNetV2B0 v2"
    report   = classification_report(y_true, y_pred, output_dict=True)
    v2_macro_f1 = report["macro avg"]["f1-score"]
    n_correct   = int((y_true == y_pred).sum())
    n_total     = len(y_true)

    delta_acc = v2_acc - v1_acc
    sign      = "+" if delta_acc >= 0 else ""

    lines = [
        "# Experiment Comparison Table — BISINDO Sign Language Recognition",
        "",
        f"| Metric | {v1_label} | {v2_label} | Delta |",
        "|--------|-----------|-------------|-------|",
        f"| Top-1 Accuracy     | {v1_acc:.4f} ({v1_acc:.2%}) | {v2_acc:.4f} ({v2_acc:.2%}) | {sign}{delta_acc:.4f} |",
    ]
    if v1_top5 is not None and v2_top5 is not None:
        d5 = v2_top5 - v1_top5
        s5 = "+" if d5 >= 0 else ""
        lines.append(f"| Top-5 Accuracy     | {v1_top5:.4f} ({v1_top5:.2%}) | {v2_top5:.4f} ({v2_top5:.2%}) | {s5}{d5:.4f} |")
    lines += [
        f"| Macro F1           | — | {v2_macro_f1:.4f} | — |",
        f"| Test samples       | — | {n_total:,} ({n_correct:,} correct) | — |",
        f"| Classes            | 26 | 26 | — |",
        f"| Input size         | 224×224 | 224×224 | — |",
        f"| Normalization      | MobileNetV2 [−1,1] | EfficientNetV2B0 [0,1] | Fixed |",
        "",
        f"> Generated by `generate_visualizations.py`",
    ]

    out = output_dir / "experiment_table.md"
    out.write_text("\n".join(lines), encoding="utf-8")
    logger.info("Saved: %s", out)


# ── 9. Class Distribution ─────────────────────────────────────────────────────

def plot_class_distribution(
    train_csv:  str,
    val_csv:    str,
    test_csv:   str,
    label_map:  Dict[str, int],
    output_dir: Path,
) -> None:
    """Stacked bar chart of sample count per class across train/val/test splits."""
    classes = [k for k, _ in sorted(label_map.items(), key=lambda x: x[1])]

    def count_csv(path: str) -> Dict[str, int]:
        counts: Dict[str, int] = {cls: 0 for cls in classes}
        if not Path(path).exists():
            return counts
        with open(path, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                lbl = row["label"].strip()
                if lbl in counts:
                    counts[lbl] += 1
        return counts

    train_c = count_csv(train_csv)
    val_c   = count_csv(val_csv)
    test_c  = count_csv(test_csv)

    x      = np.arange(len(classes))
    t_vals = [train_c[c] for c in classes]
    v_vals = [val_c[c]   for c in classes]
    e_vals = [test_c[c]  for c in classes]

    fig, ax = plt.subplots(figsize=(16, 5))
    ax.bar(x, t_vals, label="Train", color=CLR_TRAIN, alpha=0.85)
    ax.bar(x, v_vals, bottom=t_vals, label="Val",   color="#f59e0b", alpha=0.85)
    ax.bar(x, e_vals, bottom=[t + v for t, v in zip(t_vals, v_vals)],
           label="Test", color=CLR_VAL, alpha=0.85)

    total = sum(t_vals) + sum(v_vals) + sum(e_vals)
    ax.set(
        xticks      = x,
        xticklabels = classes,
        xlabel      = "Class",
        ylabel      = "Sample Count",
        title       = f"Class Distribution — BISINDO Dataset (total {total:,} images)",
    )
    ax.legend(framealpha=0.5)
    fig.tight_layout()

    out = output_dir / "class_distribution.png"
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved: %s", out)


# ── 10. Confidence Distribution ───────────────────────────────────────────────

def plot_confidence_distribution(
    y_true:    np.ndarray,
    y_pred:    np.ndarray,
    y_proba:   np.ndarray,
    output_dir: Path,
) -> None:
    """Histogram of max softmax probability, separated by correct/incorrect."""
    max_conf = np.max(y_proba, axis=1)
    correct  = y_true == y_pred

    fig, ax = plt.subplots(figsize=(10, 5))
    bins = np.linspace(0, 1, 51)
    ax.hist(max_conf[correct],  bins=bins, alpha=0.7, color=CLR_TRAIN, label="Correct")
    ax.hist(max_conf[~correct], bins=bins, alpha=0.7, color=CLR_VAL,   label="Incorrect")
    ax.axvline(0.7, color="#6b7280", lw=1.5, linestyle="--", label="Threshold (0.70)")

    ax.set(
        xlabel = "Max Softmax Probability (Confidence)",
        ylabel = "Count",
        title  = "Confidence Score Distribution — Test Set",
    )
    ax.legend(framealpha=0.5)
    fig.tight_layout()

    out = output_dir / "confidence_distribution.png"
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved: %s", out)


# ── 11. Top-K Accuracy ────────────────────────────────────────────────────────

def plot_topk_accuracy(
    y_true:    np.ndarray,
    y_proba:   np.ndarray,
    output_dir: Path,
) -> None:
    """Bar chart of Top-1, Top-3, Top-5 accuracy."""
    def topk(k: int) -> float:
        top_k_preds = np.argsort(y_proba, axis=1)[:, -k:]
        return float(np.mean([y_true[i] in top_k_preds[i] for i in range(len(y_true))]))

    ks    = [1, 3, 5]
    accs  = [topk(k) for k in ks]
    labels = [f"Top-{k}" for k in ks]

    fig, ax = plt.subplots(figsize=(7, 5))
    bars = ax.bar(labels, accs, color=[CLR_V2, "#3b82f6", "#93c5fd"], alpha=0.88, width=0.5)

    for bar, acc in zip(bars, accs):
        ax.text(
            bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.002,
            f"{acc:.2%}", ha="center", va="bottom", fontsize=11, fontweight="bold",
        )

    y_min = max(0, min(accs) - 0.03)
    ax.set_ylim(y_min, 1.02)
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f"{v:.0%}"))
    ax.set(
        ylabel = "Accuracy",
        title  = "Top-K Accuracy — EfficientNetV2B0 (test set)",
    )
    ax.grid(axis="x", alpha=0)
    fig.tight_layout()

    out = output_dir / "topk_accuracy.png"
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved: %s  [Top-1: %.2f%%, Top-3: %.2f%%, Top-5: %.2f%%]",
                out, accs[0] * 100, accs[1] * 100, accs[2] * 100)


# ── 12. Architecture Diagram ─────────────────────────────────────────────────

def plot_architecture_diagram(output_dir: Path) -> None:
    """Static block diagram of the EfficientNetV2B0 classification pipeline."""
    from matplotlib.patches import FancyBboxPatch

    blocks = [
        ("Input\n224 × 224 × 3",                              "#e0f2fe", ""),
        ("EfficientNetV2B0\nImageNet pretrained, ~7.2 M params\n"
         "Phase 1: frozen  |  Phase 2: unfreeze layer 240+",  "#dbeafe", "backbone"),
        ("GlobalAveragePooling2D",                             "#f0fdf4", ""),
        ("BatchNormalization",                                 "#f0fdf4", ""),
        ("Dropout (0.3)",                                      "#fef9c3", "regularization"),
        ("Dense (256, ReLU)",                                  "#dbeafe", ""),
        ("Dropout (0.15)",                                     "#fef9c3", "regularization"),
        ("Dense (26, Softmax)",                                "#dbeafe", "classifier"),
        ("Output\n26 BISINDO Letter Classes (A – z)",          "#e0f2fe", ""),
    ]

    n        = len(blocks)
    block_h  = 1.0
    gap      = 0.6
    total_h  = n * block_h + (n - 1) * gap + 2
    fig, ax  = plt.subplots(figsize=(7, total_h * 0.65))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, total_h)
    ax.axis("off")
    ax.set_title("Model Architecture — EfficientNetV2B0 (BISINDO)", fontsize=13, pad=12)

    cx = 5.0
    bw = 8.0

    for i, (label, color, tag) in enumerate(blocks):
        y = total_h - 1.2 - i * (block_h + gap)
        rect = FancyBboxPatch(
            (cx - bw / 2, y - block_h / 2), bw, block_h,
            boxstyle="round,pad=0.15", facecolor=color, edgecolor="#94a3b8", lw=1.2,
        )
        ax.add_patch(rect)
        ax.text(cx, y, label, ha="center", va="center", fontsize=8, fontweight="bold")

        # Arrow to next block
        if i < n - 1:
            ay = y - block_h / 2
            ax.annotate(
                "", xy=(cx, ay - gap + 0.05), xytext=(cx, ay - 0.05),
                arrowprops=dict(arrowstyle="->", color="#64748b", lw=1.5),
            )

    fig.tight_layout()
    out = output_dir / "architecture_diagram.png"
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved: %s", out)


# ── 13. Sample Prediction Grid ──────────────────────────────────────────────

def plot_sample_predictions(
    model:      tf.keras.Model,
    test_csv:   str,
    label_map:  Dict[str, int],
    y_true:     np.ndarray,
    y_pred:     np.ndarray,
    y_proba:    np.ndarray,
    output_dir: Path,
    n_correct:  int = 18,
    n_incorrect: int = 6,
) -> None:
    """Grid of correct and incorrect predictions with confidence scores."""
    idx_to_cls = {v: k for k, v in label_map.items()}

    # Read file paths from test CSV (order matches y_true since shuffle=False)
    filepaths: List[str] = []
    with open(test_csv, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            filepaths.append(row["filepath"])

    if len(filepaths) != len(y_true):
        logger.warning("CSV rows (%d) != predictions (%d) — skipping sample grid",
                       len(filepaths), len(y_true))
        return

    correct_idx   = np.where(y_true == y_pred)[0]
    incorrect_idx = np.where(y_true != y_pred)[0]

    rng = np.random.default_rng(42)
    sel_correct   = rng.choice(correct_idx,   size=min(n_correct, len(correct_idx)),     replace=False)
    sel_incorrect = rng.choice(incorrect_idx,  size=min(n_incorrect, len(incorrect_idx)), replace=False)
    selected      = np.concatenate([sel_incorrect, sel_correct])  # incorrect first

    n_total = len(selected)
    n_cols  = 4
    n_rows  = int(np.ceil(n_total / n_cols))

    fig, axes = plt.subplots(n_rows, n_cols, figsize=(n_cols * 3.5, n_rows * 3.5))
    fig.suptitle("Sample Predictions — Correct (green) vs Incorrect (red)", fontsize=13)

    for ax_item in axes.flat:
        ax_item.axis("off")

    for panel_idx, sample_idx in enumerate(selected):
        r, c    = divmod(panel_idx, n_cols)
        ax_item = axes[r, c]
        is_ok   = y_true[sample_idx] == y_pred[sample_idx]
        conf    = float(y_proba[sample_idx, y_pred[sample_idx]])
        true_lbl = idx_to_cls.get(int(y_true[sample_idx]), "?")
        pred_lbl = idx_to_cls.get(int(y_pred[sample_idx]), "?")

        # Load and display image
        raw = tf.io.read_file(filepaths[sample_idx])
        img = tf.image.decode_jpeg(raw, channels=3)
        img = tf.image.resize(img, [224, 224]).numpy().astype("uint8")
        ax_item.imshow(img)

        color = "#22c55e" if is_ok else "#ef4444"
        title = f"True: {true_lbl}  |  Pred: {pred_lbl}  ({conf:.1%})"
        ax_item.set_title(title, fontsize=7, color=color, fontweight="bold")
        for spine in ax_item.spines.values():
            spine.set_visible(True)
            spine.set_edgecolor(color)
            spine.set_linewidth(3)

    fig.tight_layout()
    out = output_dir / "sample_predictions.png"
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved: %s  (%d correct, %d incorrect)",
                out, len(sel_correct), len(sel_incorrect))


# ── 14. Per-class F1 Bar Chart ──────────────────────────────────────────────

def plot_f1_bar_chart(
    y_true:     np.ndarray,
    y_pred:     np.ndarray,
    label_map:  Dict[str, int],
    output_dir: Path,
) -> None:
    """Horizontal bar chart of per-class F1 scores, sorted descending."""
    classes = [k for k, _ in sorted(label_map.items(), key=lambda x: x[1])]
    report  = classification_report(y_true, y_pred, target_names=classes, output_dict=True)

    f1_data = [(cls, report[cls]["f1-score"]) for cls in classes]
    f1_data.sort(key=lambda x: x[1])  # ascending for horizontal barh (top = best)

    labels = [d[0] for d in f1_data]
    values = [d[1] for d in f1_data]

    # Color by performance tier
    colors = []
    for v in values:
        if v >= 0.98:
            colors.append("#22c55e")   # green
        elif v >= 0.95:
            colors.append("#3b82f6")   # blue
        elif v >= 0.90:
            colors.append("#f59e0b")   # orange
        else:
            colors.append("#ef4444")   # red

    macro_f1 = report["macro avg"]["f1-score"]

    fig, ax = plt.subplots(figsize=(10, 10))
    bars = ax.barh(labels, values, color=colors, alpha=0.88, height=0.7)

    # Value labels
    for bar, val in zip(bars, values):
        ax.text(
            bar.get_width() + 0.003, bar.get_y() + bar.get_height() / 2,
            f"{val:.3f}", va="center", fontsize=8,
        )

    # Macro-avg reference line
    ax.axvline(macro_f1, color="#6b7280", lw=1.5, linestyle="--",
               label=f"Macro avg F1 = {macro_f1:.4f}")

    x_min = max(0, min(values) - 0.05)
    ax.set_xlim(x_min, 1.03)
    ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f"{v:.2f}"))
    ax.set(
        xlabel = "F1 Score",
        title  = "Per-class F1 Score — EfficientNetV2B0 (test set, sorted)",
    )
    ax.legend(loc="lower right", framealpha=0.5)

    fig.tight_layout()
    out = output_dir / "f1_bar_chart.png"
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved: %s  (macro F1 = %.4f)", out, macro_f1)


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    args       = parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    logger.info("Output directory: %s", output_dir)

    # ── Load history ──────────────────────────────────────────────────────────
    logger.info("Loading training history from %s", args.history)
    history  = load_history(args.history)
    combined = build_combined_history(history, args.phase1_csv, args.phase2_csv)

    # ── Load label map ────────────────────────────────────────────────────────
    label_map = load_label_map(args.label_map)
    logger.info("Label map: %d classes", len(label_map))

    # ── Load model ────────────────────────────────────────────────────────────
    logger.info("Loading model from %s", args.model)
    model = tf.keras.models.load_model(args.model)
    model.summary(print_fn=logger.info, expand_nested=False)

    # ── Build test dataset ────────────────────────────────────────────────────
    test_ds = build_dataset(
        csv_path   = args.test_csv,
        label_map  = label_map,
        batch_size = args.batch_size,
        augment    = False,
        shuffle    = False,
        cache      = False,
    )

    # ── Run inference once, reuse for all visualizations ──────────────────────
    y_true, y_pred, y_proba = get_predictions(model, test_ds)

    # ── Compute v2 metrics ────────────────────────────────────────────────────
    v2_acc  = float((y_true == y_pred).mean())
    v2_top5 = float(np.mean([
        y_true[i] in np.argsort(y_proba[i])[-5:]
        for i in range(len(y_true))
    ]))
    logger.info("v2 — Top-1: %.4f  Top-5: %.4f", v2_acc, v2_top5)

    # ── REQUIRED ──────────────────────────────────────────────────────────────
    logger.info("--- REQUIRED visualizations ---")
    plot_learning_curves(combined, output_dir)
    plot_confusion_matrix(y_true, y_pred, label_map, output_dir)
    plot_classification_report_heatmap(y_true, y_pred, label_map, output_dir)
    plot_f1_bar_chart(y_true, y_pred, label_map, output_dir)
    plot_architecture_diagram(output_dir)
    plot_model_comparison(
        v2_acc   = v2_acc,
        v2_top5  = v2_top5,
        v1_acc   = args.v1_acc,
        v1_top5  = args.v1_top5,
        v1_label = args.v1_label,
        output_dir = output_dir,
    )

    # ── IMPORTANT ─────────────────────────────────────────────────────────────
    logger.info("--- IMPORTANT visualizations ---")
    plot_lr_schedule(combined, output_dir)

    if not args.skip_roc:
        plot_roc_curves(y_true, y_proba, label_map, output_dir)
    else:
        logger.info("Skipping ROC curves (--skip_roc)")

    if not args.skip_gradcam:
        plot_gradcam_samples(model, args.test_csv, label_map, output_dir)
    else:
        logger.info("Skipping Grad-CAM (--skip_gradcam)")

    export_experiment_table(
        v2_acc   = v2_acc,
        v2_top5  = v2_top5,
        v1_acc   = args.v1_acc,
        v1_top5  = args.v1_top5,
        v1_label = args.v1_label,
        y_true   = y_true,
        y_pred   = y_pred,
        output_dir = output_dir,
    )

    # ── SUPPLEMENTARY ─────────────────────────────────────────────────────────
    logger.info("--- SUPPLEMENTARY visualizations ---")
    plot_class_distribution(args.train_csv, args.val_csv, args.test_csv, label_map, output_dir)
    plot_confidence_distribution(y_true, y_pred, y_proba, output_dir)
    plot_topk_accuracy(y_true, y_proba, output_dir)

    if not args.skip_samples:
        plot_sample_predictions(model, args.test_csv, label_map, y_true, y_pred, y_proba, output_dir)
    else:
        logger.info("Skipping sample prediction grid (--skip_samples)")

    # ── Summary ───────────────────────────────────────────────────────────────
    pngs = sorted(output_dir.glob("*.png"))
    mds  = sorted(output_dir.glob("*.md"))
    logger.info("=== Done. %d figures + %d tables saved to %s ===",
                len(pngs), len(mds), output_dir)
    for f in pngs + mds:
        logger.info("  %s", f.name)


if __name__ == "__main__":
    main()
