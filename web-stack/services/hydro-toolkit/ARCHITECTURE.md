# Hydro Toolkit — Plugin Architecture

## Overview

Hydro Toolkit is a **pure host shell** with zero business logic. Every calculation tool is an independent plugin — a standalone Streamlit app with a `plugin.yaml` manifest.

```
hydro-toolkit/                 ← Host (this repo)
├── app.py                     ← st.navigation() dynamic page loading
├── core/
│   ├── plugin_loader.py       ← Scan plugins/, read plugin.yaml
│   ├── plugin_manager.py      ← git clone / pull / rm
│   ├── home.py                ← Auto-generated tool overview
│   └── manage.py              ← Plugin install/update/uninstall UI
├── plugins/                   ← Installed plugins (gitignored)
│   ├── hydro-capacity/        ← git cloned
│   ├── hydro-reservoir/
│   └── ...
├── plugins.json               ← Registry (source URLs for updates)
└── requirements.txt           ← Host-only: streamlit + pyyaml
```

## How It Works

### Plugin Discovery

On every page load, `core/plugin_loader.py` scans the `plugins/` directory:

1. Iterate subdirectories of `plugins/`
2. Look for `plugin.yaml` in each
3. Parse metadata (name, title, icon, order, etc.)
4. Return sorted list of `PluginInfo` objects

### Page Loading

`app.py` uses Streamlit's `st.navigation()` API to build the sidebar dynamically:

```python
pages = [st.Page("core/home.py", title="首页", icon="🏠", default=True)]
for p in plugins:
    pages.append(st.Page(str(p.path / "app.py"), title=p.title, icon=p.icon, url_path=p.name))
pages.append(st.Page("core/manage.py", title="插件管理", icon="⚙️"))
nav = st.navigation(pages)
nav.run()
```

### Namespace Package Resolution

All plugins use `from src.{module} import ...` for their internal imports. To avoid collisions when multiple plugins are loaded:

- **Each plugin's directory is added to `sys.path`**
- **`src/__init__.py` must NOT exist** in any plugin — this makes `src` a PEP 420 namespace package
- Python merges all `src/` directories from `sys.path` into a single namespace
- Each subpackage (`src/capacity/`, `src/reservoir/`, etc.) has a unique name, so there's no collision
- `src/common/st_utils.py` is identical across all plugins — any copy works

### Plugin Installation

When a user pastes a GitHub URL in the Plugin Manager:

1. `git clone --depth 1` into `plugins/`
2. Verify `plugin.yaml` exists
3. Delete `src/__init__.py` if present (namespace package requirement)
4. `pip install -r requirements.txt`
5. Update `plugins.json` registry
6. `st.rerun()` — new plugin appears immediately

## Plugin Specification

### plugin.yaml (Required)

```yaml
name: capacity              # Unique identifier (used as URL path)
title: 纳污能力计算           # Display name in sidebar
icon: "🌊"                  # Emoji icon
order: 10                   # Sort order (lower = higher)
description: 河道/水库纳污能力计算  # One-line description
version: 1.0.0              # Semantic version
```

### Directory Structure

```
hydro-xxx/
├── plugin.yaml              # Required
├── app.py                   # Required — Streamlit entry point
├── src/
│   ├── {module}/            # Business logic (unique name per plugin)
│   │   ├── __init__.py
│   │   └── *.py
│   └── common/
│       ├── __init__.py
│       └── st_utils.py      # page_config + excel_download + footer
├── data/sample/             # Example data (optional)
├── .streamlit/config.toml   # Streamlit config (for standalone deploy)
├── requirements.txt
└── README.md
```

### app.py Requirements

1. **Self-path resolution** — must add its own directory to `sys.path`:
   ```python
   import sys
   from pathlib import Path
   sys.path.insert(0, str(Path(__file__).resolve().parent))
   ```

2. **Tolerant page_config** — `st_utils.page_config()` uses try/except to silently skip when running inside the Toolkit host (which sets page config first).

3. **Footer** — call `footer()` at the end with the plugin's repo URL.

### Critical Rule

> **`src/__init__.py` must NOT exist.** If present, Python treats `src` as a regular package rooted in one plugin directory, breaking imports for all other plugins. The install manager automatically removes it, but plugin developers should never include it.

## Two Running Modes

Each plugin works in both modes with zero code changes:

| | Standalone | Toolkit Plugin |
|---|---|---|
| Command | `streamlit run app.py` | Loaded by Toolkit host |
| page_config | Called by plugin | Skipped (host handles it) |
| sys.path | Self-resolved | Host adds all plugin dirs |
| URL | `localhost:8501` | `localhost:8510/capacity` |

## Plugin Registry

### Integrated (Streamlit plugins)

| Plugin | Repo | Order |
|--------|------|-------|
| 🌊 capacity | [hydro-capacity](https://github.com/zengtianli/hydro-capacity) | 10 |
| ⚡ reservoir | [hydro-reservoir](https://github.com/zengtianli/hydro-reservoir) | 20 |
| 💧 efficiency | [hydro-efficiency](https://github.com/zengtianli/hydro-efficiency) | 30 |
| 📊 annual | [hydro-annual](https://github.com/zengtianli/hydro-annual) | 40 |
| 🌾 irrigation | [hydro-irrigation](https://github.com/zengtianli/hydro-irrigation) | 50 |
| 🗺️ district | [hydro-district](https://github.com/zengtianli/hydro-district) | 60 |

### Standalone (CLI / non-Streamlit)

| Project | Repo | Type |
|---------|------|------|
| hydro-geocode | [hydro-geocode](https://github.com/zengtianli/hydro-geocode) | Streamlit (not yet standardized) |
| hydro-qgis | [hydro-qgis](https://github.com/zengtianli/hydro-qgis) | CLI / QGIS |
| hydro-risk | [hydro-risk](https://github.com/zengtianli/hydro-risk) | CLI |
| hydro-rainfall | [hydro-rainfall](https://github.com/zengtianli/hydro-rainfall) | CLI |

## Developing a New Plugin

1. `mkdir ~/Dev/hydro-xxx && cd ~/Dev/hydro-xxx`
2. Create `plugin.yaml` with unique name and order
3. Create `app.py` with self-path resolution + page_config + footer
4. Put business logic in `src/{module}/`
5. Copy `src/common/st_utils.py` from any existing plugin
6. Add `requirements.txt`, `.streamlit/config.toml`, `README.md`
7. **Do NOT create `src/__init__.py`**
8. Test standalone: `streamlit run app.py`
9. Test in Toolkit: clone into `plugins/`, run Toolkit
10. Push to GitHub — users can install via URL
