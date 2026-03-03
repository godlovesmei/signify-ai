# packages/ml/data/preprocessing.py
"""
Preprocessing utilities untuk BISINDO v1.

Karena dataset sudah diproses oleh Roboflow (crop, resize 244x244, grayscale),
file ini HANYA berisi:
  - Konstanta TARGET_SIZE
  - tf_augment()  — augmentasi on-the-fly saat training
  - tf_normalize() — normalisasi ke range [-1, 1] sesuai MobileNetV2
"""

import logging

import numpy as np
import tensorflow as tf

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────

TARGET_SIZE = (224, 224)   # resize dari 244 → 224 untuk MobileNetV2


# ── TF-level ops (dipanggil dari dalam tf.data pipeline di dataset.py) ───────

def tf_augment(image: tf.Tensor) -> tf.Tensor:
    """
    Augmentasi ringan untuk training. Menerima float32 tensor dalam [0, 1].

    Dihapus vs versi sebelumnya:
      - random_flip_left_right → flip mengubah orientasi tangan,
        mengubah makna isyarat (mis. huruf yang dibedakan kiri/kanan)
      - random_saturation      → dataset grayscale (R=G=B), saturation
        tidak berpengaruh sama sekali

    Ditambahkan:
      - random_jpeg_quality → simulasi kompresi webcam
    """
    image = tf.image.random_brightness(image, max_delta=0.15)
    image = tf.image.random_contrast(image, lower=0.8, upper=1.2)
    image = tf.image.random_jpeg_quality(image, min_jpeg_quality=70, max_jpeg_quality=100)
    image = tf.clip_by_value(image, 0.0, 1.0)
    return image


def tf_normalize(image: tf.Tensor) -> tf.Tensor:
    """
    Normalisasi [0, 1] → [-1, 1] sesuai MobileNetV2.

    MobileNetV2 dilatih dengan tf.keras.applications.mobilenet_v2.preprocess_input
    yang memetakan pixel sebagai: output = (pixel / 127.5) - 1
    Setara dengan: [0, 1] → [-1, 1] via (x * 2) - 1.

    FIX dari versi sebelumnya: versi lama pakai ImageNet mean/std
    (dirancang untuk ResNet/VGG), yang tidak kompatibel dengan
    pretrained weights MobileNetV2 dan menurunkan akurasi.
    """
    return (image * 2.0) - 1.0