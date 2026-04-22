# infra/nginx — moved to devtools

The nginx vhost renderer (`render.py`) + template (`site.conf.tmpl`) + output (`out/`)
were promoted to the central devtools location on **2026-04-22**, so all
subdomains (not just web-stack's hydro-*) share one generator. The previous
copy here hard-coded a stale `~/Dev/website/lib/services.ts` path (dead after
the 2026-04-20 stations reorg).

## New locations

| Was | Now |
|---|---|
| `web-stack/infra/nginx/render.py` | `~/Dev/devtools/lib/tools/services_to_nginx.py` |
| `web-stack/infra/nginx/site.conf.tmpl` | `~/Dev/devtools/lib/templates/nginx-dynamic.conf.tmpl` |
| `web-stack/infra/nginx/out/` | `~/Dev/tools/configs/nginx/out/` |

## Regenerate

```bash
/nginx-regen
# or
python3 ~/Dev/devtools/lib/tools/services_to_nginx.py
```

Output: `~/Dev/tools/configs/nginx/out/<subdomain>.conf`. Reviewed, then manually
rsync'd to VPS `/etc/nginx/sites-enabled/`.

## What's filtered

Subdomains in group `infra` (n8n / panel / sub / proxy / status / webhook) are
**excluded** because their VPS nginx vhosts are hand-written (different shapes:
Uptime Kuma, Marzban, oauth-proxy, webhook receiver). Don't regenerate those.
