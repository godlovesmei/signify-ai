# packages/ml/data/preprocessing.py
"""
Preprocessing utilities untuk BISINDO v1.

Karena dataset sudah diproses oleh Roboflow (crop, resize 244x244, grayscale),
file ini HANYA berisi:
  - Konstanta TARGET_SIZE
  - tf_augment()   — augmentasi on-the-fly saat training
  - tf_normalize() — normalisasi ke range [0, 1] sesuai EfficientNetV2B0
"""

import logging

import tensorflow as tf

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────

TARGET_SIZE = (224, 224)   # resize dari 244 → 224 untuk EfficientNetV2B0


# ── TF-level ops (dipanggil dari dalam tf.data pipeline di dataset.py) ───────

def tf_augment(image: tf.Tensor) -> tf.Tensor:
    """
    Augmentasi untuk training. Menerima float32 tensor dalam [0, 1].

    Dihapus vs versi sebelumnya:
      - random_flip_left_right → flip mengubah orientasi tangan,
        mengubah makna isyarat (mis. huruf yang dibedakan kiri/kanan)
      - random_saturation      → dataset grayscale (R=G=B), saturation
        tidak berpengaruh sama sekali

    Pipeline:
      1. Random brightness/contrast — variasi pencahayaan dasar
      2. Random JPEG quality        — simulasi kompresi webcam
      3. Random gamma correction    — simulasi non-linear camera response curve
         (gamma < 1 → brighten shadows, gamma > 1 → darken highlights)
      4. Random Gaussian noise      — simulasi sensor noise di low-light (50% prob)
    """
    # -- Existing augmentations --
    image = tf.image.random_brightness(image, max_delta=0.15)
    image = tf.image.random_contrast(image, lower=0.8, upper=1.2)
    image = tf.image.random_jpeg_quality(image, min_jpeg_quality=70, max_jpeg_quality=100)

    # -- Gamma correction --
    # Simulates over/under-exposure dari kamera nyata. random_brightness hanya
    # melakukan shift linear (pixel + delta), tetapi kamera menghasilkan
    # non-linear response curve. Gamma < 1 membuat shadow lebih terang
    # (ruangan gelap), gamma > 1 membuat highlight lebih gelap.
    gamma = tf.random.uniform([], 0.7, 1.4)
    image = tf.pow(tf.clip_by_value(image, 1e-7, 1.0), gamma)

    # -- Gaussian noise (50% probability) --
    # Simulates sensor noise yang muncul saat ISO tinggi / low-light.
    # stddev 0.02 cukup kecil agar tidak mendominasi fitur tangan, tapi cukup
    # untuk mengajarkan model mengabaikan noise halus.
    apply_noise = tf.random.uniform([]) > 0.5
    noise = tf.random.normal(tf.shape(image), mean=0.0, stddev=0.02)
    image = tf.cond(apply_noise, lambda: image + noise, lambda: image)

    image = tf.clip_by_value(image, 0.0, 1.0)
    return image


def tf_normalize(image: tf.Tensor) -> tf.Tensor:
    """
    Normalisasi untuk EfficientNetV2B0 dengan include_preprocessing=False.

    EfficientNetV2B0 dilatih dengan input dalam range [0, 1].
    Preprocessing internal model (include_preprocessing=True) hanya melakukan
    Rescaling(1/255), sehingga ketika include_preprocessing=False, model
    mengharapkan input yang sudah di-scale ke [0, 1] — tidak ada pergeseran
    tambahan seperti MobileNetV2's [-1, 1].

    BUG dari versi sebelumnya: versi lama menerapkan (x * 2) - 1 yang
    mentransformasi [0, 1] → [-1, 1] (normalisasi MobileNetV2), bukan
    EfficientNetV2B0. Ini menyebabkan semua aktivasi beroperasi pada
    rentang yang salah dan menurunkan akurasi ~4-5%.
    """
    return image