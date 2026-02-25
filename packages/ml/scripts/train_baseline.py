import tensorflow as tf
from tensorflow.keras import layers, models
import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[3]

# Load label map
label_map_path = ROOT_DIR / "data" / "metadata" / "bisindo_labels.json"
with open(label_map_path, "r") as f:
    label_to_idx = json.load(f)
num_classes = len(label_to_idx)

# Persiapan dataset menggunakan fungsi yang sudah ada di ml.data.dataset
# Kita perlu mengimpor dari packages.ml.data.dataset
import sys
sys.path.insert(0, str(ROOT_DIR))  # agar Python bisa menemukan packages.ml
from ml.data.dataset import build_datasets, load_label_map

# load_label_map dari CSV (karena build_datasets menerima label_map Dict)
# Kita bisa menggunakan CSV yang sudah dibuat
label_map = load_label_map(str(ROOT_DIR / "data" / "metadata" / "bisindo_labels.csv"))

train_csv = ROOT_DIR / "data" / "processed" / "bisindo" / "train.csv"
val_csv = ROOT_DIR / "data" / "processed" / "bisindo" / "val.csv"

train_ds, val_ds, _ = build_datasets(
    train_csv=str(train_csv),
    val_csv=str(val_csv),
    label_map=label_map,
    batch_size=32,
    augment=True,
    cache=True
)

# Model
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False  # freeze base

model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.2),
    layers.Dense(num_classes, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# Callbacks
checkpoint_dir = ROOT_DIR / "models" / "checkpoints"
checkpoint_dir.mkdir(parents=True, exist_ok=True)

callbacks = [
    tf.keras.callbacks.ModelCheckpoint(
        str(checkpoint_dir / "baseline_epoch_{epoch:02d}_valacc_{val_accuracy:.4f}.h5"),
        monitor='val_accuracy',
        save_best_only=True,
        mode='max'
    ),
    tf.keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
    tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=3)
]

# Training
history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=50,
    callbacks=callbacks
)

# Simpan model final
final_model_dir = ROOT_DIR / "models" / "production"
final_model_dir.mkdir(parents=True, exist_ok=True)
model.save(final_model_dir / "bisindo_baseline_v1.h5")
print("[INFO] Model final disimpan.")