# packages/ml/training/trainer.py
"""
Two-phase transfer learning trainer for BISINDO sign classification.

Phase 1 — Feature extraction:
    EfficientNetV2B0 base fully frozen; only the custom head is trained.
    Learning rate: 1e-3.

Phase 2 — Fine-tuning:
    Top layers of the base unfrozen from index 240 (~last 30% of ~340 layers).
    End-to-end training with a very low learning rate (1e-5).
"""

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional

import tensorflow as tf

from ml.data.dataset import build_datasets, get_label_map, save_label_map
from ml.training.callbacks import build_callbacks
from ml.training.metrics import log_classification_report

logger = logging.getLogger(__name__)


# ── Config ────────────────────────────────────────────────────────────────────

@dataclass
class TrainerConfig:
    # Data
    train_csv: str = "data/processed/bisindo_v1/manifests/train.csv"
    val_csv:   str = "data/processed/bisindo_v1/manifests/valid.csv"
    test_csv:  Optional[str] = "data/processed/bisindo_v1/manifests/test.csv"

    # Model
    num_classes:  int   = 26
    input_shape:  tuple = (224, 224, 3)
    dropout_rate: float = 0.3

    # Phase 1
    phase1_epochs: int   = 15
    phase1_lr:     float = 1e-3
    batch_size:    int   = 32

    # Phase 2
    phase2_epochs:       int   = 30
    phase2_lr:           float = 1e-5
    # EfficientNetV2B0 has ~340 layers; 240 keeps early/mid features frozen.
    unfreeze_from_layer: int   = 240

    # I/O
    output_dir:     str = "models/checkpoints/bisindo_v2"
    label_map_path: str = "data/processed/bisindo_v1/manifests/label_map.csv"

    # Misc
    mixed_precision: bool = True
    seed:            int  = 42


# ── Model builder ─────────────────────────────────────────────────────────────

def build_model(
    num_classes:  int,
    input_shape:  tuple,
    dropout_rate: float,
) -> tf.keras.Model:
    """
    EfficientNetV2B0 + custom classification head.

    include_preprocessing=False is required because tf_normalize() in the
    tf.data pipeline already maps [0, 1] → [-1, 1]. Leaving it True would
    apply normalization twice and corrupt every activation.
    """
    base = tf.keras.applications.EfficientNetV2B0(
        input_shape=input_shape,
        include_top=False,
        weights="imagenet",
        include_preprocessing=False,  # normalization handled in pipeline
    )
    base.trainable = False

    inputs = tf.keras.Input(shape=input_shape)
    x = base(inputs, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Dropout(dropout_rate)(x)
    x = tf.keras.layers.Dense(256, activation="relu")(x)
    x = tf.keras.layers.Dropout(dropout_rate / 2)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax", dtype="float32")(x)

    model = tf.keras.Model(inputs, outputs, name="bisindo_efficientnetv2b0")
    trainable_params = sum(tf.size(w).numpy() for w in model.trainable_weights)
    logger.info("Model built: %d trainable params (phase 1)", trainable_params)
    return model


def _unfreeze_top_layers(model: tf.keras.Model, from_layer: int) -> None:
    """
    Unfreeze EfficientNetV2B0 layers from `from_layer` index onward.
    Run `print(len(model.layers[1].layers))` to verify total layer count.
    """
    base = model.layers[1]
    base.trainable = True
    for layer in base.layers[:from_layer]:
        layer.trainable = False

    trainable_params = sum(tf.size(w).numpy() for w in model.trainable_weights)
    logger.info(
        "Phase 2: unfrozen from layer %d. Trainable params: %d",
        from_layer, trainable_params,
    )


# ── Trainer ───────────────────────────────────────────────────────────────────

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

        self.label_map = get_label_map(self.cfg.train_csv)
        save_label_map(self.label_map, self.cfg.label_map_path)

        actual_classes = len(self.label_map)
        if actual_classes != self.cfg.num_classes:
            logger.warning(
                "TrainerConfig.num_classes=%d but dataset has %d. Overriding.",
                self.cfg.num_classes, actual_classes,
            )
            self.cfg.num_classes = actual_classes

        self.train_ds, self.val_ds, self.test_ds = build_datasets(
            train_csv  = self.cfg.train_csv,
            val_csv    = self.cfg.val_csv,
            test_csv   = self.cfg.test_csv,
            label_map  = self.label_map,
            batch_size = self.cfg.batch_size,
            augment    = True,
            cache      = False,
        )

        self.model = build_model(
            num_classes  = self.cfg.num_classes,
            input_shape  = self.cfg.input_shape,
            dropout_rate = self.cfg.dropout_rate,
        )

    def _phase1(self) -> tf.keras.callbacks.History:
        logger.info("=== Phase 1: Feature extraction (%d epochs) ===", self.cfg.phase1_epochs)
        self.model.compile(
            optimizer = tf.keras.optimizers.Adam(self.cfg.phase1_lr),
            loss      = tf.keras.losses.SparseCategoricalCrossentropy(),
            metrics   = [
                "accuracy",
                tf.keras.metrics.SparseTopKCategoricalAccuracy(k=5, name="top5_acc"),
            ],
        )
        history = self.model.fit(
            self.train_ds,
            validation_data = self.val_ds,
            epochs          = self.cfg.phase1_epochs,
            callbacks       = build_callbacks(self.cfg.output_dir, phase="phase1", monitor="val_accuracy"),
            verbose         = 1,
        )
        logger.info("Phase 1 done. Best val_accuracy: %.4f", max(history.history["val_accuracy"]))
        return history

    def _phase2(self) -> tf.keras.callbacks.History:
        logger.info("=== Phase 2: Fine-tuning (%d epochs) ===", self.cfg.phase2_epochs)
        _unfreeze_top_layers(self.model, self.cfg.unfreeze_from_layer)
        self.model.compile(
            optimizer = tf.keras.optimizers.Adam(self.cfg.phase2_lr),
            loss      = tf.keras.losses.SparseCategoricalCrossentropy(),
            metrics   = [
                "accuracy",
                tf.keras.metrics.SparseTopKCategoricalAccuracy(k=5, name="top5_acc"),
            ],
        )
        history = self.model.fit(
            self.train_ds,
            validation_data = self.val_ds,
            epochs          = self.cfg.phase2_epochs,
            callbacks       = build_callbacks(self.cfg.output_dir, phase="phase2", monitor="val_accuracy"),
            verbose         = 1,
        )
        logger.info("Phase 2 done. Best val_accuracy: %.4f", max(history.history["val_accuracy"]))
        return history

    def _evaluate(self) -> Dict:
        target_ds  = self.test_ds if self.test_ds else self.val_ds
        split_name = "test" if self.test_ds else "val"
        logger.info("Evaluating on %s set...", split_name)
        results = self.model.evaluate(target_ds, verbose=1, return_dict=True)
        logger.info("Evaluation: %s", results)
        log_classification_report(
            model      = self.model,
            dataset    = target_ds,
            label_map  = self.label_map,
            output_dir = self.cfg.output_dir,
            split      = split_name,
        )
        return results

    def _save(self):
        save_path = Path(self.cfg.output_dir) / "final_model.keras"
        self.model.save(save_path)
        logger.info("Final model saved to %s", save_path)

    def run(self) -> Dict:
        self._phase1()
        self._phase2()
        results = self._evaluate()
        self._save()
        return results