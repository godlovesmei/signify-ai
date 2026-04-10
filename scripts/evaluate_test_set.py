import sys
import os
import json
import numpy as np
import tensorflow as tf

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'packages'))

from ml.data.dataset import build_datasets, load_label_map
from ml.training.metrics import log_classification_report


def main():
    label_map = load_label_map("data/processed/bisindo_v1/manifests/label_map.csv")

    _, _, test_ds = build_datasets(
        train_csv      = "data/processed/bisindo_v1/manifests/train.csv",
        val_csv        = "data/processed/bisindo_v1/manifests/valid.csv",
        test_csv       = "data/processed/bisindo_v1/manifests/test.csv",
        label_map      = label_map,
        batch_size     = 32,
        augment        = False,
        cache          = False,
        one_hot_labels = False,
        num_classes    = len(label_map),
    )

    model_path = sys.argv[1] if len(sys.argv) > 1 else "models/checkpoints/bisindo_v1/final_model.keras"
    print(f"Loading model: {model_path}")
    model = tf.keras.models.load_model(model_path)
    model.compile(
        optimizer = "adam",
        loss      = tf.keras.losses.SparseCategoricalCrossentropy(),
        metrics   = ["accuracy"],
    )

    results = model.evaluate(test_ds, verbose=1, return_dict=True)
    print("\nAggregate results:")
    print(json.dumps(results, indent=2))

    log_classification_report(
        model      = model,
        dataset    = test_ds,
        label_map  = label_map,
        output_dir = "reports/",
        split      = "test",
    )
    print("\nPer-class report saved to reports/test_classification_report.*")


if __name__ == "__main__":
    main()