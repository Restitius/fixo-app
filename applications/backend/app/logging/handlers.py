"""Daily-folder file handlers (design complete; emission wired in impl phase)."""
from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path

from app.shared.helpers.datetime_utils import log_folder_parts


def build_log_path(log_dir: str | Path, category_filename: str, dt: datetime | None = None) -> Path:
    """storage/logs/YYYY/MONTH/DD/<file>.log (pure path computation)."""
    year, month, day = log_folder_parts(dt)
    return Path(log_dir) / year / month / day / category_filename


class DailyFolderFileHandler(logging.Handler):
    """Appends records to a per-category file under the dated folder."""

    def __init__(self, log_dir: str | Path, category_filename: str) -> None:
        super().__init__()
        self.log_dir = Path(log_dir)
        self.category_filename = category_filename

    def emit(self, record: logging.LogRecord) -> None:
        raise NotImplementedError("DailyFolderFileHandler.emit — open/append/close per record")
