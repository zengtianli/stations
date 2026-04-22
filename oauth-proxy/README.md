# OAuth Proxy

Unified OAuth token management platform with API key routing, usage tracking, and rate limiting.

[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge)](https://www.python.org/)

## What It Does

- **Manages OAuth accounts** — Multiple providers with automatic token refresh
- **Proxies API requests** — Routes authenticated requests with account balancing
- **Tracks usage** — Records token consumption per API key and account
- **Enforces rate limiting** — Per-key rate limit controls
- **Admin dashboard** — Real-time monitoring of keys, usage, and account status

## Setup

```bash
git clone https://github.com/zengtianli/oauth-proxy
cd oauth-proxy
pip install -r requirements.txt

# Generate OAuth config
python3 export_tokens.py  # creates config.json (gitignored)

# Start
python3 oauth_proxy.py    # backend on port 9100
cd frontend && npm run dev # frontend on port 5173
```

## Usage

```bash
# API authentication
curl -H "x-api-key: your-key" https://proxy.tianlizeng.cloud/v1/messages
```

## Architecture

- **Backend**: Python + aiohttp + SQLite
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Auth**: Cloudflare Access (edge) + x-api-key (API)
- **Deploy**: systemd + nginx on VPS

## License

MIT License — see [LICENSE](LICENSE) for details.
