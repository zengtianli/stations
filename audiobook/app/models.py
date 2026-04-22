from __future__ import annotations
from enum import Enum
from pydantic import BaseModel


class BookStatus(str, Enum):
    queued = "queued"
    generating = "generating"
    done = "done"
    error = "error"


class ChapterMeta(BaseModel):
    index: int
    title: str
    status: str = "pending"  # pending | generating | done | error
    duration: float = 0.0
    sentence_count: int = 0


class BookMeta(BaseModel):
    id: str
    title: str
    voice: str
    status: BookStatus = BookStatus.queued
    chapters: list[ChapterMeta] = []
    total_duration: float = 0.0
    created_at: str = ""
    error: str | None = None
