"""磁盘存储：每本书一个目录，meta.json + chapters/*.mp3 + chapters/*.json"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from .config import DATA_DIR
from .models import BookMeta


def _book_dir(book_id: str) -> Path:
    return DATA_DIR / book_id


def ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def save_meta(book_id: str, meta: BookMeta) -> None:
    d = _book_dir(book_id)
    d.mkdir(parents=True, exist_ok=True)
    tmp = d / "meta.json.tmp"
    tmp.write_text(meta.model_dump_json(indent=2), encoding="utf-8")
    tmp.rename(d / "meta.json")


def load_meta(book_id: str) -> BookMeta | None:
    p = _book_dir(book_id) / "meta.json"
    if not p.exists():
        return None
    return BookMeta.model_validate_json(p.read_text(encoding="utf-8"))


def list_books() -> list[BookMeta]:
    if not DATA_DIR.exists():
        return []
    books = []
    for d in sorted(DATA_DIR.iterdir(), reverse=True):
        meta = load_meta(d.name)
        if meta:
            books.append(meta)
    # 按创建时间倒序
    books.sort(key=lambda b: b.created_at, reverse=True)
    return books


def delete_book(book_id: str) -> bool:
    d = _book_dir(book_id)
    if not d.exists():
        return False
    shutil.rmtree(d)
    return True


def chapter_dir(book_id: str) -> Path:
    d = _book_dir(book_id) / "chapters"
    d.mkdir(parents=True, exist_ok=True)
    return d


def save_chapter_sync(book_id: str, chapter: int, sync_data: dict) -> None:
    p = chapter_dir(book_id) / f"{chapter:03d}.json"
    p.write_text(json.dumps(sync_data, ensure_ascii=False, indent=2), encoding="utf-8")


def load_chapter_sync(book_id: str, chapter: int) -> dict | None:
    p = chapter_dir(book_id) / f"{chapter:03d}.json"
    if not p.exists():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


def chapter_audio_path(book_id: str, chapter: int) -> Path:
    return chapter_dir(book_id) / f"{chapter:03d}.mp3"
