#!/usr/bin/env python3
"""从 CCSwitcher keychain 备份导出 4 个账号的 OAuth token 到 config.json。

用法:
    python3 export_tokens.py              # 导出 token 并生成/更新 config.json
    python3 export_tokens.py --show       # 仅显示账号信息，不写文件
"""

from __future__ import annotations

import json
import plistlib
import secrets
import subprocess
import sys
from pathlib import Path

CONFIG_PATH = Path(__file__).parent / "config.json"

# 默认代理配置
DEFAULT_CONFIG = {
    "proxy_api_key": "",
    "listen_host": "127.0.0.1",
    "listen_port": 9100,
    "upstream_base": "https://api.anthropic.com",
    "oauth_token_url": "https://console.anthropic.com/v1/oauth/token",
    "oauth_client_id": "9d1c250a-e61b-44d9-88ed-5944d1962f5e",
    "oauth_scope": "user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload",
    "token_refresh_margin_seconds": 300,
    "rate_limit_cooldown_seconds": 60,
    "max_refresh_failures": 3,
    "accounts": [],
}


def read_keychain_backup() -> dict:
    """从 macOS keychain 读取 CCSwitcher 备份的所有账号数据。"""
    result = subprocess.run(
        ["security", "find-generic-password", "-s",
         "me.xueshi.ccswitcher.backups", "-a", "all-accounts", "-w"],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print("错误: 无法读取 CCSwitcher keychain 备份")
        print(f"  stderr: {result.stderr.strip()}")
        sys.exit(1)
    return json.loads(result.stdout.strip())


def read_active_email() -> str | None:
    """从 CCSwitcher defaults 读取当前活跃账号的 email。"""
    result = subprocess.run(
        ["defaults", "export", "me.xueshi.ccswitcher", "-"],
        capture_output=True,
    )
    if result.returncode != 0:
        return None
    try:
        plist = plistlib.loads(result.stdout)
        accounts_bytes = plist.get("com.ccswitcher.accounts", b"")
        accounts = json.loads(accounts_bytes.decode())
        for acc in accounts:
            if acc.get("isActive"):
                return acc.get("email", "")
    except Exception:
        pass
    return None


def extract_accounts(backup: dict) -> list[dict]:
    """从 CCSwitcher 备份中提取账号信息。"""
    active_email = read_active_email()
    if active_email:
        print(f"当前活跃 CC 账号: {active_email} (将标记 skip)")

    accounts = []
    for account_id, data in backup.items():
        oauth = data.get("oauthAccount", {})
        token_str = data.get("token", "{}")
        token_data = json.loads(token_str) if isinstance(token_str, str) else token_str
        claude_oauth = token_data.get("claudeAiOauth", {})

        email = oauth.get("emailAddress", "")
        accounts.append({
            "name": oauth.get("displayName", account_id),
            "email": email,
            "org_uuid": oauth.get("organizationUuid", ""),
            "refresh_token": claude_oauth.get("refreshToken", ""),
            "access_token": claude_oauth.get("accessToken", ""),
            "expires_at": claude_oauth.get("expiresAt", 0),
            "skip": email == active_email,
        })
    return accounts


def show_accounts(accounts: list[dict]) -> None:
    """显示账号信息。"""
    print(f"\n找到 {len(accounts)} 个账号:\n")
    for i, acc in enumerate(accounts, 1):
        rt = acc["refresh_token"]
        at = acc["access_token"]
        print(f"  {i}. {acc['name']} ({acc['email'][:25]}...)")
        print(f"     refreshToken: {rt[:25]}... ({len(rt)} chars)")
        print(f"     accessToken:  {at[:25]}... ({len(at)} chars)")
        print(f"     expiresAt:    {acc['expires_at']}")
        print()


def write_config(accounts: list[dict]) -> None:
    """生成或更新 config.json。"""
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH) as f:
            config = json.load(f)
        print(f"更新已有 config.json")
    else:
        config = DEFAULT_CONFIG.copy()
        config["proxy_api_key"] = f"sk-proxy-{secrets.token_hex(24)}"
        print(f"创建新 config.json")

    config["accounts"] = accounts
    with open(CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

    print(f"已写入 {CONFIG_PATH}")
    print(f"proxy_api_key: {config['proxy_api_key']}")


def main():
    show_only = "--show" in sys.argv

    backup = read_keychain_backup()
    accounts = extract_accounts(backup)

    if not accounts:
        print("未找到任何账号")
        sys.exit(1)

    show_accounts(accounts)

    if show_only:
        return

    write_config(accounts)
    print("\n完成! 下一步: python3 oauth_proxy.py")


if __name__ == "__main__":
    main()
