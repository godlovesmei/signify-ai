"""
trainer.py
----------
Fine-tunes a MobileNetV2 classifier on the BISINDO dataset.
Implements a two-phase strategy:
  1. Feature extraction  — freeze the base, train the head only (fast convergence)
  2. Fine-tuning         — unfreeze top layers, train end-to-end with a low LR

Usage:
    python ml/scripts/train.py  (calls Trainer via config)

    # Or programmatically:
    from ml.training.trainer import Trainer, TrainerConfig

    config = TrainerConfig(
        train_csv="data/bisindo_v1/processed/train/manifest.csv",
        val_csv="data/bisindo_v1/processed/valid/manifest.csv",
        num_classes=26,
        output_dir="models/checkpoints/bisindo_v1",
    )
    trainer = Trainer(config)
    trainer.run()
"""

import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

import tensorflow as tf

from ml.data.dataset import build_datasets, get_label_map, save_label_map
from ml.training.callbacks import build_callbacks
from ml.training.metrics import log_classification_report

logger = logging.getLogger(__name__)


# ── Config ────────────────────────────────────────────────────────────────────

@dataclass
class TrainerConfig:
    # Data
    train_csv: str
    val_csv: str
    test_csv: Optional[str] = None

    # Model
    num_classes: int = 26          # override if your dataset has fewer/more
    input_shape: tuple = (224, 224, 3)
    dropout_rate: float = 0.3

    # Phase 1 – feature extraction
    phase1_epochs: int = 15
    phase1_lr: float = 1e-3
    batch_size: int = 32

    # Phase 2 – fine-tuning
    phase2_epochs: int = 30
    phase2_lr: float = 1e-5
    unfreeze_from_layer: int = 100  # unfreeze all layers after this index

    # I/O
    output_dir: str = "models/checkpoints/bisindo_v1"
    label_map_path: str = "data/bisindo_v1/metadata/label_map.csv"

    # Misc
    mixed_precision: bool = True    # FP16 — set False if GPU < 6 GB VRAM
    seed: int = 42


# ── Model builder ──────────────────────────────────────────────────────────────

def build_model(num_classes: int, input_shape: tuple,
                dropout_rate: float) -> tf.keras.Model:
    """
    MobileNetV2 with a custom classification head.
    Base weights are loaded from ImageNet, top is excluded.
    """
    base = tf.keras.applications.MobileNetV2(
        input_shape=input_shape,
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False  # frozen in phase 1

    inputs = tf.keras.Input(shape=input_shape)
    # MobileNetV2 preprocess_input expects values in [-1, 1]
    # but we already apply ImageNet mean/std normalization in the pipeline,
    # so we skip the built-in preprocess_input and feed directly.
    x = base(inputs, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Dropout(dropout_rate)(x)
    x = tf.keras.layers.Dense(256, activation="relu")(x)
    x = tf.keras.layers.Dropout(dropout_rate / 2)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax")(x)

    model = tf.keras.Model(inputs, outputs, name="bisindo_mobilenetv2")
    logger.info(
        "Model built: %d trainable params (phase 1)",
        sum(tf.size(w).numpy() for w in model.trainable_weights),
    )
    return model


def _unfreeze_top_layers(model: tf.keras.Model, from_layer: int) -> None:
    """Unfreeze layers in the base starting from `from_layer` index."""
    base = model.layers[1]   # index 1 = the MobileNetV2 base
    base.trainable = True
    for layer in base.layers[:from_layer]:
        layer.trainable = False
    trainable = sum(
        tf.size(w).numpy() for w in model.trainable_weights
    )
    logger.info(
        "Phase 2: unfrozen from layer %d. Trainable params: %d",
        from_layer, trainable,
    )


# ── Trainer ────────────────────────────────────────────────────────────────────

class Trainer:
    def __init__(self, config: TrainerConfig):
        self.cfg = config
        self._setup()

    def _setup(self):
        tf.random.set_seed(self.cfg.seed)
        Path(self.cfg.output_dir).mkdir(parents=True, exist_ok=True)

        if self.cfg.mixed_precision:
            tf.keras.mixed_precision.set_global_policy("mixed_float16")
            logger.info("Mixed precision enabled (float16)")

        # Build label map and datasets
        self.label_map = get_label_map(self.cfg.train_csv)
        save_label_map(self.label_map, self.cfg.label_map_path)

        self.train_ds, self.val_ds, self.test_ds = build_datasets(
            train_csv=self.cfg.train_csv,
            val_csv=self.cfg.val_csv,
            test_csv=self.cfg.test_csv,
            label_map=self.label_map,
            batch_size=self.cfg.batch_size,
            augment=True,
        )

        self.model = build_model(
            num_classes=self.cfg.num_classes,
            input_shape=self.cfg.input_shape,
            dropout_rate=self.cfg.dropout_rate,
        )

    # ── Phase 1 ──────────────────────────────────────────────────────────────

    def _phase1(self) -> tf.keras.callbacks.History:
        logger.info("=== Phase 1: Feature extraction (%d epochs) ===",
                    self.cfg.phase1_epochs)
        self.model.compile(
            optimizer=tf.keras.optimizers.Adam(self.cfg.phase1_lr),
            loss=tf.keras.losses.SparseCategoricalCrossentropy(),
            metrics=["accuracy", tf.keras.metrics.SparseTopKCategoricalAccuracy(k=5, name="top5_acc")],
        )
        callbacks = build_callbacks(
            output_dir=self.cfg.output_dir,
            phase="phase1",
            monitor="val_accuracy",
        )
        history = self.model.fit(
            self.train_ds,
            validation_data=self.val_ds,
            epochs=self.cfg.phase1_epochs,
            callbacks=callbacks,
            verbose=1,
        )
        logger.info("Phase 1 complete. Best val_accuracy: %.4f",
                    max(history.history["val_accuracy"]))
        return history

    # ── Phase 2 ──────────────────────────────────────────────────────────────

    def _phase2(self) -> tf.keras.callbacks.History:
        logger.info("=== Phase 2: Fine-tuning (%d epochs) ===",
                    self.cfg.phase2_epochs)
        _unfreeze_top_layers(self.model, self.cfg.unfreeze_from_layer)
        self.model.compile(
            optimizer=tf.keras.optimizers.Adam(self.cfg.phase2_lr),
            loss=tf.keras.losses.SparseCategoricalCrossentropy(),
            metrics=["accuracy", tf.keras.metrics.SparseTopKCategoricalAccuracy(k=5, name="top5_acc")],
        )
        callbacks = build_callbacks(
            output_dir=self.cfg.output_dir,
            phase="phase2",
            monitor="val_accuracy",
        )
        history = self.model.fit(
            self.train_ds,
            validation_data=self.val_ds,
            epochs=self.cfg.phase2_epochs,
            callbacks=callbacks,
            verbose=1,
        )
        logger.info("Phase 2 complete. Best val_accuracy: %.4f",
                    max(history.history["val_accuracy"]))
        return history

    # ── Evaluation ────────────────────────────────────────────────────────────

    def _evaluate(self) -> Dict:
        target_ds = self.test_ds if self.test_ds else self.val_ds
        split_name = "test" if self.test_ds else "val"
        logger.info("Evaluating on %s set...", split_name)

        results = self.model.evaluate(target_ds, verbose=1, return_dict=True)
        logger.info("Evaluation results: %s", results)

        # Detailed per-class report
        log_classification_report(
            model=self.model,
            dataset=target_ds,
            label_map=self.label_map,
            output_dir=self.cfg.output_dir,
            split=split_name,
        )
        return results

    # ── Save ──────────────────────────────────────────────────────────────────

    def _save(self):
        save_path = Path(self.cfg.output_dir) / "final_model.keras"
        self.model.save(save_path)
        logger.info("Final model saved to %s", save_path)

    # ── Entrypoint ────────────────────────────────────────────────────────────

    def run(self) -> Dict:
        """Run both training phases, evaluate, and save."""
        self._phase1()
        self._phase2()
        results = self._evaluate()
        self._save()
        return results