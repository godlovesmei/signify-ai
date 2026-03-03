# packages/ml/training/trainer.py
"""
Two-phase transfer learning trainer for BISINDO sign classification.

Phase 1 — Feature extraction:
    MobileNetV2 base is fully frozen; only the custom head is trained.
    Use a higher learning rate (1e-3).

Phase 2 — Fine-tuning:
    Top N layers of the base are unfrozen; the whole network is trained
    end-to-end with a very low learning rate (1e-5) to avoid destroying
    pretrained weights.
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
    # ── Data paths ──────────────────────────────────────────────────────────
    # FIX: paths now match the output of prepare_bisindo.py
    train_csv: str = "data/processed/bisindo_v1/manifests/train.csv"
    val_csv:   str = "data/processed/bisindo_v1/manifests/valid.csv"
    test_csv:  Optional[str] = "data/processed/bisindo_v1/manifests/test.csv"

    # ── Model ────────────────────────────────────────────────────────────────
    num_classes:   int   = 26
    input_shape:   tuple = (224, 224, 3)
    dropout_rate:  float = 0.3

    # ── Phase 1 – feature extraction ─────────────────────────────────────────
    phase1_epochs: int   = 15
    phase1_lr:     float = 1e-3
    batch_size:    int   = 32

    # ── Phase 2 – fine-tuning ─────────────────────────────────────────────────
    phase2_epochs:        int   = 30
    phase2_lr:            float = 1e-5
    # Unfreeze MobileNetV2 layers from this index onwards.
    # MobileNetV2 has ~154 layers total; 100 keeps early feature detectors frozen.
    unfreeze_from_layer:  int   = 100

    # ── I/O ──────────────────────────────────────────────────────────────────
    output_dir:     str = "models/checkpoints/bisindo_v1"
    # FIX: label_map_path now lives next to the manifests
    label_map_path: str = "data/processed/bisindo_v1/manifests/label_map.csv"

    # ── Misc ─────────────────────────────────────────────────────────────────
    mixed_precision: bool = True   # FP16 — set False if GPU VRAM < 6 GB
    seed:            int  = 42


# ── Model builder ─────────────────────────────────────────────────────────────

def build_model(
    num_classes:  int,
    input_shape:  tuple,
    dropout_rate: float,
) -> tf.keras.Model:
    """
    MobileNetV2 + custom classification head.

    Input normalization note:
        The tf.data pipeline applies tf_normalize() which maps [0, 1] → [-1, 1].
        This matches exactly what MobileNetV2's pretrained weights expect
        (equivalent to tf.keras.applications.mobilenet_v2.preprocess_input).
        Therefore we do NOT apply preprocess_input inside the model —
        doing so would double-normalize and corrupt the activations.
    """
    base = tf.keras.applications.MobileNetV2(
        input_shape=input_shape,
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False   # frozen for phase 1

    inputs = tf.keras.Input(shape=input_shape)
    # training=False keeps BatchNorm in inference mode during phase 1,
    # which is correct when the base is frozen.
    x = base(inputs, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Dropout(dropout_rate)(x)
    x = tf.keras.layers.Dense(256, activation="relu")(x)
    x = tf.keras.layers.Dropout(dropout_rate / 2)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax", dtype="float32")(x)

    model = tf.keras.Model(inputs, outputs, name="bisindo_mobilenetv2")
    trainable_params = sum(
        tf.size(w).numpy() for w in model.trainable_weights
    )
    logger.info("Model built: %d trainable params (phase 1)", trainable_params)
    return model


def _unfreeze_top_layers(model: tf.keras.Model, from_layer: int) -> None:
    """
    Unfreeze MobileNetV2 base layers starting from `from_layer` index.
    Layers before `from_layer` remain frozen to preserve low-level features.
    """
    base = model.layers[1]   # index 1 = MobileNetV2 base
    base.trainable = True
    for layer in base.layers[:from_layer]:
        layer.trainable = False

    trainable_params = sum(
        tf.size(w).numpy() for w in model.trainable_weights
    )
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

        # Derive label map from train split only
        self.label_map = get_label_map(self.cfg.train_csv)
        save_label_map(self.label_map, self.cfg.label_map_path)

        # Verify num_classes matches the dataset
        actual_classes = len(self.label_map)
        if actual_classes != self.cfg.num_classes:
            logger.warning(
                "TrainerConfig.num_classes=%d but dataset has %d classes. "
                "Overriding to %d.",
                self.cfg.num_classes, actual_classes, actual_classes,
            )
            self.cfg.num_classes = actual_classes

        self.train_ds, self.val_ds, self.test_ds = build_datasets(
            train_csv  = self.cfg.train_csv,
            val_csv    = self.cfg.val_csv,
            test_csv   = self.cfg.test_csv,
            label_map  = self.label_map,
            batch_size = self.cfg.batch_size,
            augment    = True,
            cache = False,
        )

        self.model = build_model(
            num_classes  = self.cfg.num_classes,
            input_shape  = self.cfg.input_shape,
            dropout_rate = self.cfg.dropout_rate,
        )

    # ── Phase 1 ──────────────────────────────────────────────────────────────

    def _phase1(self) -> tf.keras.callbacks.History:
        logger.info(
            "=== Phase 1: Feature extraction (%d epochs) ===",
            self.cfg.phase1_epochs,
        )
        self.model.compile(
            optimizer = tf.keras.optimizers.Adam(self.cfg.phase1_lr),
            loss      = tf.keras.losses.SparseCategoricalCrossentropy(),
            metrics   = [
                "accuracy",
                tf.keras.metrics.SparseTopKCategoricalAccuracy(k=5, name="top5_acc"),
            ],
        )
        callbacks = build_callbacks(
            output_dir = self.cfg.output_dir,
            phase      = "phase1",
            monitor    = "val_accuracy",
        )
        history = self.model.fit(
            self.train_ds,
            validation_data = self.val_ds,
            epochs          = self.cfg.phase1_epochs,
            callbacks       = callbacks,
            verbose         = 1,
        )
        logger.info(
            "Phase 1 complete. Best val_accuracy: %.4f",
            max(history.history["val_accuracy"]),
        )
        return history

    # ── Phase 2 ──────────────────────────────────────────────────────────────

    def _phase2(self) -> tf.keras.callbacks.History:
        logger.info(
            "=== Phase 2: Fine-tuning (%d epochs) ===",
            self.cfg.phase2_epochs,
        )
        _unfreeze_top_layers(self.model, self.cfg.unfreeze_from_layer)

        # Recompile with lower LR after changing trainability
        self.model.compile(
            optimizer = tf.keras.optimizers.Adam(self.cfg.phase2_lr),
            loss      = tf.keras.losses.SparseCategoricalCrossentropy(),
            metrics   = [
                "accuracy",
                tf.keras.metrics.SparseTopKCategoricalAccuracy(k=5, name="top5_acc"),
            ],
        )
        callbacks = build_callbacks(
            output_dir = self.cfg.output_dir,
            phase      = "phase2",
            monitor    = "val_accuracy",
        )
        history = self.model.fit(
            self.train_ds,
            validation_data = self.val_ds,
            epochs          = self.cfg.phase2_epochs,
            callbacks       = callbacks,
            verbose         = 1,
        )
        logger.info(
            "Phase 2 complete. Best val_accuracy: %.4f",
            max(history.history["val_accuracy"]),
        )
        return history

    # ── Evaluation ────────────────────────────────────────────────────────────

    def _evaluate(self) -> Dict:
        target_ds  = self.test_ds if self.test_ds else self.val_ds
        split_name = "test" if self.test_ds else "val"
        logger.info("Evaluating on %s set...", split_name)

        results = self.model.evaluate(target_ds, verbose=1, return_dict=True)
        logger.info("Evaluation results: %s", results)

        log_classification_report(
            model      = self.model,
            dataset    = target_ds,
            label_map  = self.label_map,
            output_dir = self.cfg.output_dir,
            split      = split_name,
        )
        return results

    # ── Save ──────────────────────────────────────────────────────────────────

    def _save(self):
        save_path = Path(self.cfg.output_dir) / "final_model.keras"
        self.model.save(save_path)
        logger.info("Final model saved to %s", save_path)

    # ── Entrypoint ────────────────────────────────────────────────────────────

    def run(self) -> Dict:
        """Run both training phases, evaluate, and save the model."""
        self._phase1()
        self._phase2()
        results = self._evaluate()
        self._save()
        return results