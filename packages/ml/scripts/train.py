"""
scripts/train.py
----------------
CLI entrypoint for training.

Basic usage:
    python ml/scripts/train.py

Override defaults with flags:
    python ml/scripts/train.py \
        --train_csv data/bisindo_v1/processed/train/manifest.csv \
        --val_csv   data/bisindo_v1/processed/valid/manifest.csv \
        --test_csv  data/bisindo_v1/processed/test/manifest.csv  \
        --num_classes 26 \
        --phase1_epochs 15 \
        --phase2_epochs 30 \
        --batch_size 32 \
        --output_dir models/checkpoints/bisindo_v1
"""

import argparse
import logging
import sys
from pathlib import Path

# Allow running from repo root: python ml/scripts/train.py
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ml.training.trainer import Trainer, TrainerConfig

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


def parse_args():
    p = argparse.ArgumentParser(description="Train BISINDO MobileNetV2 classifier")
    p.add_argument("--train_csv",   default="data/bisindo_v1/processed/train/manifest.csv")
    p.add_argument("--val_csv",     default="data/bisindo_v1/processed/valid/manifest.csv")
    p.add_argument("--test_csv",    default="data/bisindo_v1/processed/test/manifest.csv")
    p.add_argument("--num_classes", type=int,   default=26)
    p.add_argument("--batch_size",  type=int,   default=32)
    p.add_argument("--phase1_epochs", type=int, default=15)
    p.add_argument("--phase2_epochs", type=int, default=30)
    p.add_argument("--phase1_lr",   type=float, default=1e-3)
    p.add_argument("--phase2_lr",   type=float, default=1e-5)
    p.add_argument("--output_dir",  default="models/checkpoints/bisindo_v1")
    p.add_argument("--label_map_path", default="data/bisindo_v1/metadata/label_map.csv")
    p.add_argument("--no_mixed_precision", action="store_true")
    return p.parse_args()


def main():
    args = parse_args()
    config = TrainerConfig(
        train_csv        = args.train_csv,
        val_csv          = args.val_csv,
        test_csv         = args.test_csv,
        num_classes      = args.num_classes,
        batch_size       = args.batch_size,
        phase1_epochs    = args.phase1_epochs,
        phase2_epochs    = args.phase2_epochs,
        phase1_lr        = args.phase1_lr,
        phase2_lr        = args.phase2_lr,
        output_dir       = args.output_dir,
        label_map_path   = args.label_map_path,
        mixed_precision  = not args.no_mixed_precision,
    )
    trainer = Trainer(config)
    results = trainer.run()
    print("\nFinal evaluation results:")
    for k, v in results.items():
        print(f"  {k}: {v:.4f}")


if __name__ == "__main__":
    main()