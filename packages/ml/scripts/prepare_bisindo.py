# packages/ml/scripts/prepare_bisindo.py
import csv
from pathlib import Path

# Akar proyek (signify-ai)
BASE_DIR = Path(__file__).resolve().parents[3]  # naik 3 level: scripts/ -> ml/ -> packages/ -> root

RAW_DIR = BASE_DIR / "data" / "raw" / "BISINDOV1"
PROCESSED_DIR = BASE_DIR / "data" / "processed" / "bisindo"

# Nama folder sesuai dengan struktur BISINDOV1
splits = ["train", "valid", "test"]  # perhatikan: di BISINDOV1 ada folder valid, bukan val

for split in splits:
    csv_path = RAW_DIR / split / "_annotations.csv"
    if not csv_path.exists():
        print(f"Warning: {csv_path} tidak ditemukan, lewati.")
        continue

    output_csv = PROCESSED_DIR / f"{split}.csv"
    output_csv.parent.mkdir(parents=True, exist_ok=True)

    rows_out = []
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            filename = row['filename']
            label = row['class'].strip()
            filepath = RAW_DIR / split / filename
            if not filepath.exists():
                print(f"Warning: {filepath} tidak ditemukan, lewati.")
                continue
            rows_out.append({'filepath': str(filepath), 'label': label})

    # Tulis CSV baru
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['filepath', 'label'])
        writer.writeheader()
        writer.writerows(rows_out)

    print(f"✅ {split}: {len(rows_out)} sampel disimpan ke {output_csv}")