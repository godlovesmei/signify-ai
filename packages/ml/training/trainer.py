# packages/ml/training/trainer.py
import csv
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional

import numpy as np
import tensorflow as tf
from sklearn.utils.class_weight import compute_class_weight

from ml.data.dataset import build_datasets, get_label_map, save_label_map
from ml.training.callbacks import build_callbacks
from ml.training.metrics import log_classification_report

logger = logging.getLogger(__name__)


@dataclass
class TrainerConfig:
    train_csv: str = "data/processed/bisindo_v1/manifests/train.csv"
    val_csv:   str = "data/processed/bisindo_v1/manifests/valid.csv"
    test_csv:  Optional[str] = "data/processed/bisindo_v1/manifests/test.csv"

    num_classes:  int   = 26
    input_shape:  tuple = (224, 224, 3)
    dropout_rate: float = 0.3

    phase1_epochs:       int   = 15
    phase1_lr:           float = 1e-3
    phase1_weight_decay: float = 1e-4
    batch_size:          int   = 32

    phase2_epochs:        int   = 30
    phase2_lr:            float = 1e-5
    phase2_weight_decay:  float = 1e-5
    phase2_warmup_epochs: int   = 2
    phase2_lr_min:        float = 1e-7
    unfreeze_from_layer:  int   = 240

    output_dir:     str = "models/checkpoints/bisindo_v2"
    label_map_path: str = "data/processed/bisindo_v1/manifests/label_map.csv"

    resume_weights:       Optional[str] = None
    initial_epoch:        int           = 0
    initial_epoch_phase2: int           = 0
    skip_phase1:          bool          = False

    mixed_precision: bool  = True
    label_smoothing: float = 0.1
    require_gpu:     bool  = True
    seed:            int   = 42


def build_model(
    num_classes:  int,
    input_shape:  tuple,
    dropout_rate: float,
) -> tf.keras.Model:
    base = tf.keras.applications.EfficientNetV2B0(
        input_shape=input_shape,
        include_top=False,
        weights="imagenet",
        include_preprocessing=False,
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
    base = model.layers[1]
    base.trainable = True
    for layer in base.layers[:from_layer]:
        layer.trainable = False

    trainable_params = sum(tf.size(w).numpy() for w in model.trainable_weights)
    logger.info("Phase 2: unfrozen from layer %d. Trainable params: %d", from_layer, trainable_params)


def _compute_class_weights(train_csv: str, label_map: Dict[str, int]) -> Dict[int, float]:
    train_labels = []
    with open(train_csv, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            label = row["label"].strip()
            if label in label_map:
                train_labels.append(label_map[label])

    classes = np.unique(train_labels)
    weights = compute_class_weight(
        class_weight="balanced",
        classes=classes,
        y=train_labels,
    )
    class_weight_dict = dict(zip(classes.tolist(), weights.tolist()))
    logger.info("Class weights computed: min=%.3f max=%.3f",
                min(weights), max(weights))
    return class_weight_dict


class Trainer:
    def __init__(self, config: TrainerConfig):
        self.cfg = config
        self._setup()

    def _setup(self):
        tf.random.set_seed(self.cfg.seed)
        Path(self.cfg.output_dir).mkdir(parents=True, exist_ok=True)

        gpus = tf.config.list_physical_devices("GPU")
        if self.cfg.require_gpu and not gpus:
            raise RuntimeError(
                "GPU tidak terdeteksi. Aktifkan environment CUDA/cuDNN yang benar "
                "atau jalankan dengan require_gpu=False."
            )

        for gpu in gpus:
            try:
                tf.config.experimental.set_memory_growth(gpu, True)
                logger.info("Memory growth enabled for %s", gpu.name)
            except RuntimeError as e:
                logger.warning("Could not enable memory growth: %s", e)

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

        self.class_weight_dict = _compute_class_weights(self.cfg.train_csv, self.label_map)

        self.train_ds, self.val_ds, self.test_ds = build_datasets(
            train_csv      = self.cfg.train_csv,
            val_csv        = self.cfg.val_csv,
            test_csv       = self.cfg.test_csv,
            label_map      = self.label_map,
            batch_size     = self.cfg.batch_size,
            augment        = True,
            cache          = False,
            one_hot_labels = True,
            num_classes    = self.cfg.num_classes,
        )

        self.model = build_model(
            num_classes  = self.cfg.num_classes,
            input_shape  = self.cfg.input_shape,
            dropout_rate = self.cfg.dropout_rate,
        )

        if self.cfg.resume_weights:
            logger.info("Memuat weights dari: %s", self.cfg.resume_weights)
            self.model.load_weights(self.cfg.resume_weights)
            logger.info("Resume dari epoch %d", self.cfg.initial_epoch)

    def _phase1(self) -> tf.keras.callbacks.History:
        logger.info("=== Phase 1: Feature extraction (%d epochs) ===", self.cfg.phase1_epochs)
        self.model.compile(
            optimizer = tf.keras.optimizers.AdamW(
                learning_rate = self.cfg.phase1_lr,
                weight_decay  = self.cfg.phase1_weight_decay,
            ),
            loss    = tf.keras.losses.CategoricalCrossentropy(
                label_smoothing=self.cfg.label_smoothing,
            ),
            metrics = [
                tf.keras.metrics.CategoricalAccuracy(name="accuracy"),
                tf.keras.metrics.TopKCategoricalAccuracy(k=5, name="top5_acc"),
            ],
        )
        history = self.model.fit(
            self.train_ds,
            validation_data = self.val_ds,
            epochs          = self.cfg.phase1_epochs,
            initial_epoch   = self.cfg.initial_epoch,
            callbacks       = build_callbacks(self.cfg.output_dir, phase="phase1", monitor="val_accuracy"),
            class_weight    = self.class_weight_dict,
            verbose         = 1,
        )
        logger.info("Phase 1 done. Best val_accuracy: %.4f", max(history.history["val_accuracy"]))
        return history

    def _phase2(self) -> tf.keras.callbacks.History:
        logger.info("=== Phase 2: Fine-tuning (%d epochs) ===", self.cfg.phase2_epochs)
        _unfreeze_top_layers(self.model, self.cfg.unfreeze_from_layer)

        steps_per_epoch  = len(self.train_ds)
        remaining_epochs = self.cfg.phase2_epochs - self.cfg.initial_epoch_phase2
        total_steps      = steps_per_epoch * remaining_epochs
        warmup_steps     = steps_per_epoch * self.cfg.phase2_warmup_epochs

        lr_schedule = tf.keras.optimizers.schedules.CosineDecay(
            initial_learning_rate = self.cfg.phase2_lr,
            decay_steps           = total_steps - warmup_steps,
            alpha                 = self.cfg.phase2_lr_min,
            warmup_target         = self.cfg.phase2_lr,
            warmup_steps          = warmup_steps,
        )

        self.model.compile(
            optimizer = tf.keras.optimizers.AdamW(
                learning_rate = lr_schedule,
                weight_decay  = self.cfg.phase2_weight_decay,
            ),
            loss    = tf.keras.losses.CategoricalCrossentropy(
                label_smoothing=self.cfg.label_smoothing,
            ),
            metrics = [
                tf.keras.metrics.CategoricalAccuracy(name="accuracy"),
                tf.keras.metrics.TopKCategoricalAccuracy(k=5, name="top5_acc"),
            ],
        )
        history = self.model.fit(
            self.train_ds,
            validation_data = self.val_ds,
            epochs          = self.cfg.phase2_epochs,
            initial_epoch   = self.cfg.initial_epoch_phase2,
            callbacks       = build_callbacks(
                self.cfg.output_dir, phase="phase2", monitor="val_accuracy",
                use_lr_plateau=False,
            ),
            class_weight    = self.class_weight_dict,
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

    def _save_history(
        self,
        h1: tf.keras.callbacks.History,
        h2: tf.keras.callbacks.History,
    ) -> None:
        import json

        def _extract(h: tf.keras.callbacks.History) -> Dict:
            return {
                "accuracy":     h.history.get("accuracy", []),
                "val_accuracy": h.history.get("val_accuracy", []),
                "loss":         h.history.get("loss", []),
                "val_loss":     h.history.get("val_loss", []),
                "lr":           [float(x) for x in h.history.get("lr", [])],
            }

        data = {"phase1": _extract(h1), "phase2": _extract(h2)}
        path = Path(self.cfg.output_dir) / "training_history.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        logger.info("Training history saved → %s", path)

    def run(self) -> Dict:
        if self.cfg.skip_phase1:
            logger.info("Skip phase 1 — langsung ke phase 2")
            h1 = tf.keras.callbacks.History()
        else:
            h1 = self._phase1()

        h2 = self._phase2()
        self._save_history(h1, h2)
        results = self._evaluate()
        self._save()
        return results