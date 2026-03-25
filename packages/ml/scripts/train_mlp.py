# packages/ml/scripts/train_mlp.py
"""
Train a lightweight MLP on 63 MediaPipe landmark features for BISINDO
sign language recognition.

Primary data source: collected_data.json downloaded from the /collect page.
Fallback: NPY files extracted by extract_landmarks.py.

Run from repo root:
    python packages/ml/scripts/train_mlp.py --dataset bisindo_landmarks_2024-01-01.json

Or with NPY fallback (if extract_landmarks.py was run successfully):
    python packages/ml/scripts/train_mlp.py

Outputs (in models/exports/bisindo_v1_mlp/):
    weights.json    — flat Float32 arrays for all Dense layers
    label_map.json  — {"0": "A", "1": "B", ...}

Copy both files to apps/frontend/public/models/landmark_mlp/ to activate
the MLP classifier in the browser.
"""

import argparse
import json
import logging
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

logging.basicConfig(
    level   = logging.INFO,
    format  = "%(asctime)s | %(levelname)s | %(message)s",
    datefmt = "%H:%M:%S",
)
logger = logging.getLogger(__name__)

DATA_DIR   = Path("data/processed/bisindo_v1/landmarks")
OUTPUT_DIR = Path("models/exports/bisindo_v1_mlp")


def load_from_json(path: str):
    """Load dataset collected via the /collect page."""
    data   = json.loads(Path(path).read_text())
    X = np.array([s["landmarks"] for s in data["samples"]], dtype=np.float32)
    y = np.array([s["label"]     for s in data["samples"]])
    logger.info("Loaded %d samples from %s", len(X), path)

    # Split into train/val/test (70/15/15)
    X_tr, X_tmp, y_tr, y_tmp = train_test_split(X, y, test_size=0.30, stratify=y, random_state=42)
    X_vl, X_te, y_vl, y_te   = train_test_split(X_tmp, y_tmp, test_size=0.50, stratify=y_tmp, random_state=42)
    return X_tr, y_tr, X_vl, y_vl, X_te, y_te


def load_from_npy():
    """Load dataset extracted by extract_landmarks.py (NPY files)."""
    X_train = np.load(DATA_DIR / "train_features.npy")
    y_train = np.load(DATA_DIR / "train_labels.npy")
    X_val   = np.load(DATA_DIR / "valid_features.npy")
    y_val   = np.load(DATA_DIR / "valid_labels.npy")
    X_test  = np.load(DATA_DIR / "test_features.npy")
    y_test  = np.load(DATA_DIR / "test_labels.npy")
    return X_train, y_train, X_val, y_val, X_test, y_test


def build_model(num_classes: int) -> tf.keras.Model:
    return tf.keras.Sequential([
        tf.keras.layers.Input(shape=(63,)),
        tf.keras.layers.Dense(256, activation="relu"),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(128, activation="relu"),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(num_classes, activation="softmax"),
    ], name="bisindo_landmark_mlp")


def export_weights(model: tf.keras.Model, output_dir: Path) -> None:
    """
    Export Dense layer weights as flat float32 arrays in a compact JSON file.
    Dropout layers are skipped (they are no-ops at inference time).

    JSON schema:
        {
          "layers": [
            { "W": [float, ...], "W_rows": int, "W_cols": int, "b": [float, ...] },
            ...
          ]
        }
    """
    dense_layers = [l for l in model.layers if isinstance(l, tf.keras.layers.Dense)]
    payload = {
        "layers": [
            {
                "W":      [round(float(v), 6) for v in layer.kernel.numpy().flatten()],
                "W_rows": int(layer.kernel.shape[0]),
                "W_cols": int(layer.kernel.shape[1]),
                "b":      [round(float(v), 6) for v in layer.bias.numpy()],
            }
            for layer in dense_layers
        ]
    }
    path = output_dir / "weights.json"
    path.write_text(json.dumps(payload, separators=(",", ":")))
    size_kb = path.stat().st_size / 1024
    logger.info("Exported weights → %s  (%.1f KB)", path, size_kb)


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--dataset", default=None,
                   help="Path to JSON collected from the /collect page. "
                        "If omitted, falls back to NPY files in data/processed/bisindo_v1/landmarks/")
    return p.parse_args()


def main():
    args = parse_args()
    if args.dataset:
        X_train, y_train, X_val, y_val, X_test, y_test = load_from_json(args.dataset)
    else:
        X_train, y_train, X_val, y_val, X_test, y_test = load_from_npy()
    logger.info("Train: %d  Val: %d  Test: %d", len(X_train), len(X_val), len(X_test))

    le = LabelEncoder()
    le.fit(np.concatenate([y_train, y_val, y_test]))
    y_tr = le.transform(y_train)
    y_vl = le.transform(y_val)
    y_te = le.transform(y_test)

    num_classes = len(le.classes_)
    logger.info("Classes (%d): %s", num_classes, list(le.classes_))

    model = build_model(num_classes)
    model.compile(
        optimizer = tf.keras.optimizers.Adam(1e-3),
        loss      = "sparse_categorical_crossentropy",
        metrics   = ["accuracy"],
    )
    model.summary()

    model.fit(
        X_train, y_tr,
        validation_data = (X_val, y_vl),
        epochs          = 100,
        batch_size      = 256,
        callbacks = [
            tf.keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True, verbose=1),
            tf.keras.callbacks.ReduceLROnPlateau(patience=5, factor=0.5, verbose=1),
        ],
        verbose = 1,
    )

    # Evaluate
    y_pred = model.predict(X_test, verbose=0).argmax(axis=1)
    logger.info("Test report:\n%s", classification_report(y_te, y_pred, target_names=le.classes_))

    # Export
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    label_map = {str(i): cls for i, cls in enumerate(le.classes_)}
    (OUTPUT_DIR / "label_map.json").write_text(json.dumps(label_map, indent=2))
    logger.info("Saved label_map → %s", OUTPUT_DIR / "label_map.json")

    export_weights(model, OUTPUT_DIR)


if __name__ == "__main__":
    main()
