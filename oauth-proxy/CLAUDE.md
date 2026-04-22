# CC OAuth Proxy — API 管理平台

## Quick Reference

| 项目 | 路径/值 |
|------|---------|
| 后端 | `oauth_proxy.py` (aiohttp, port 9100) |
| 前端 | `frontend/` (React + Vite + Tailwind) |
| 配置 | `config.json` (gitignored, 由 export_tokens.py 生成) |
| 部署 | `bash deploy.sh` |
| VPS | `ssh root@104.218.100.67` |
| 远程路径 | `/var/www/oauth-proxy/` |
| systemd | `oauth-proxy.service` |
| URL | `https://proxy.tianlizeng.cloud` |
| 链路 | CF (443) → nginx (8443, SSL) → localhost:9100 |

## 凭证与环境

- **所有 API key/token 在 `~/.personal_env`**，永远不要问用户要
- Cloudflare: `CF_API_TOKEN`, `CF_ZONE_ID`, `CF_ACCOUNT_ID` (zone: tianlizeng.cloud)

## 认证

**Dashboard 认证: Cloudflare Access**（和 docs/status/n8n.tianlizeng.cloud 同模式）
- CF Access 在边缘拦截，通过后请求才到达后端
- 后端不做任何自定义认证，不要写 JWT/SMTP/密码验证
- 管理 CF Access: `python3 ~/Dev/devtools/lib/tools/cf_api.py access list`

**API 认证: x-api-key header**
- /v1/* 路径通过 CF Access bypass，客户端直连
- 后端用 SQLite api_keys 表验证

## 部署

```bash
# 完整部署（含前端构建）
bash deploy.sh

# 仅后端
bash deploy.sh --backend-only
```

## 架构

```
CCSwitcher 浏览器扩展
  → export_tokens.py → config.json (含 refresh_token)
  → oauth_proxy.py 启动时刷新所有 access_token
  → /v1/messages 代理请求到 Anthropic API

Token 刷新 URL: https://console.anthropic.com/v1/oauth/token
必须 headers: anthropic-beta: claude-code-20250219,oauth-2025-04-20,...
```

## 账号管理

- config.json 中 `accounts` 数组，每个账号有 refresh_token
- `skip: true` 跳过该账号
- Token 失效时需重新通过 CCSwitcher 导出

## 前端开发

```bash
cd frontend
npm install
npm run dev      # 开发 http://localhost:5173
npm run build    # 构建到 dist/
```

## 用户偏好（必须遵守）

- Web 服务必须配子域名 + HTTPS，不给 IP:port
- 登录用邮箱验证码，不用密码
- Cloudflare 操作用 API 直接做，不要叫用户去 dashboard
- CF helper: `python3 ~/Dev/devtools/lib/tools/cf_api.py`
- VPS helper: `python3 ~/Dev/devtools/lib/tools/vps_cmd.py`
