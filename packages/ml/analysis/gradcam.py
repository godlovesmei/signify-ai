# packages/ml/analysis/gradcam.py
import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
import cv2
from pathlib import Path

MODEL_PATH = "models/checkpoints/bisindo_v1/final_model.keras"
IMAGE_PATH = "data/processed/bisindo_v1/test/A--7-_jpg.rf.31337dcfa495fa8420f3d9f653f42ca7.jpg"
OUTPUT_DIR = "analysis_outputs"

# ── Load model ────────────────────────────────────────────────────────────────
model = tf.keras.models.load_model(MODEL_PATH)

# ── Struktur model (dari trainer.py):
#   layers[0] = InputLayer
#   layers[1] = MobileNetV2 (sub-model, opaque)
#   layers[2] = GlobalAveragePooling2D
#   layers[3] = BatchNormalization
#   layers[4] = Dropout
#   layers[5] = Dense(256, relu)
#   layers[6] = Dropout
#   layers[7] = Dense(num_classes, softmax)

base_model = model.layers[1]   # MobileNetV2 sub-model

# Cari Conv_1 (last conv layer di MobileNetV2, output shape: (7,7,1280))
last_conv_layer = base_model.get_layer("Conv_1")

# ── Grad Model: sepenuhnya di dalam graph MobileNetV2 ─────────────────────────
# Kedua output ada di dalam graph yang sama → tidak ada KeyError
grad_model = tf.keras.Model(
    inputs  = base_model.input,
    outputs = [last_conv_layer.output, base_model.output],
)

# ── Head Model: dari output base_model → prediksi akhir ──────────────────────
# base_model.output shape = (None, 7, 7, 1280) sebelum GAP
# Kita buat head yang menerima output base_model lalu teruskan ke layer[2:]
head_input = tf.keras.Input(shape=base_model.output_shape[1:])
x = head_input
for layer in model.layers[2:]:
    x = layer(x)
head_model = tf.keras.Model(inputs=head_input, outputs=x)

# ── Load & preprocess gambar ──────────────────────────────────────────────────
raw = tf.io.read_file(IMAGE_PATH)
img = tf.image.decode_image(raw, channels=3, expand_animations=False)
img = tf.image.resize(img, [224, 224])
img_uint8 = img.numpy().astype("uint8")

# Normalisasi sesuai trainer: [0,255] → [-1, 1]
img_norm  = (tf.cast(img, tf.float32) / 127.5) - 1.0
img_batch = tf.expand_dims(img_norm, axis=0)   # (1, 224, 224, 3)

# ── Grad-CAM ──────────────────────────────────────────────────────────────────
with tf.GradientTape() as tape:
    # Jalankan MobileNetV2 → dapatkan conv output & base output
    conv_outputs, base_out = grad_model(img_batch, training=False)
    tape.watch(conv_outputs)

    # Jalankan head → dapatkan prediksi
    preds = head_model(base_out, training=False)

    class_index = int(tf.argmax(preds[0]).numpy())
    loss = preds[:, class_index]

grads = tape.gradient(loss, conv_outputs)   # (1, 7, 7, 1280)

if grads is None:
    raise RuntimeError(
        "Gradient is None — pastikan model tidak di-compile dengan "
        "run_eagerly=False dan base_model.trainable=True saat inference."
    )

# Global average pooling atas gradien → (1280,)
pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2)).numpy()

# Weight setiap channel dengan gradiennya
conv_np = conv_outputs[0].numpy().copy()   # (7, 7, 1280)
conv_np *= pooled_grads[np.newaxis, np.newaxis, :]   # broadcast

# Buat heatmap: rata-rata atas channel → (7, 7)
heatmap = np.mean(conv_np, axis=-1)
heatmap = np.maximum(heatmap, 0)
heatmap /= (np.max(heatmap) + 1e-8)

# Resize ke ukuran gambar asli
heatmap_resized = cv2.resize(heatmap, (224, 224))

# Overlay heatmap ke gambar asli
heatmap_color = cv2.applyColorMap(np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET)
heatmap_rgb   = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)
overlay       = (img_uint8 * 0.6 + heatmap_rgb * 0.4).astype("uint8")

# ── Simpan output ─────────────────────────────────────────────────────────────
Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)

plt.figure(figsize=(6, 6))
plt.imshow(img_uint8)
plt.axis("off")
plt.title(f"Original | Predicted class: {class_index}")
plt.savefig(f"{OUTPUT_DIR}/original.png", dpi=150, bbox_inches="tight")
plt.close()

plt.figure(figsize=(6, 6))
plt.imshow(heatmap_resized, cmap="jet")
plt.axis("off")
plt.title("Grad-CAM Heatmap")
plt.savefig(f"{OUTPUT_DIR}/heatmap.png", dpi=150, bbox_inches="tight")
plt.close()

plt.figure(figsize=(6, 6))
plt.imshow(overlay)
plt.axis("off")
plt.title("Overlay")
plt.savefig(f"{OUTPUT_DIR}/overlay.png", dpi=150, bbox_inches="tight")
plt.close()

print(f"✅ Grad-CAM selesai! Output disimpan di '{OUTPUT_DIR}/'")
print(f"   Predicted class index : {class_index}")
print(f"   Top-5 classes         : {np.argsort(preds.numpy()[0])[::-1][:5]}")