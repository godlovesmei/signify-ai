# packages/ml/scripts/train.py
"""
Entry point for training the BISINDO EfficientNetV2B0 classifier.
Run from repo root:
    python packages/ml/scripts/train.py
Or with custom args:
    python packages/ml/scripts/train.py \
        --phase1_epochs 20 \
        --phase2_epochs 40 \
        --batch_size 64

Resume dari checkpoint:
    python packages/ml/scripts/train.py \
        --resume_weights models/checkpoints/bisindo_v2/phase1_best.weights.h5 \
        --initial_epoch 12 \
        --batch_size 16
"""
import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ml.training.trainer import Trainer, TrainerConfig

logging.basicConfig(
    level   = logging.INFO,
    format  = "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt = "%Y-%m-%d %H:%M:%S",
)


def parse_args():
    p = argparse.ArgumentParser(description="Train BISINDO EfficientNetV2B0 classifier")

    # Data
    p.add_argument("--train_csv",      default="data/processed/bisindo_v1/manifests/train.csv")
    p.add_argument("--val_csv",        default="data/processed/bisindo_v1/manifests/valid.csv")
    p.add_argument("--test_csv",       default="data/processed/bisindo_v1/manifests/test.csv")

    # Model
    p.add_argument("--num_classes",    type=int,   default=26)
    p.add_argument("--dropout_rate",   type=float, default=0.3)

    # Training
    p.add_argument("--batch_size",          type=int,   default=32)
    p.add_argument("--phase1_epochs",       type=int,   default=15)
    p.add_argument("--phase2_epochs",       type=int,   default=30)
    p.add_argument("--phase1_lr",           type=float, default=1e-3)
    p.add_argument("--phase1_weight_decay", type=float, default=1e-4,
                   help="AdamW weight decay for phase 1 (default: 1e-4)")
    p.add_argument("--phase2_lr",           type=float, default=1e-5)
    p.add_argument("--phase2_weight_decay", type=float, default=1e-5,
                   help="AdamW weight decay for phase 2 (default: 1e-5)")
    p.add_argument("--phase2_warmup_epochs", type=int,  default=2,
                   help="Linear warmup epochs before cosine decay in phase 2")
    p.add_argument("--phase2_lr_min",       type=float, default=1e-7,
                   help="Minimum LR at the end of cosine decay (default: 1e-7)")
    p.add_argument("--unfreeze_from_layer", type=int,   default=240)
    p.add_argument("--label_smoothing",     type=float, default=0.1,
                   help="Label smoothing factor for CategoricalCrossentropy (default: 0.1)")

    # I/O
    p.add_argument("--output_dir",      default="models/checkpoints/bisindo_v2")
    p.add_argument("--label_map_path",  default="data/processed/bisindo_v1/manifests/label_map.csv")

    # Resume
    p.add_argument(
        "--resume_weights",
        default=None,
        help="Path ke checkpoint .h5 untuk dilanjutkan (contoh: models/checkpoints/bisindo_v2/phase1_best.weights.h5)",
    )
    p.add_argument(
        "--initial_epoch",
        type=int,
        default=0,
        help="Epoch awal phase 1 saat resume (default: 0)",
    )
    p.add_argument(
        "--initial_epoch_phase2",
        type=int,
        default=0,
        help="Epoch awal phase 2 saat resume (default: 0)",
    )
    p.add_argument(
        "--skip_phase1",
        action="store_true",
        help="Lewati phase 1 dan langsung ke phase 2 (gunakan bersama --resume_weights)",
    )

    # Misc
    p.add_argument(
        "--no_mixed_precision",
        action="store_true",
        help="Disable FP16 mixed precision (use if GPU VRAM < 6 GB)",
    )
    p.add_argument(
        "--allow_cpu",
        action="store_true",
        help="Allow training without GPU (slower). By default GPU is required.",
    )

    return p.parse_args()


def main():
    args   = parse_args()
    config = TrainerConfig(
        train_csv            = args.train_csv,
        val_csv              = args.val_csv,
        test_csv             = args.test_csv,
        num_classes          = args.num_classes,
        dropout_rate         = args.dropout_rate,
        batch_size           = args.batch_size,
        phase1_epochs        = args.phase1_epochs,
        phase2_epochs        = args.phase2_epochs,
        phase1_lr            = args.phase1_lr,
        phase1_weight_decay  = args.phase1_weight_decay,
        phase2_lr            = args.phase2_lr,
        phase2_weight_decay  = args.phase2_weight_decay,
        phase2_warmup_epochs = args.phase2_warmup_epochs,
        phase2_lr_min        = args.phase2_lr_min,
        unfreeze_from_layer  = args.unfreeze_from_layer,
        label_smoothing      = args.label_smoothing,
        output_dir           = args.output_dir,
        label_map_path       = args.label_map_path,
        resume_weights       = args.resume_weights,
        initial_epoch        = args.initial_epoch,
        initial_epoch_phase2 = args.initial_epoch_phase2,
        skip_phase1          = args.skip_phase1,
        mixed_precision      = not args.no_mixed_precision,
        require_gpu          = not args.allow_cpu,
    )

    trainer = Trainer(config)
    results = trainer.run()

    print("\n=== Final evaluation results ===")
    for k, v in results.items():
        print(f"  {k}: {v:.4f}")


if __name__ == "__main__":
    main()