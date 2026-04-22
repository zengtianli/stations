"""Audiobook Web Service — Markdown to audiobook with sentence-level sync"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .queue import start_queue
from .routes import books, player, shelf
from .storage import ensure_data_dir


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_data_dir()
    start_queue()
    yield


app = FastAPI(title="Audiobook", lifespan=lifespan)

import os

_dev_origins = (
    ["http://localhost:3100", "http://127.0.0.1:3100"]
    if os.environ.get("AUDIOBOOK_DEV") == "1"
    else []
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[*_dev_origins, "https://audiobook.tianlizeng.cloud"],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

app.include_router(shelf.router)
app.include_router(player.router)
app.include_router(books.router, prefix="/api")


@app.get("/api/voices")
def list_voices() -> dict:
    from .config import VOICES, DEFAULT_VOICE
    return {"voices": VOICES, "default": DEFAULT_VOICE}


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
