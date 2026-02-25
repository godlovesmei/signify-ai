"""
callbacks.py
------------
Reusable Keras callbacks for training. Called by trainer.py.
"""

import logging
from pathlib import Path
from typing import List

import tensorflow as tf

logger = logging.getLogger(__name__)


def build_callbacks(
    output_dir: str,
    phase: str = "phase1",
    monitor: str = "val_accuracy",
    patience: int = 7,
) -> List[tf.keras.callbacks.Callback]:
    """
    Returns a list of callbacks:
    - ModelCheckpoint  : saves the best model weights
    - EarlyStopping    : stops if val_accuracy plateaus
    - ReduceLROnPlateau: halves LR on plateau (phase 2 especially)
    - TensorBoard      : logs for optional visualization
    - CSVLogger        : plain-text training log
    """
    output_dir = Path(output_dir)
    log_dir    = output_dir / "logs" / phase

    checkpoint = tf.keras.callbacks.ModelCheckpoint(
        filepath=str(output_dir / f"best_{phase}.keras"),
        monitor=monitor,
        save_best_only=True,
        save_weights_only=False,
        mode="max",
        verbose=1,
    )

    early_stop = tf.keras.callbacks.EarlyStopping(
        monitor=monitor,
        patience=patience,
        restore_best_weights=True,
        mode="max",
        verbose=1,
    )

    reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=3,
        min_lr=1e-7,
        verbose=1,
    )

    tensorboard = tf.keras.callbacks.TensorBoard(
        log_dir=str(log_dir),
        histogram_freq=0,
        update_freq="epoch",
    )

    csv_logger = tf.keras.callbacks.CSVLogger(
        filename=str(output_dir / f"training_log_{phase}.csv"),
        append=False,
    )

    return [checkpoint, early_stop, reduce_lr, tensorboard, csv_logger]