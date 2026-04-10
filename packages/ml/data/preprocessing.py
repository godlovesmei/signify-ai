# packages/ml/data/preprocessing.py
import logging
import tensorflow as tf

logger = logging.getLogger(__name__)

TARGET_SIZE = (224, 224)


def tf_augment(image: tf.Tensor) -> tf.Tensor:
    image = tf.image.random_brightness(image, max_delta=0.15)
    image = tf.image.random_contrast(image, lower=0.8, upper=1.2)
    image = tf.image.random_jpeg_quality(image, min_jpeg_quality=70, max_jpeg_quality=100)

    gamma = tf.random.uniform([], 0.7, 1.4)
    image = tf.pow(tf.clip_by_value(image, 1e-7, 1.0), gamma)

    apply_noise = tf.random.uniform([]) > 0.5
    noise = tf.random.normal(tf.shape(image), mean=0.0, stddev=0.02)
    image = tf.cond(apply_noise, lambda: image + noise, lambda: image)

    image = tf.clip_by_value(image, 0.0, 1.0)
    return image


def tf_normalize(image: tf.Tensor) -> tf.Tensor:
    return image