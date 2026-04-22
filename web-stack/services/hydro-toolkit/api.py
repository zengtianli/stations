"""FastAPI wrapper — expose hydro-toolkit plugin management without Streamlit.

Usage (dev):
    uv run uvicorn api:app --host 127.0.0.1 --port 8610 --reload

Consumed by apps/hydro-toolkit-web in ~/Dev/web-stack/. Original Streamlit
app.py stays untouched — this module re-uses `core.plugin_loader` and
`core.plugin_manager` read-only.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import sys
for _p in [Path.home() / "Dev/devtools/lib", Path("/var/www/devtools/lib")]:
    if _p.exists(): sys.path.insert(0, str(_p)); break
from hydro_api_helpers import read_version  # noqa: E402

from core.plugin_loader import discover_plugins
from core.plugin_manager import install_plugin, uninstall_plugin, update_plugin


app = FastAPI(title="hydro-toolkit-api", version=read_version(Path(__file__).parent))

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3110",
        "http://127.0.0.1:3110",
        "https://hydro.tianlizeng.cloud",
    ],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

SUBDOMAIN_TEMPLATE = "https://{name}.tianlizeng.cloud"


def _plugin_to_dict(p: Any) -> dict:
    return {
        "name": p.name,
        "title": p.title,
        "icon": p.icon,
        "order": p.order,
        "description": p.description,
        "version": p.version,
        "dir_name": p.dir_name,
        "url": SUBDOMAIN_TEMPLATE.format(name=p.dir_name),
        "installed": True,
    }


class InstallRequest(BaseModel):
    git_url: str


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/meta")
def meta_info() -> dict:
    return {
        "name": "toolkit",
        "title": "水利工具集",
        "icon": "🧰",
        "description": "插件式水利计算工具 Host Shell",
        "version": _read_version(),
    }


@app.get("/api/metadata")
def metadata() -> dict:
    """Canonical service metadata — consumed by ops-console /services-health."""
    import os
    try:
        deployed_at = int((Path(__file__).parent / "api.py").stat().st_mtime)
    except OSError:
        deployed_at = 0
    return {
        **meta_info(),
        "service_id": "hydro",  # matches subdomains.yaml id (subdomain hydro.tianlizeng.cloud)
        "service_type": "portal",
        "port": int(os.environ.get("SERVICE_PORT", 8610)),
        "compute_endpoint": None,
        "input_formats": [],
        "output_formats": ["json"],
        "deployed_at": deployed_at,
    }


@app.get("/api/plugins")
def list_plugins() -> list[dict]:
    return [_plugin_to_dict(p) for p in discover_plugins()]


@app.post("/api/plugins/install")
def install(req: InstallRequest) -> dict:
    ok, msg = install_plugin(req.git_url)
    if not ok:
        raise HTTPException(400, msg)
    return {"ok": True, "message": msg}


@app.delete("/api/plugins/{dir_name}")
def uninstall(dir_name: str) -> dict:
    ok, msg = uninstall_plugin(dir_name)
    if not ok:
        raise HTTPException(404, msg)
    return {"ok": True, "message": msg}


@app.post("/api/plugins/{dir_name}/update")
def update(dir_name: str) -> dict:
    ok, msg = update_plugin(dir_name)
    if not ok:
        raise HTTPException(400, msg)
    return {"ok": True, "message": msg}
