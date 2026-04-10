import csv
import sys
import numpy as np
import tensorflow as tf
from PIL import Image

sys.path.insert(0, ".")
sys.path.insert(0, "apps/backend")

from app.services.ml_service import MLService
from app.config.settings import Settings


def load_dataset_samples(csv_path: str, n: int = 10):
    samples = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= n:
                break
            samples.append(row["filepath"])
    return samples


def training_pipeline(filepath: str) -> np.ndarray:
    raw   = tf.io.read_file(filepath)
    image = tf.image.decode_jpeg(raw, channels=3)
    image = tf.image.resize(image, [224, 224],
                            method=tf.image.ResizeMethod.BILINEAR,
                            antialias=False)
    image = tf.cast(image, tf.float32) / 255.0
    return image.numpy()


def inference_pipeline(filepath: str, service: MLService) -> np.ndarray:
    with open(filepath, "rb") as f:
        image_bytes = f.read()
    batch = service._preprocess(image_bytes)
    return batch[0]


def main():
    settings = Settings()
    service  = MLService(settings)

    csv_path = "data/processed/bisindo_v1/manifests/test.csv"
    samples  = load_dataset_samples(csv_path, n=10)

    print(f"{'File':<60} {'Train mean':>12} {'Infer mean':>12} {'Max diff':>12} {'Status':>8}")
    print("-" * 110)

    all_pass = True
    for fp in samples:
        try:
            train_arr = training_pipeline(fp)
            infer_arr = inference_pipeline(fp, service)

            mean_diff = abs(train_arr.mean() - infer_arr.mean())
            max_diff  = np.abs(train_arr - infer_arr).max()
            status    = "PASS" if max_diff < 0.05 else "FAIL"
            if status == "FAIL":
                all_pass = False

            print(f"{fp[-58:]:<60} {train_arr.mean():>12.4f} {infer_arr.mean():>12.4f} {max_diff:>12.4f} {status:>8}")
        except Exception as e:
            print(f"{fp[-58:]:<60} ERROR: {e}")
            all_pass = False

    print("-" * 110)
    print(f"\nResult: {'ALL PASS — pipelines consistent' if all_pass else 'FAILURES DETECTED — check preprocessing'}")
    sys.exit(0 if all_pass else 1)


if __name__ == "__main__":
    main()