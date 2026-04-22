# Audiobook

Markdown 转有声书 Web 服务，edge-tts 语音合成 + 逐句高亮同步播放。

## Quick Reference

| 项目 | 值 |
|------|-----|
| 在线地址 | https://audiobook.tianlizeng.cloud |
| VPS 路径 | `/var/www/audiobook/` |
| 数据目录 | `/var/www/audiobook/data/` |
| systemd | `audiobook.service` (port 9200) |
| Nginx | `audiobook.tianlizeng.cloud` → 127.0.0.1:9200 |
| CF Access | 已关闭，公开访问 |
| 管理员密码 | `AUDIOBOOK_ADMIN_PW` 环境变量 |

## 常用命令

```bash
# 本地开发
cd ~/Dev/audiobook
AUDIOBOOK_DATA="$HOME/audiobook_data" uv run uvicorn app.main:app --port 9200 --reload

# 部署
bash deploy.sh

# VPS 日志
ssh root@104.218.100.67 "journalctl -u audiobook -f"
```

## 架构

```
FastAPI (uvicorn:9200)
├── GET  /                           书架页（上传/书列表）
├── GET  /books/{id}                 播放器页
├── POST /api/books                  创建书（file/text/url + voice）
├── GET  /api/books                  书列表 JSON
├── GET  /api/books/{id}             书详情 JSON
├── GET  /api/books/{id}/progress    SSE 生成进度
├── GET  /api/books/{id}/audio/{ch}  章节 MP3
├── GET  /api/books/{id}/sync/{ch}   章节同步数据
└── DELETE /api/books/{id}           管理员删除
```

## 项目结构

```
app/
├── main.py         FastAPI 入口，lifespan 启动队列
├── config.py       DATA_DIR, VOICES, ADMIN_PW, PORT
├── models.py       BookMeta, ChapterMeta (Pydantic)
├── storage.py      磁盘 IO: meta.json, chapters/*.mp3/*.json
├── tts.py          TTS 引擎（split_chapters, parse_chapter_blocks, generate_audio_with_sync）
├── queue.py        asyncio 串行生成队列
└── routes/
    ├── books.py    API 端点
    ├── shelf.py    书架页 HTML
    └── player.py   播放器页 HTML
```

## 存储结构

```
data/{book_id}/
├── meta.json       书籍元数据（标题、状态、章节列表）
├── source.md       原始 Markdown
└── chapters/
    ├── 000.mp3     章节音频
    ├── 000.json    章节同步数据（blocks + sentences + block_sents）
    └── ...
```

## TTS 引擎

从 `~/Dev/tools/doctools/scripts/document/md_to_audiobook.py` 提取，核心流程：

1. `split_chapters()` — 按 `##` 拆分章节
2. `parse_chapter_blocks()` — MD → 结构化块（heading 不朗读，text 送 TTS）
3. `generate_audio_with_sync()` — edge-tts 流式生成 MP3 + SentenceBoundary 时间戳
4. `map_sentences_to_blocks()` — 句子映射回段落，供播放器逐句高亮

音色预设：晓晓（女声自然）、云希（男声自然）、晓依（女声活泼）、云健（男声播音）

## 部署

`bash deploy.sh` 一键部署：rsync → pip install → systemctl restart

依赖 VPS 上的 `ffprobe`（deploy.sh 自动安装）。

## 注意事项

- 文件限制 200KB（约 10 万字）
- 串行队列，同时只生成一本
- edge-tts 是免费服务，高并发可能被限流
- 播放器页 HTML 由 Python f-string 服务端渲染，修改 `routes/player.py`
