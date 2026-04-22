"""串行 TTS 生成队列"""

from __future__ import annotations

import asyncio
import logging

logger = logging.getLogger(__name__)

_queue: asyncio.Queue[str] = asyncio.Queue()
_current: str | None = None
_pending: list[str] = []


async def _worker() -> None:
    global _current
    while True:
        book_id = await _queue.get()
        _current = book_id
        if book_id in _pending:
            _pending.remove(book_id)
        try:
            from .tts import generate_book
            await generate_book(book_id)
        except Exception:
            logger.exception("生成失败: %s", book_id)
        finally:
            _current = None
            _queue.task_done()


def enqueue(book_id: str) -> None:
    _pending.append(book_id)
    _queue.put_nowait(book_id)


def get_status() -> dict:
    return {"current": _current, "pending": list(_pending)}


def start_queue() -> None:
    asyncio.get_event_loop().create_task(_worker())
