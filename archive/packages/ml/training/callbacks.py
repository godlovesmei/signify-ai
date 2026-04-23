# packages/ml/training/callbacks.py
"""
Keras callbacks untuk training BISINDO EfficientNetV2B0.

build_callbacks() dipanggil di trainer.py untuk setiap phase.
"""

import logging
from pathlib import Path

import tensorflow as tf

logger = logging.getLogger(__name__)


def build_callbacks(
    output_dir: str,
    phase: str,
    monitor: str = "val_accuracy",
    use_lr_plateau: bool = True,
) -> list:
    """
    Buat daftar Keras callbacks untuk satu training phase.

    Args:
        output_dir     : direktori tempat checkpoint dan log disimpan
        phase          : label phase, e.g. "phase1" atau "phase2"
        monitor        : metrik yang diawasi untuk ModelCheckpoint & EarlyStopping
        use_lr_plateau : apakah ReduceLROnPlateau disertakan. Set False jika
                         optimizer sudah menggunakan LR schedule (e.g. CosineDecay
                         di phase 2), karena dua mekanisme LR scheduling yang
                         saling bertabrakan menghasilkan perilaku yang tidak
                         terprediksi.

    Returns:
        List of tf.keras.callbacks.Callback
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    callbacks = []

    # ── 1. ModelCheckpoint ────────────────────────────────────────────────────
    # Simpan bobot terbaik berdasarkan val_accuracy.
    # save_weights_only=True lebih cepat dan hemat disk saat fine-tuning.
    checkpoint_path = str(output_dir / f"{phase}_best.weights.h5")
    callbacks.append(
        tf.keras.callbacks.ModelCheckpoint(
            filepath        = checkpoint_path,
            monitor         = monitor,
            mode            = "max",
            save_best_only  = True,
            save_weights_only = True,
            verbose         = 1,
        )
    )
    logger.info("ModelCheckpoint → %s", checkpoint_path)

    # ── 2. EarlyStopping ──────────────────────────────────────────────────────
    # Hentikan training jika val_accuracy tidak naik selama `patience` epoch.
    # restore_best_weights memastikan model kembali ke bobot terbaik.
    patience = 7 if phase == "phase1" else 10
    callbacks.append(
        tf.keras.callbacks.EarlyStopping(
            monitor              = monitor,
            mode                 = "max",
            patience             = patience,
            restore_best_weights = True,
            verbose              = 1,
        )
    )

    # ── 3. ReduceLROnPlateau (opsional) ─────────────────────────────────────
    # Turunkan LR jika val_accuracy stagnan. Hanya digunakan jika optimizer
    # belum memiliki LR schedule sendiri (e.g. phase 1 dengan flat LR).
    # Di phase 2 dengan CosineDecay, callback ini di-skip agar tidak konflik.
    if use_lr_plateau:
        callbacks.append(
            tf.keras.callbacks.ReduceLROnPlateau(
                monitor   = monitor,
                mode      = "max",
                factor    = 0.5,       # LR baru = LR lama * 0.5
                patience  = 3,
                min_lr    = 1e-7,
                verbose   = 1,
            )
        )

    # ── 4. CSVLogger ─────────────────────────────────────────────────────────
    # Simpan history tiap epoch ke CSV — berguna untuk analisis post-training.
    log_path = str(output_dir / f"{phase}_history.csv")
    callbacks.append(
        tf.keras.callbacks.CSVLogger(
            filename = log_path,
            append   = False,
        )
    )
    logger.info("CSVLogger → %s", log_path)

    # ── 5. TensorBoard ────────────────────────────────────────────────────────
    # Opsional tapi berguna: jalankan `tensorboard --logdir <log_dir>` untuk
    # visualisasi loss/accuracy curve secara real-time.
    tb_log_dir = str(output_dir / "tensorboard" / phase)
    callbacks.append(
        tf.keras.callbacks.TensorBoard(
            log_dir          = tb_log_dir,
            histogram_freq   = 0,       # set 1 untuk weight histograms (lambat)
            write_graph      = False,
            update_freq      = "epoch",
        )
    )
    logger.info("TensorBoard logs → %s", tb_log_dir)

    return callbacks