"""TTS 引擎 — 从 md_to_audiobook.py 提取，适配 Web 服务。"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

from .config import DATA_DIR, VOICES, DEFAULT_VOICE
from .models import BookMeta, BookStatus
from .storage import save_meta, load_meta, chapter_dir, save_chapter_sync, chapter_audio_path


# ── MD 解析 ──────────────────────────────────────

def split_chapters(md_text: str, level: int = 2) -> list[dict]:
    """按指定标题级别拆分章节"""
    prefix = "#" * level
    splits = []
    for m in re.finditer(rf"^{prefix}\s+(.+)$", md_text, re.MULTILINE):
        splits.append((m.start(), m.group(1).strip()))

    if not splits:
        title_match = re.match(r"^#\s+(.+)$", md_text, re.MULTILINE)
        title = title_match.group(1).strip() if title_match else "全文"
        return [{"title": title, "body": md_text}]

    chapters = []
    for i, (pos, title) in enumerate(splits):
        end = splits[i + 1][0] if i + 1 < len(splits) else len(md_text)
        chapters.append({"title": title, "body": md_text[pos:end]})
    return chapters


def _clean_inline(text: str) -> str:
    text = re.sub(r"\*{1,2}(.+?)\*{1,2}", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    return text.strip()


def parse_chapter_blocks(md_body: str) -> list[dict]:
    """将章节 MD 解析为结构化块。

    返回 list of:
      {'type': 'heading', 'level': int, 'text': str}
      {'type': 'text', 'text': str}
    """
    blocks = []
    current_lines: list[str] = []
    in_code_block = False
    in_table = False

    def flush_text():
        if current_lines:
            joined = _clean_inline(" ".join(current_lines))
            if joined:
                blocks.append({"type": "text", "text": joined})
            current_lines.clear()

    for line in md_body.split("\n"):
        stripped = line.strip()

        if stripped.startswith("```"):
            in_code_block = not in_code_block
            flush_text()
            continue
        if in_code_block:
            continue

        if stripped.startswith("|") or re.match(r"^[-:|]+$", stripped):
            flush_text()
            in_table = True
            continue
        if in_table and not stripped:
            in_table = False

        if re.match(r"^[-*_]{3,}$", stripped):
            flush_text()
            continue

        if not stripped:
            flush_text()
            continue

        hm = re.match(r"^(#{1,6})\s+(.+)$", stripped)
        if hm:
            flush_text()
            blocks.append({
                "type": "heading",
                "level": len(hm.group(1)),
                "text": _clean_inline(hm.group(2)),
            })
            continue

        cleaned = re.sub(r"^>\s*", "", stripped)
        cleaned = re.sub(r"^[-*+]\s+", "", cleaned)
        cleaned = re.sub(r"^\d+\.\s+", "", cleaned)
        current_lines.append(cleaned)

    flush_text()
    return blocks


# ── 音频生成 ──────────────────────────────────────

async def generate_audio_with_sync(
    text: str, output_path: Path, voice: str,
) -> tuple[list[dict], float]:
    """生成音频 + 句子级时间戳。返回 (sentences, duration)"""
    import edge_tts

    communicate = edge_tts.Communicate(text, voice)
    audio_data = bytearray()
    sentences = []

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data.extend(chunk["data"])
        elif chunk["type"] == "SentenceBoundary":
            sentences.append({
                "text": chunk["text"],
                "start": chunk["offset"] / 10_000_000,
                "end": (chunk["offset"] + chunk["duration"]) / 10_000_000,
            })

    output_path.write_bytes(bytes(audio_data))
    duration = _get_duration(output_path)

    if sentences:
        sentences[-1]["end"] = min(sentences[-1]["end"], duration)

    return sentences, duration


def _get_duration(path: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)],
        capture_output=True, text=True,
    )
    return float(r.stdout.strip())


def map_sentences_to_blocks(
    text_blocks: list[dict], sentences: list[dict],
) -> list[list[dict]]:
    """将 TTS 句子映射回段落块"""
    full_text = "\n\n".join(b["text"] for b in text_blocks)
    offset = 0
    ranges = []
    for b in text_blocks:
        s = offset
        e = offset + len(b["text"])
        ranges.append((s, e))
        offset = e + 2

    result: list[list[dict]] = [[] for _ in text_blocks]
    search_from = 0
    for sent in sentences:
        pos = full_text.find(sent["text"], search_from)
        if pos == -1:
            pos = full_text.find(sent["text"])
        if pos == -1:
            result[-1].append(sent)
            continue
        search_from = pos + len(sent["text"])
        assigned = False
        for i, (bs, be) in enumerate(ranges):
            if pos >= bs and pos < be + 2:
                result[i].append(sent)
                assigned = True
                break
        if not assigned:
            result[-1].append(sent)
    return result


# ── 整本书生成 ──────────────────────────────────────

async def generate_book(book_id: str) -> None:
    """逐章生成音频，每章完成后更新 meta.json"""
    meta = load_meta(book_id)
    if not meta:
        return

    source_path = DATA_DIR / book_id / "source.md"
    source = source_path.read_text(encoding="utf-8")
    voice_id = VOICES.get(meta.voice, VOICES[DEFAULT_VOICE])["id"]

    meta.status = BookStatus.generating
    save_meta(book_id, meta)

    raw_chapters = split_chapters(source)

    for i, ch in enumerate(raw_chapters):
        if i >= len(meta.chapters):
            break
        try:
            meta.chapters[i].status = "generating"
            save_meta(book_id, meta)

            blocks = parse_chapter_blocks(ch["body"])
            text_blocks = [b for b in blocks if b["type"] == "text"]
            tts_text = "\n\n".join(b["text"] for b in text_blocks)

            if not tts_text.strip():
                meta.chapters[i].status = "done"
                meta.chapters[i].duration = 0
                # 保存空章节的 sync 数据（只有 heading blocks）
                save_chapter_sync(book_id, i, {"blocks": blocks, "sync": []})
                save_meta(book_id, meta)
                continue

            audio_path = chapter_audio_path(book_id, i)
            sentences, duration = await generate_audio_with_sync(
                tts_text, audio_path, voice_id,
            )

            block_sents = map_sentences_to_blocks(text_blocks, sentences)

            sync_data = {
                "blocks": blocks,
                "sentences": [
                    {"text": s["text"], "start": round(s["start"], 3), "end": round(s["end"], 3)}
                    for s in sentences
                ],
                "block_sents": [
                    [{"text": s["text"], "start": round(s["start"], 3), "end": round(s["end"], 3)}
                     for s in bs]
                    for bs in block_sents
                ],
            }
            save_chapter_sync(book_id, i, sync_data)

            meta.chapters[i].status = "done"
            meta.chapters[i].duration = duration
            meta.chapters[i].sentence_count = len(sentences)
            meta.total_duration = sum(c.duration for c in meta.chapters)
            save_meta(book_id, meta)

        except Exception as e:
            meta.chapters[i].status = "error"
            meta.error = str(e)
            save_meta(book_id, meta)

    if meta.error:
        meta.status = BookStatus.error
    else:
        meta.status = BookStatus.done
    meta.total_duration = sum(c.duration for c in meta.chapters)
    save_meta(book_id, meta)
