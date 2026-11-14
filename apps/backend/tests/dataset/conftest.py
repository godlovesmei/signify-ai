"""Allow the dataset suite to run without legacy YOLO test dependencies."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
