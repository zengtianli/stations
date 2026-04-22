#!/usr/bin/env python3
"""拉取 SnapTrade activities 存到 data/activities.json

用法:
  python3 st_activities.py              # 全量拉取 (2021-01-01 → 今天)
  python3 st_activities.py --incremental # 增量: 只拉最后日期之后的新记录
"""
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from snaptrade_client import SnapTrade

DASH = Path(__file__).resolve().parent
DATA = DASH / "data"
DATA.mkdir(exist_ok=True)

incremental = "--incremental" in sys.argv

s = SnapTrade(
    client_id=os.environ["SNAPTRADE_CLIENT_ID"],
    consumer_key=os.environ["SNAPTRADE_CONSUMER_KEY"],
)
uid = os.environ["SNAPTRADE_USER_ID"]
sec = os.environ["SNAPTRADE_USER_SECRET"]

END = datetime.now().strftime("%Y-%m-%d")
existing_file = DATA / "activities.json"

if incremental and existing_file.exists():
    existing = json.loads(existing_file.read_text())
    old_acts = existing["activities"]
    old_ids = {a["id"] for a in old_acts}
    # 从最后一条记录的日期往前推 3 天开始拉（覆盖边界）
    last_date = max((a.get("trade_date") or "")[:10] for a in old_acts)
    fetch_start = (datetime.strptime(last_date, "%Y-%m-%d") - timedelta(days=3)).strftime("%Y-%m-%d")

    resp = s.transactions_and_reporting.get_activities(
        user_id=uid, user_secret=sec, start_date=fetch_start, end_date=END)
    new_acts = [a for a in resp.body if a["id"] not in old_ids]

    merged = old_acts + new_acts
    merged.sort(key=lambda a: a.get("trade_date") or "")
    print(f"增量: 拉取 {fetch_start}→{END}, 新增 {len(new_acts)} 条 (总 {len(merged)})")
else:
    START = os.environ.get("ACTIVITIES_START", "2021-01-01")
    resp = s.transactions_and_reporting.get_activities(
        user_id=uid, user_secret=sec, start_date=START, end_date=END)
    merged = sorted(resp.body, key=lambda a: a.get("trade_date") or "")
    print(f"全量: {START}→{END}, {len(merged)} 条")

out = {
    "fetched_at": datetime.now().isoformat(timespec="seconds"),
    "start": "2021-01-01", "end": END,
    "count": len(merged),
    "activities": merged,
}
existing_file.write_text(
    json.dumps(out, indent=2, ensure_ascii=False, default=str))
print(f"OK → data/activities.json  ({len(merged)} records)")
