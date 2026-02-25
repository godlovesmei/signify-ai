import csv
import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[3]
train_csv = ROOT_DIR / "data" / "processed" / "bisindo" / "train.csv"

# Baca semua label unik dari train.csv
labels_set = set()
with open(train_csv, mode="r", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        labels_set.add(row["label"].strip())

# Buat pemetaan terurut
label_list = sorted(labels_set)
label_to_idx = {label: idx for idx, label in enumerate(label_list)}
idx_to_label = {idx: label for label, idx in label_to_idx.items()}

# Simpan sebagai JSON
metadata_dir = ROOT_DIR / "data" / "metadata"
metadata_dir.mkdir(parents=True, exist_ok=True)

with open(metadata_dir / "bisindo_labels.json", "w", encoding="utf-8") as f:
    json.dump(label_to_idx, f, indent=2)

# Simpan juga sebagai CSV (jika diperlukan untuk dataset.py)
with open(metadata_dir / "bisindo_labels.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["label", "index"])
    for label in label_list:
        writer.writerow([label, label_to_idx[label]])

print(f"[INFO] Label map disimpan: {len(label_list)} kelas")