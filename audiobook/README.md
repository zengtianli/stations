# Audiobook

Markdown → 有声书 Web 服务。基于 [edge-tts](https://github.com/rany2/edge-tts) 语音合成，逐句高亮同步播放。

## 在线访问

- https://audiobook.tianlizeng.cloud（公开访问）
- 本地预览：`AUDIOBOOK_DEV=1 uv run uvicorn app.main:app --port 9200 --reload`

## 功能

- 上传 Markdown 文件 / 粘贴文本 / URL 抓取 → 自动按 `##` 拆章节
- 多音色：晓晓（女声自然）/ 云希（男声自然）/ 晓依（女声活泼）/ 云健（男声播音）
- 串行队列生成（避免被 edge-tts 限流）
- 播放器逐句高亮 + 章节切换 + 进度同步
- 管理员密码 `AUDIOBOOK_ADMIN_PW` 控制删除权限

## 项目结构

```
app/
├── main.py         FastAPI 入口（lifespan 启动队列）
├── config.py       DATA_DIR / VOICES / ADMIN_PW / PORT
├── models.py       BookMeta / ChapterMeta (Pydantic)
├── storage.py      磁盘 IO: meta.json / chapters/*.mp3 / *.json
├── tts.py          TTS 引擎（split_chapters / generate_audio_with_sync）
├── queue.py        asyncio 串行生成队列
└── routes/         books / shelf / player
```

## 部署

```bash
bash deploy.sh   # rsync + pip install + ffmpeg + systemctl restart
```

依赖 VPS 上的 `ffprobe`（deploy 自动 apt-get install）。systemd `audiobook.service` 跑在 9200 端口，Nginx 反代。

## 详细文档

`CLAUDE.md` 含完整架构、TTS 引擎细节、踩坑记录。
