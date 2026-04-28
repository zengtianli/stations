#!/usr/bin/env python3
"""Stack — 项目架构说明书静态站点生成器。

读 projects.yaml → site/index.html。
信息密集、亮色、Apple 风格 liquid glass。
"""

import html
import json
import re
import sys
from datetime import datetime
from pathlib import Path

# Shared helpers (see ~/Dev/devtools/lib/markdown_utils.py)
import sys as _sys
for _p in [Path.home() / "Dev/devtools/lib", Path("/var/www/devtools/lib")]:
    if _p.exists():
        _sys.path.insert(0, str(_p))
        break
from markdown_utils import parse_frontmatter  # noqa: E402

try:
    import yaml
except ImportError:
    print("ERROR: 需要 PyYAML。安装：uv pip install pyyaml 或 pip3 install pyyaml", file=sys.stderr)
    sys.exit(1)

# services.ts SSOT: 卡片 domain/port 从这里派生，projects.yaml 不再维护。
_TOOLS_DIR = Path.home() / "Dev" / "devtools" / "lib" / "tools"
try:
    if str(_TOOLS_DIR) not in sys.path:
        sys.path.insert(0, str(_TOOLS_DIR))
    from _services_ts import load_services as _load_services
except Exception as _e:
    _load_services = None
    print(f"  (services.ts loader unavailable: {_e}; domain/port will be empty)", file=sys.stderr)

SERVICE_LOOKUP: dict[str, dict] = {}


# Shared template loader — local site-navbar.html / site-header.html / site-content.css
# override the devtools/lib/templates/ shared copy. See docs/knowledge/station-refactor-roadmap-20260422.md
sys.path.insert(0, str(Path.home() / "Dev" / "devtools" / "lib"))
from site_templates import load_site_templates  # noqa: E402

_TPL = load_site_templates(Path(__file__).parent)
NAVBAR_HTML = _TPL["navbar"]
SITE_HEADER_HTML = _TPL["header"]
SITE_CONTENT_CSS = _TPL["css"]
SITE_FOOTER_HTML = _TPL["footer"]


STATUS_STYLE = {
    "active":             {"color": "#16a34a", "bg": "#dcfce7", "label": "运行中"},
    "likely-stale":       {"color": "#ca8a04", "bg": "#fef3c7", "label": "可能废弃"},
    "archive-candidate":  {"color": "#6b7280", "bg": "#e5e7eb", "label": "归档候选"},
}


def _parse_md_frontmatter(path: Path) -> tuple[str, str]:
    """从 .md 文件读 description 和 argument-hint；没有 frontmatter 则取第一段正文。"""
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return "", ""
    fm, body = parse_frontmatter(text)
    desc = fm.get("description", "")
    arg_hint = fm.get("argument-hint", "")
    if not desc:
        for line in body.splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                desc = line[:140]
                break
    return desc, arg_hint


def scan_cc_inventory() -> list[dict]:
    """扫 ~/Dev/tools/cc-configs 下的 commands 和 skills，返回 project 风格的卡片数据。"""
    cc = Path.home() / "Dev" / "tools" / "cc-configs"
    if not cc.exists():
        return []
    items: list[dict] = []

    # Active commands
    cmd_dir = cc / "commands"
    if cmd_dir.exists():
        for p in sorted(cmd_dir.glob("*.md")):
            desc, hint = _parse_md_frontmatter(p)
            items.append({
                "name": f"/{p.stem}",
                "purpose": (hint + " — " if hint else "") + (desc or p.stem),
                "type": "command",
                "stack": ["command"],
                "path": str(p),
                "status": "active",
                "kind": "command",
            })

    # Archived commands
    arch = cmd_dir / "archive"
    if arch.exists():
        for p in sorted(arch.glob("*.md")):
            desc, _ = _parse_md_frontmatter(p)
            items.append({
                "name": f"/{p.stem}",
                "purpose": desc or p.stem,
                "type": "command-archived",
                "stack": ["archived"],
                "path": str(p),
                "status": "archive-candidate",
                "kind": "command",
            })

    # Skills (global + domain)
    for kind_dir, label in [("skills", "global-skill"), ("domain-skills", "domain-skill")]:
        d = cc / kind_dir
        if not d.exists():
            continue
        for sub in sorted(d.iterdir()):
            if not sub.is_dir():
                continue
            skill_md = sub / "SKILL.md"
            if not skill_md.exists():
                cands = list(sub.glob("*.md"))
                if not cands:
                    continue
                skill_md = cands[0]
            desc, _ = _parse_md_frontmatter(skill_md)
            items.append({
                "name": sub.name,
                "purpose": desc or sub.name,
                "type": "skill",
                "stack": [label],
                "path": str(skill_md),
                "status": "active",
                "kind": "skill",
            })

    return items


def esc(text) -> str:
    if text is None:
        return ""
    return html.escape(str(text), quote=True)


def render_project_card(p: dict, group_color: str) -> str:
    kind = p.get("kind", "project")
    status = p.get("status", "active")
    st = STATUS_STYLE.get(status, STATUS_STYLE["active"])
    name = esc(p.get("name", "?"))
    purpose = esc(p.get("purpose", ""))
    path = esc(p.get("path", "")).replace(str(Path.home()), "~")
    # domain/port: 先看 projects.yaml（已废但保留 legacy），再 fallback 到 services.ts
    domain = p.get("domain", "") or ""
    port = p.get("port", "") or ""
    if not (domain and port):
        svc = SERVICE_LOOKUP.get(p.get("name", ""))
        if svc:
            if not domain:
                domain = svc.get("host") or ""
            if not port and svc.get("port"):
                port = str(svc["port"])
    stack = p.get("stack") or []
    notes = esc(p.get("notes", ""))
    type_ = esc(p.get("type", ""))

    domain_html = ""
    if domain:
        domain_html = (
            f'<a class="domain" href="https://{esc(domain)}" target="_blank" rel="noopener">'
            f'{esc(domain)}</a>'
        )
    port_html = f'<span class="port">:{esc(port)}</span>' if port else ""

    stack_html = "".join(f'<span class="tag">{esc(s)}</span>' for s in stack)

    notes_html = f'<div class="notes">{notes}</div>' if notes else ""

    # Build searchable text for filter
    search_blob = " ".join(
        str(x) for x in [name, purpose, path, domain, port, type_, notes, *stack]
    ).lower()

    dot_cls = {"active": "tlz-dot--ok", "likely-stale": "tlz-dot--warn",
               "archive-candidate": "tlz-dot--unknown"}.get(status, "tlz-dot--unknown")
    return f"""
<div class="tlz-card stack-card" data-status="{status}" data-kind="{kind}" data-search="{esc(search_blob)}">
  <span class="tlz-dot {dot_cls}" title="{st['label']}"></span>
  <div class="tlz-card-body">
    <div class="tlz-card-header">
      <span class="tlz-card-name">{name}</span>
      <span class="tlz-card-meta">{type_}</span>
    </div>
    <div class="tlz-card-desc">{purpose}</div>
    <div class="stack-card-meta">
      {domain_html}{port_html}
      <span class="stack-tags">{stack_html}</span>
    </div>
    <div class="stack-card-path">
      <code>{path}</code>
    </div>
    {notes_html}
  </div>
</div>""".strip()


def render_group(group: dict) -> str:
    name = esc(group.get("name", ""))
    color = group.get("color", "#6b7280")
    icon = esc(group.get("icon", "folder"))
    projects = group.get("projects") or []
    count = len(projects)

    cards = "\n".join(render_project_card(p, color) for p in projects)

    return f"""
<section class="tlz-section" data-group="{name}">
  <div class="tlz-section-title" style="--c:{color}">
    <span class="tlz-icon">📦</span>
    <h2>{name}</h2>
    <span class="tlz-count">{count}</span>
  </div>
  <div class="tlz-grid">
    {cards}
  </div>
</section>""".strip()


def render_html(data: dict) -> str:
    meta = data.get("meta") or {}
    groups = data.get("groups") or []

    total_projects = sum(
        1 for g in groups for p in (g.get("projects") or [])
        if p.get("kind", "project") == "project"
    )
    total_commands = sum(
        1 for g in groups for p in (g.get("projects") or [])
        if p.get("kind") == "command" and p.get("status") != "archive-candidate"
    )
    total_skills = sum(
        1 for g in groups for p in (g.get("projects") or []) if p.get("kind") == "skill"
    )
    total_domains = sum(
        1 for g in groups for p in (g.get("projects") or []) if p.get("domain")
    )
    total_archive = sum(
        1 for g in groups for p in (g.get("projects") or [])
        if p.get("status") == "archive-candidate"
    )
    total_stale = sum(
        1 for g in groups for p in (g.get("projects") or [])
        if p.get("status") == "likely-stale"
    )

    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    groups_html = "\n".join(render_group(g) for g in groups)

    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stack — 项目架构说明书</title>
<style>
{SITE_CONTENT_CSS}
/* stack 站独有样式（卡片细节）*/
.stack-card-meta {{ display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 4px; font-size: 11.5px; }}
.stack-card-meta .domain {{ color: #0071e3; text-decoration: none; font-family: ui-monospace, monospace; }}
.stack-card-meta .port {{ color: #86868b; font-family: ui-monospace, monospace; }}
.stack-tags {{ display: inline-flex; gap: 4px; flex-wrap: wrap; }}
.stack-card-path {{ font-size: 10.5px; color: #9ca3af; font-family: ui-monospace, monospace; margin-top: 4px; }}
.notes {{ font-size: 11.5px; color: #92630d; background: #fffbeb; padding: 4px 8px; border-radius: 6px; border-left: 2px solid #f59e0b; margin-top: 4px; }}
:root {{
    --bg: #f5f5f7;
    --card: #ffffff;
    --border: #e5e7eb;
    --text: #1f2328;
    --muted: #6b7280;
    --accent: #0071E3;
  }}
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}

  header {{
    display: flex;
    align-items: baseline;
    gap: 24px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }}
  header h1 {{ font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }}
  header .tagline {{ color: var(--muted); font-size: 13px; }}

  .stats {{
    display: flex;
    gap: 20px;
    margin-left: auto;
    font-size: 13px;
  }}
  .stat {{ color: var(--muted); }}
  .stat strong {{ color: var(--text); font-weight: 600; }}

  .toolbar {{
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    align-items: center;
    flex-wrap: wrap;
  }}
  #search {{
    flex: 1;
    min-width: 280px;
    padding: 10px 14px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }}
  #search:focus {{
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(0,113,227,0.12);
  }}
  .filters {{ display: flex; gap: 6px; }}
  .filter-btn {{
    padding: 8px 14px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
    font-family: inherit;
    color: var(--muted);
    transition: all 0.15s;
  }}
  .filter-btn:hover {{ color: var(--text); }}
  .filter-btn.active {{
    background: #1f2328;
    color: #fff;
    border-color: #1f2328;
  }}

  .group {{ margin-bottom: 24px; }}
  .group-title {{
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 10px;
    padding-left: 10px;
    border-left: 3px solid var(--c);
    color: var(--c);
  }}
  .group-name {{ letter-spacing: -0.01em; }}
  .group-count {{
    background: var(--border);
    color: var(--muted);
    font-size: 11px;
    font-weight: 600;
    padding: 1px 8px;
    border-radius: 10px;
  }}

  .grid {{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 10px;
  }}

  .card {{
    background: var(--card);
    border: 1px solid var(--border);
    border-left: 3px solid var(--g);
    border-radius: 10px;
    padding: 12px 14px;
    transition: box-shadow 0.15s, transform 0.15s;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    cursor: pointer;
  }}
  .card:hover {{
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    transform: translateY(-1px);
  }}

  .card-top {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }}
  .card-name {{
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }}
  .status-dot {{
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }}

  .purpose {{
    font-size: 12.5px;
    color: var(--muted);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }}
  .card.expanded {{
    box-shadow: 0 8px 24px rgba(0,0,0,0.10);
    z-index: 2;
    position: relative;
  }}
  .card.expanded .purpose {{
    -webkit-line-clamp: unset;
    display: block;
    overflow: visible;
  }}
  .card.expanded .card-name {{
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }}
  .card.expanded .domain {{
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }}
  .card.expanded .path {{
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    max-width: 100%;
    color: var(--muted);
    font-size: 11px;
  }}
  .card.expanded .notes {{
    font-size: 12px;
  }}

  .meta {{ font-size: 12px; display: flex; align-items: center; gap: 4px; }}
  .domain {{
    color: var(--accent);
    text-decoration: none;
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 11.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }}
  .domain:hover {{ text-decoration: underline; }}
  .port {{ color: var(--muted); font-family: ui-monospace, monospace; font-size: 11.5px; }}

  .tags {{ display: flex; gap: 4px; flex-wrap: wrap; }}
  .tag {{
    background: #f1f3f5;
    color: #495057;
    font-size: 10.5px;
    padding: 1px 7px;
    border-radius: 4px;
    font-weight: 500;
  }}

  .path-row {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    font-size: 10.5px;
  }}
  .path {{
    color: #9ca3af;
    font-family: ui-monospace, monospace;
    font-size: 10.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 70%;
  }}
  .type-tag {{
    color: var(--muted);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }}

  .notes {{
    font-size: 11.5px;
    color: #92630d;
    background: #fffbeb;
    padding: 4px 8px;
    border-radius: 6px;
    border-left: 2px solid #f59e0b;
    margin-top: 2px;
  }}

  .hidden {{ display: none !important; }}

  footer {{
    text-align: center;
    color: var(--muted);
    font-size: 12px;
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }}
  footer a {{ color: var(--accent); text-decoration: none; }}

  @media (max-width: 640px) {{
    body {{ padding: 16px; }}
    .stats {{ margin-left: 0; flex-wrap: wrap; }}
    .grid {{ grid-template-columns: 1fr; }}
  }}
</style>
</head>
<body class="tlz-page">
{NAVBAR_HTML}
{SITE_HEADER_HTML}
<div class="tlz-container">
<header class="tlz-stats-bar">
    <span><strong>{total_projects}</strong> 项目</span>
    <span><strong>{total_commands}</strong> 命令</span>
    <span><strong>{total_skills}</strong> 技能</span>
    <span><strong>{total_domains}</strong> 子域名</span>
    <span><strong>{total_stale}</strong> 可能废弃</span>
    <span><strong>{total_archive}</strong> 归档候选</span>
</header>

<div class="tlz-search-wrap">
  <input id="search" class="tlz-search" type="search" placeholder="搜索项目 / 域名 / 技术栈 / 路径…" autocomplete="off">
</div>
<div class="tlz-filters" data-group="kind">
  <button class="tlz-btn active" data-kind="all">全部</button>
  <button class="tlz-btn" data-kind="project">项目</button>
  <button class="tlz-btn" data-kind="command">命令</button>
  <button class="tlz-btn" data-kind="skill">技能</button>
</div>
<div class="tlz-filters" data-group="status">
  <button class="tlz-btn active" data-status="all">全状态</button>
  <button class="tlz-btn" data-status="active">运行中</button>
  <button class="tlz-btn" data-status="likely-stale">可能废弃</button>
  <button class="tlz-btn" data-status="archive-candidate">归档候选</button>
</div>

<main>
{groups_html}
</main>

<footer class="tlz-footer">
  Generated {now} · <a href="https://github.com/zengtianli/stack">stack</a>
</footer>
</div>
{SITE_FOOTER_HTML}

<script src="site-filter.js"></script>
<script>
(function() {{
  initSiteFilter({{
    searchInput: document.getElementById('search'),
    searchAttrs: ['search'],
    filterGroups: [
      {{
        buttons: Array.from(document.querySelectorAll('.tlz-filters[data-group="kind"] .tlz-btn')),
        cardAttr: 'data-kind'
      }},
      {{
        buttons: Array.from(document.querySelectorAll('.tlz-filters[data-group="status"] .tlz-btn')),
        cardAttr: 'data-status'
      }}
    ],
    cards: Array.from(document.querySelectorAll('.tlz-card')),
    sectionSelector: '.tlz-section',
    cardClass: 'tlz-card',
    keyboard: {{searchFocus: '/', clear: 'Escape'}}
  }});

  const cards = Array.from(document.querySelectorAll('.tlz-card'));
  // Click card to expand / collapse (但链接点击不触发)
  cards.forEach(c => {{
    c.addEventListener('click', e => {{
      if (e.target.tagName === 'A') return;
      c.classList.toggle('expanded');
    }});
  }});

  // Keyboard: / focuses search, Esc clears
  document.addEventListener('keydown', e => {{
    if (e.key === '/' && document.activeElement !== search) {{
      e.preventDefault();
      search.focus();
    }}
    if (e.key === 'Escape' && document.activeElement === search) {{
      search.value = '';
      currentQuery = '';
      apply();
      search.blur();
    }}
    // Esc (in body) collapses all expanded cards
    if (e.key === 'Escape' && document.activeElement !== search) {{
      document.querySelectorAll('.card.expanded').forEach(c => c.classList.remove('expanded'));
    }}
  }});
}})();
</script>

</body>
</html>
"""


def main():
    script_dir = Path(__file__).parent
    yaml_path = script_dir / "projects.yaml"
    site_dir = script_dir / "site"

    if not yaml_path.exists():
        print(f"ERROR: {yaml_path} not found", file=sys.stderr)
        sys.exit(1)

    # Build services.ts lookup so render_project_card 可以派生 domain/port
    global SERVICE_LOOKUP
    if _load_services is not None:
        try:
            SERVICE_LOOKUP = {svc["name"]: svc for svc in _load_services()}
            print(f"  loaded {len(SERVICE_LOOKUP)} services from services.ts")
        except Exception as e:
            print(f"  services.ts load failed: {e}", file=sys.stderr)

    data = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))

    # 分组元数据（name/icon/color）SSOT：~/Dev/tools/configs/menus/sites/stack.yaml
    # projects.yaml 仅保留项目数据；分组元数据以 menus 为准（漂移由 /menus-audit 检测）
    menus_path = Path.home() / "Dev" / "tools" / "configs" / "menus" / "sites" / "stack.yaml"
    if menus_path.exists():
        menus_cfg = yaml.safe_load(menus_path.read_text(encoding="utf-8")) or {}
        menu_groups = {g["name"]: g for g in (menus_cfg.get("groups") or [])}
        for g in data.get("groups") or []:
            meta = menu_groups.get(g.get("name"))
            if meta:
                g["icon"] = meta.get("icon", g.get("icon"))
                g["color"] = meta.get("color", g.get("color"))

    # CC 命令 & 技能已迁出独立站 cmds.tianlizeng.cloud
    html_text = render_html(data)

    site_dir.mkdir(exist_ok=True)
    import shutil as _shutil
    _shared_js = Path.home() / "Dev/devtools/lib/templates/site-filter.js"
    if _shared_js.exists():
        _shutil.copy(_shared_js, site_dir / "site-filter.js")
    output = site_dir / "index.html"
    output.write_text(html_text, encoding="utf-8")

    total = sum(len(g.get("projects") or []) for g in data.get("groups") or [])
    print(f"Generated {output} ({len(html_text):,} bytes, {total} projects)")


if __name__ == "__main__":
    main()
