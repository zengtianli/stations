from pathlib import Path
import os

DATA_DIR = Path(os.environ.get("AUDIOBOOK_DATA", str(Path.home() / "audiobook_data")))
ADMIN_PASSWORD = os.environ.get("AUDIOBOOK_ADMIN_PW", "changeme")
FILE_LIMIT = 200 * 1024  # 200KB
PORT = 9200

VOICES = {
    "xiaoxiao": {"id": "zh-CN-XiaoxiaoNeural", "label": "晓晓（女声自然）"},
    "yunxi": {"id": "zh-CN-YunxiNeural", "label": "云希（男声自然）"},
    "xiaoyi": {"id": "zh-CN-XiaoyiNeural", "label": "晓依（女声活泼）"},
    "yunjian": {"id": "zh-CN-YunjianNeural", "label": "云健（男声播音）"},
}
DEFAULT_VOICE = "xiaoxiao"
