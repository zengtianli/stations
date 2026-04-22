#!/usr/bin/env python3
"""扫描 ~/Dev/tools/raycast/commands/*.sh 的 @raycast 元数据，输出 data/raycast_index.json"""

import json
import re
from datetime import datetime, timezone
from pathlib import Path

HUB = Path.home() / "Dev" / "raycast" / "commands"
OUT = Path(__file__).resolve().parent.parent / "data" / "raycast_index.json"

META_RE = re.compile(r"^\s*#\s*@raycast\.(\w+)\s+(.+?)\s*$")


def parse_script(path: Path) -> dict | None:
    meta: dict[str, str] = {}
    try:
        with path.open("r", encoding="utf-8") as f:
            for i, line in enumerate(f):
                if i > 25:
                    break
                m = META_RE.match(line)
                if m:
                    meta[m.group(1)] = m.group(2)
    except Exception:
        return None
    if not meta:
        return None

    # 追溯实际项目来源（hub 里是 symlink）
    try:
        real = path.resolve()
        project = real.parent.parent.parent.name if "raycast" in str(real) else "unknown"
    except Exception:
        project = "unknown"

    return {
        "file": path.name,
        "title": meta.get("title", path.stem),
        "description": meta.get("description", ""),
        "icon": meta.get("icon", ""),
        "package": meta.get("packageName", ""),
        "mode": meta.get("mode", ""),
        "project": project,
        "source": "raycast",
    }


def main():
    if not HUB.exists():
        print(f"⚠ 未找到 Raycast 脚本目录: {HUB}")
        return

    entries = []
    for sh in sorted(HUB.glob("*.sh")):
        entry = parse_script(sh)
        if entry:
            entries.append(entry)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "version": "1.0",
        "exported_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "commands": entries,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ 已导出 {len(entries)} 个 Raycast 脚本到 {OUT}")


if __name__ == "__main__":
    main()
