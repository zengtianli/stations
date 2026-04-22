"""Book API 端点"""

from __future__ import annotations

import asyncio
import json
import re
from datetime import datetime, timezone
from uuid import uuid4

import httpx
from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse

from ..config import ADMIN_PASSWORD, FILE_LIMIT, VOICES, DEFAULT_VOICE
from ..models import BookMeta, BookStatus, ChapterMeta
from ..queue import enqueue
from ..storage import (
    chapter_audio_path,
    delete_book,
    list_books,
    load_chapter_sync,
    load_meta,
    save_meta,
)
from ..tts import split_chapters

router = APIRouter()


@router.post("/books")
async def create_book(
    file: UploadFile | None = File(None),
    text: str | None = Form(None),
    url: str | None = Form(None),
    voice: str = Form(DEFAULT_VOICE),
):
    # 获取 MD 内容
    sources = [x for x in (file, text, url) if x]
    if not sources:
        raise HTTPException(400, "需要提供 file、text 或 url")

    if file:
        content_bytes = await file.read()
        if len(content_bytes) > FILE_LIMIT:
            raise HTTPException(400, f"文件超过 {FILE_LIMIT // 1024}KB 限制")
        md_text = content_bytes.decode("utf-8")
    elif url:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                if len(resp.content) > FILE_LIMIT:
                    raise HTTPException(400, f"URL 内容超过 {FILE_LIMIT // 1024}KB 限制")
                md_text = resp.text
        except httpx.HTTPError as e:
            raise HTTPException(400, f"URL 获取失败: {e}")
    else:
        md_text = text
        if len(md_text.encode("utf-8")) > FILE_LIMIT:
            raise HTTPException(400, f"文本超过 {FILE_LIMIT // 1024}KB 限制")

    if not md_text or not md_text.strip():
        raise HTTPException(400, "内容为空")

    # 解析
    if voice not in VOICES:
        voice = DEFAULT_VOICE

    title_m = re.match(r"^#\s+(.+)$", md_text, re.MULTILINE)
    title = title_m.group(1).strip() if title_m else "未命名"

    raw_chapters = split_chapters(md_text)
    book_id = uuid4().hex[:12]

    meta = BookMeta(
        id=book_id,
        title=title,
        voice=voice,
        status=BookStatus.queued,
        chapters=[
            ChapterMeta(index=i, title=ch["title"])
            for i, ch in enumerate(raw_chapters)
        ],
        created_at=datetime.now(timezone.utc).isoformat(),
    )

    # 存储源文件
    from ..config import DATA_DIR
    book_dir = DATA_DIR / book_id
    book_dir.mkdir(parents=True, exist_ok=True)
    (book_dir / "source.md").write_text(md_text, encoding="utf-8")
    save_meta(book_id, meta)

    # 入队
    enqueue(book_id)

    return {"id": book_id, "title": title, "chapters": len(raw_chapters)}


@router.get("/books")
async def get_books():
    books = list_books()
    return [
        {
            "id": b.id,
            "title": b.title,
            "voice": b.voice,
            "status": b.status,
            "chapters": len(b.chapters),
            "duration": b.total_duration,
            "created_at": b.created_at,
        }
        for b in books
    ]


@router.get("/books/{book_id}")
async def get_book(book_id: str):
    meta = load_meta(book_id)
    if not meta:
        raise HTTPException(404)
    return meta


@router.get("/books/{book_id}/progress")
async def book_progress(book_id: str):
    async def event_stream():
        while True:
            meta = load_meta(book_id)
            if not meta:
                yield f"data: {json.dumps({'error': 'not found'})}\n\n"
                return
            yield f"data: {meta.model_dump_json()}\n\n"
            if meta.status in (BookStatus.done, BookStatus.error):
                return
            await asyncio.sleep(1)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/books/{book_id}/audio/{chapter}")
async def get_audio(book_id: str, chapter: int):
    path = chapter_audio_path(book_id, chapter)
    if not path.exists():
        raise HTTPException(404)
    return FileResponse(path, media_type="audio/mpeg")


@router.get("/books/{book_id}/sync/{chapter}")
async def get_sync(book_id: str, chapter: int):
    data = load_chapter_sync(book_id, chapter)
    if not data:
        raise HTTPException(404)
    return data


@router.delete("/books/{book_id}")
async def delete_book_endpoint(
    book_id: str,
    x_admin_password: str | None = Header(None),
):
    if x_admin_password != ADMIN_PASSWORD:
        raise HTTPException(403, "需要管理员密码")
    if not delete_book(book_id):
        raise HTTPException(404)
    return {"ok": True}
