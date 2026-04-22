#!/usr/bin/env python3
"""SnapTrade 首次注册：创建用户，输出 userSecret 和 RH 授权链接"""
import os
import sys
from snaptrade_client import SnapTrade

CID = os.environ["SNAPTRADE_CLIENT_ID"]
KEY = os.environ["SNAPTRADE_CONSUMER_KEY"]
UID = os.environ["SNAPTRADE_USER_ID"]
SECRET = os.environ.get("SNAPTRADE_USER_SECRET") or ""

snap = SnapTrade(client_id=CID, consumer_key=KEY)

if not SECRET:
    print(f"注册用户 {UID} ...")
    try:
        resp = snap.authentication.register_snap_trade_user(user_id=UID)
        SECRET = resp.body["userSecret"]
        print(f"\n✅ userSecret（写入 ~/.personal_env）：\n{SECRET}\n")
    except Exception as e:
        if "already" in str(e).lower() or "409" in str(e):
            sys.exit(f"用户 {UID} 已存在。如果你有旧的 userSecret 就填进去；"
                     f"没有就改 SNAPTRADE_USER_ID 换个名字重跑。\n原错误: {e}")
        raise

# 生成连接门户链接
link = snap.authentication.login_snap_trade_user(
    user_id=UID, user_secret=SECRET, broker="ROBINHOOD",
    immediate_redirect=False)
print("🔗 浏览器打开授权 Robinhood：\n")
print(link.body["redirectURI"])
print("\n授权完成后把 userSecret 填到 ~/.personal_env 的 SNAPTRADE_USER_SECRET，然后跑 st_snapshot.py")
