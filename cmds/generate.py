#!/usr/bin/env python3
"""cmds.tianlizeng.cloud — CC 命令 & 技能说明书生成器。

扫 ~/Dev/tools/cc-configs/ 下 commands/ + skills/ + domain-skills/，
输出 site/index.html + site/<name>.html（每个一页，marked.js 客户端渲染）。
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


CC_ROOT = Path.home() / "Dev" / "tools" / "cc-configs"
SCRIPT_DIR = Path(__file__).parent
SITE_DIR = SCRIPT_DIR / "site"

# Shared template loader — local override > devtools/lib/templates/
sys.path.insert(0, str(Path.home() / "Dev" / "devtools" / "lib"))
from site_templates import load_site_templates  # noqa: E402

_TPL = load_site_templates(Path(__file__).parent)
NAVBAR_HTML = _TPL["navbar"]
SITE_HEADER_HTML = _TPL["header"]
SITE_CONTENT_CSS = _TPL["css"]
SITE_FOOTER_HTML = _TPL["footer"]

# 分类配置 SSOT：~/Dev/tools/configs/menus/sites/cmds.yaml
# 旧硬编码字典已迁出。改分类请编辑 yaml，跑 /menus-audit 检查漂移。
def _load_categories() -> tuple[dict[str, str], list[str], dict[str, str], str]:
    """从 yaml 派生 (CATEGORY_MAP, CATEGORY_ORDER, CATEGORY_COLOR, FALLBACK)。"""
    import yaml as _yaml
    cfg_path = Path.home() / "Dev" / "tools" / "configs" / "menus" / "sites" / "cmds.yaml"
    cfg = _yaml.safe_load(cfg_path.read_text(encoding="utf-8")) or {}
    cats = cfg.get("categories") or []
    auto = cfg.get("auto_categories") or []
    cmap: dict[str, str] = {}
    color: dict[str, str] = {}
    order: list[str] = []
    for c in cats:
        order.append(c["key"])
        color[c["key"]] = c["color"]
        for cmd in c.get("commands") or []:
            cmap[cmd] = c["key"]
    for c in auto:
        order.append(c["key"])
        color[c["key"]] = c["color"]
    return cmap, order, color, cfg.get("fallback_category", "杂项")


CATEGORY_MAP, CATEGORY_ORDER, CATEGORY_COLOR, _FALLBACK_CATEGORY = _load_categories()


def esc(s) -> str:
    if s is None:
        return ""
    return html.escape(str(s), quote=True)


# parse_frontmatter imported from markdown_utils below


def extract_refs(body: str) -> list[str]:
    """找正文里引用的其他 command (以 /name 形式)。"""
    found = set()
    for m in re.finditer(r"/([a-z][a-z0-9-]+)(?=[\s,、.。`）)\]])", body):
        name = m.group(1)
        # 过滤明显不是命令的（如 /tmp /var /opt /usr /Users /Dev 等路径）
        if name in {"tmp", "var", "opt", "usr", "Users", "Dev", "Work", "etc", "bin", "home", "mnt"}:
            continue
        if len(name) <= 2:
            continue
        found.add(name)
    return sorted(found)


def extract_backends(body: str) -> list[str]:
    """抽正文里引用的后端脚本路径。"""
    found = set()
    for m in re.finditer(r"~/Dev/[\w./-]+\.(py|sh|js|ts)", body):
        found.add(m.group(0))
    return sorted(found)


def collect_items() -> list[dict]:
    items: list[dict] = []

    # commands (active)
    for p in sorted((CC_ROOT / "commands").glob("*.md")):
        items.append(build_item(p, kind="command", archived=False))
    # commands/archive
    arch = CC_ROOT / "commands" / "archive"
    if arch.exists():
        for p in sorted(arch.glob("*.md")):
            items.append(build_item(p, kind="command", archived=True))
    # skills
    for sub in sorted((CC_ROOT / "skills").iterdir()):
        if not sub.is_dir():
            continue
        md = sub / "SKILL.md"
        if md.exists():
            items.append(build_item(md, kind="global-skill", archived=False, name=sub.name))
    # domain-skills
    for sub in sorted((CC_ROOT / "domain-skills").iterdir()):
        if not sub.is_dir():
            continue
        md = sub / "SKILL.md"
        if md.exists():
            items.append(build_item(md, kind="domain-skill", archived=False, name=sub.name))

    return items


def build_item(path: Path, kind: str, archived: bool, name: str | None = None) -> dict:
    raw = path.read_text(encoding="utf-8", errors="replace")
    fm, body = parse_frontmatter(raw)

    if name is None:
        name = path.stem

    display_name = f"/{name}" if kind == "command" else name
    slug = name  # URL 用文件名 stem，不带 /

    # 分类
    if archived:
        category = "归档"
    elif kind == "global-skill":
        category = "全局技能"
    elif kind == "domain-skill":
        category = "领域技能"
    else:
        category = CATEGORY_MAP.get(name, _FALLBACK_CATEGORY)

    description = fm.get("description", "")
    if not description:
        # 取正文第一个非空行
        for line in body.splitlines():
            s = line.strip()
            if s and not s.startswith("#"):
                description = s[:200]
                break

    return {
        "name": name,
        "display_name": display_name,
        "slug": slug,
        "kind": kind,
        "archived": archived,
        "category": category,
        "description": description,
        "argument_hint": fm.get("argument-hint", ""),
        "body": body,
        "raw_markdown": raw,
        "refs": extract_refs(body),
        "backends": extract_backends(body),
        "path": str(path).replace(str(Path.home()), "~"),
        "length": len(body),
    }


# ---------------------------------------------------------------------------
# HTML templates
# ---------------------------------------------------------------------------

BASE_CSS = """
  :root {
    --bg: #f6f8fa; --card: #fff; --border: #e5e7eb;
    --text: #1f2328; --muted: #6b7280; --accent: #0071E3;
    --code-bg: #f1f3f5;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { background: #f5f5f7; color: var(--text); }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  code {
    background: var(--code-bg);
    padding: 1px 6px;
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, monospace;
    font-size: 0.92em;
  }
  pre {
    background: #0f172a;
    color: #e2e8f0;
    padding: 14px 16px;
    border-radius: 8px;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.55;
    margin: 12px 0;
  }
  pre code { background: transparent; padding: 0; color: inherit; font-size: inherit; }

  header.site {
    display: flex;
    align-items: baseline;
    gap: 20px;
    margin-bottom: 22px;
    flex-wrap: wrap;
  }
  header.site h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
  header.site .tagline { color: var(--muted); font-size: 13px; }
  header.site .stats { margin-left: auto; display: flex; gap: 18px; font-size: 13px; color: var(--muted); }
  header.site .stats strong { color: var(--text); font-weight: 600; }

  .breadcrumb {
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 16px;
  }
  .breadcrumb a:hover { color: var(--accent); }

  /* Index */
  .toolbar { display: flex; gap: 12px; margin-bottom: 20px; align-items: center; flex-wrap: wrap; }
  #search {
    flex: 1; min-width: 280px;
    padding: 10px 14px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
  }
  #search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(0,113,227,0.12); }
  .filter-btns { display: flex; gap: 6px; flex-wrap: wrap; }
  .filter-btn {
    padding: 7px 12px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 12.5px;
    cursor: pointer;
    font-family: inherit;
    color: var(--muted);
  }
  .filter-btn:hover { color: var(--text); }
  .filter-btn.active { background: #1f2328; color: #fff; border-color: #1f2328; }

  .group { margin-bottom: 22px; }
  .group h2 {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0;
    padding: 4px 10px;
    margin-bottom: 10px;
    border-left: 3px solid var(--c);
    color: var(--c);
    display: flex; align-items: center; gap: 10px;
  }
  .group h2 .count {
    background: var(--border); color: var(--muted);
    font-size: 11px; font-weight: 600;
    padding: 1px 8px; border-radius: 10px;
  }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px; }
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-left: 3px solid var(--c);
    border-radius: 10px;
    padding: 12px 14px;
    display: flex; flex-direction: column; gap: 6px;
    transition: box-shadow 0.15s, transform 0.15s;
    min-width: 0;
  }
  .card:hover {
    box-shadow: 0 4px 14px rgba(0,0,0,0.07);
    transform: translateY(-1px);
    border-color: var(--accent);
  }
  .card a.card-link { color: inherit; text-decoration: none; }
  .card-name { font-size: 14.5px; font-weight: 600; letter-spacing: -0.01em; }
  .card-name code { background: transparent; padding: 0; color: inherit; font-size: inherit; font-weight: 600; }
  .card-hint { font-size: 11px; color: var(--muted); font-family: ui-monospace, monospace; }
  .card-desc { font-size: 12.5px; color: var(--muted); line-height: 1.5; }
  .card.archived { opacity: 0.7; }

  .tag {
    display: inline-block;
    background: #f1f3f5;
    color: #495057;
    font-size: 10.5px;
    padding: 1px 7px;
    border-radius: 4px;
    font-weight: 500;
  }

  /* Detail page */
  .detail-header {
    background: var(--card);
    border: 1px solid var(--border);
    border-left: 5px solid var(--c);
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 24px;
  }
  .detail-header h1 {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin-bottom: 6px;
  }
  .detail-header h1 code { background: transparent; padding: 0; font-size: inherit; color: inherit; font-weight: 700; }
  .detail-header .desc { color: var(--muted); font-size: 15px; margin-bottom: 12px; }
  .detail-header .meta { display: flex; gap: 10px; flex-wrap: wrap; font-size: 12.5px; }
  .detail-header .meta .chip {
    background: var(--c);
    color: #fff;
    padding: 3px 10px;
    border-radius: 12px;
    font-weight: 600;
  }
  .detail-header .meta .chip.ghost {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--muted);
  }
  .detail-header .hint-line {
    font-family: ui-monospace, monospace;
    font-size: 13px;
    color: var(--text);
    background: var(--code-bg);
    padding: 6px 10px;
    border-radius: 6px;
    margin-top: 10px;
    display: inline-block;
  }

  article.body {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 28px 32px;
  }
  article.body h1, article.body h2, article.body h3, article.body h4 {
    margin-top: 28px; margin-bottom: 12px; font-weight: 700;
  }
  article.body h1 { font-size: 22px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
  article.body h2 { font-size: 18px; color: var(--text); }
  article.body h3 { font-size: 15.5px; }
  article.body h4 { font-size: 14px; color: var(--muted); }
  article.body p { margin-bottom: 10px; }
  article.body ul, article.body ol { margin: 8px 0 12px 24px; }
  article.body li { margin-bottom: 4px; }
  article.body table {
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 13.5px;
    width: 100%;
  }
  article.body th, article.body td {
    border: 1px solid var(--border);
    padding: 8px 12px;
    text-align: left;
  }
  article.body th { background: #f9fafb; font-weight: 600; }
  article.body blockquote {
    border-left: 3px solid var(--c);
    padding: 4px 14px;
    color: var(--muted);
    margin: 12px 0;
  }

  .sidebar-block {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 18px;
    margin-top: 20px;
  }
  .sidebar-block h3 {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    margin-bottom: 8px;
  }
  .sidebar-block .chip-list { display: flex; gap: 6px; flex-wrap: wrap; }
  .sidebar-block .chip-list a {
    background: var(--code-bg);
    padding: 4px 10px;
    border-radius: 6px;
    font-family: ui-monospace, monospace;
    font-size: 12.5px;
    color: var(--text);
  }
  .sidebar-block .chip-list a:hover { background: var(--accent); color: #fff; text-decoration: none; }
  .sidebar-block .path-list { font-family: ui-monospace, monospace; font-size: 12px; color: var(--muted); }
  .sidebar-block .path-list div { padding: 2px 0; }

  footer { text-align: center; color: var(--muted); font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--border); }

  .hidden { display: none !important; }

  @media (max-width: 640px) {
    body { padding: 16px; }
    .grid { grid-template-columns: 1fr; }
    .detail-header, article.body { padding: 16px 18px; }
  }
"""


def render_index(items: list[dict]) -> str:
    # 按 category 分组
    groups: dict[str, list[dict]] = {c: [] for c in CATEGORY_ORDER}
    for it in items:
        groups.setdefault(it["category"], []).append(it)

    # 统计
    active_cmds = sum(1 for x in items if x["kind"] == "command" and not x["archived"])
    arch_cmds = sum(1 for x in items if x["kind"] == "command" and x["archived"])
    global_sk = sum(1 for x in items if x["kind"] == "global-skill")
    domain_sk = sum(1 for x in items if x["kind"] == "domain-skill")

    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    # 搜索数据
    search_data = [{
        "name": it["name"],
        "display": it["display_name"],
        "desc": it["description"][:200],
        "slug": it["slug"],
        "cat": it["category"],
        "hint": it["argument_hint"],
    } for it in items]

    groups_html = []
    for cat in CATEGORY_ORDER:
        lst = groups.get(cat) or []
        if not lst:
            continue
        color = CATEGORY_COLOR.get(cat, "#6b7280")
        cards_html = "".join(render_card(it, color) for it in lst)
        groups_html.append(f"""
<section class="tlz-section" data-cat="{esc(cat)}" style="--c:{color}">
  <div class="tlz-section-title"><span class="tlz-icon">📁</span><h2>{esc(cat)}</h2><span class="tlz-count">{len(lst)}</span></div>
  <div class="tlz-grid">{cards_html}</div>
</section>""")

    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CC 命令 & 技能说明书</title>
<style>{SITE_CONTENT_CSS}</style>
<style>{BASE_CSS}</style>
<style>
  .cmds-archived {{ opacity: 0.6; }}
  .cmds-card-hint {{ font-size: 11px; color: #86868b; font-family: ui-monospace, monospace; margin-top: 2px; }}
</style>
</head>
<body class="tlz-page">
{NAVBAR_HTML}
{SITE_HEADER_HTML}
<div class="tlz-container">
<header class="tlz-stats-bar">
  <span><strong>{active_cmds}</strong> 命令</span>
  <span><strong>{global_sk + domain_sk}</strong> 技能</span>
  <span><strong>{arch_cmds}</strong> 归档</span>
</header>

<div class="tlz-search-wrap">
  <input id="search" class="tlz-search" type="search" placeholder="搜索命令 / 技能 / 描述…（按 / 聚焦）" autocomplete="off">
</div>
<div class="tlz-filters" data-group="cat">
  <button class="tlz-btn active" data-cat="all">全部</button>
  {"".join(f'<button class="tlz-btn" data-cat="{esc(c)}">{esc(c)}</button>' for c in CATEGORY_ORDER if (groups.get(c) or []))}
</div>

<main>{"".join(groups_html)}</main>

<footer class="tlz-footer">
  Generated {now} · <a href="_how-to-create.html">怎么建一个新命令 / 技能 →</a>
</footer>
</div>
{SITE_FOOTER_HTML}

<script src="site-filter.js"></script>
<script>
initSiteFilter({{
  searchInput: document.getElementById('search'),
  searchAttrs: ['name', 'desc'],
  filterGroups: [{{
    buttons: Array.from(document.querySelectorAll('.tlz-filters[data-group="cat"] .tlz-btn')),
    cardAttr: 'data-cat'
  }}],
  cards: Array.from(document.querySelectorAll('.tlz-card')),
  sectionSelector: '.tlz-section',
  cardClass: 'tlz-card',
  keyboard: {{searchFocus: '/', clear: 'Escape'}}
}});
</script>

</body>
</html>
"""


def render_card(it: dict, color: str) -> str:
    arch_cls = " cmds-archived" if it["archived"] else ""
    hint_html = f'<div class="cmds-card-hint">{esc(it["argument_hint"])}</div>' if it["argument_hint"] else ""
    return f"""
<a class="tlz-card{arch_cls}" href="{esc(it["slug"])}.html"
   data-name="{esc(it["name"])}" data-desc="{esc(it["description"])}"
   style="border-left:3px solid {color}">
  <div class="tlz-card-body">
    <div class="tlz-card-name"><code>{esc(it["display_name"])}</code></div>
    {hint_html}
    <div class="tlz-card-desc">{esc(it["description"])}</div>
  </div>
</a>""".strip()


def render_detail(it: dict, all_items: list[dict]) -> str:
    color = CATEGORY_COLOR.get(it["category"], "#6b7280")

    # 交叉引用：编排命令
    refs = [x for x in it["refs"] if any(i["name"] == x for i in all_items)]
    refs_html = ""
    if refs:
        chips = "".join(f'<a href="{esc(r)}.html">/{esc(r)}</a>' for r in refs)
        refs_html = f"""
<section class="sidebar-block">
  <h3>编排关系 — 调用的其他命令</h3>
  <div class="chip-list">{chips}</div>
</section>"""

    # 后端脚本
    backends_html = ""
    if it["backends"]:
        items = "".join(f'<div>{esc(b)}</div>' for b in it["backends"])
        backends_html = f"""
<section class="sidebar-block">
  <h3>引用的后端脚本</h3>
  <div class="path-list">{items}</div>
</section>"""

    hint_html = f'<div class="hint-line">{esc(it["argument_hint"])}</div>' if it["argument_hint"] else ""

    # kind chip
    kind_label = {"command": "命令", "global-skill": "全局技能", "domain-skill": "领域技能"}[it["kind"]]
    arch_chip = ' <span class="chip ghost">归档</span>' if it["archived"] else ""

    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(it["display_name"])} — CC Docs</title>
<style>{BASE_CSS}</style>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>
{NAVBAR_HTML}
<div class="breadcrumb">
  <a href="index.html">CC Docs</a> /
  <a href="index.html">{esc(it["category"])}</a> /
  <span>{esc(it["display_name"])}</span>
</div>

<div class="detail-header" style="--c:{color}">
  <h1><code>{esc(it["display_name"])}</code></h1>
  <div class="desc">{esc(it["description"])}</div>
  <div class="meta">
    <span class="chip">{esc(it["category"])}</span>
    <span class="chip ghost">{kind_label}</span>{arch_chip}
  </div>
  {hint_html}
</div>

<article class="body" id="body">
  <noscript>
    <p>JavaScript 关闭时看不到渲染。以下是原始 markdown：</p>
    <pre>{esc(it["raw_markdown"])}</pre>
  </noscript>
</article>

{refs_html}
{backends_html}

<section class="sidebar-block">
  <h3>源文件</h3>
  <div class="path-list"><div>{esc(it["path"])}</div></div>
</section>

<footer>
  <a href="index.html">← 返回列表</a> · <a href="_how-to-create.html">怎么建一个新命令 / 技能</a>
</footer>

<script id="src" type="text/plain">{esc(it["raw_markdown"])}</script>
<script>
const raw = document.getElementById('src').textContent;
document.getElementById('body').innerHTML = marked.parse(raw);
</script>

</body>
</html>
"""


HOW_TO_CREATE_MD = """# 怎么建一个新命令 / 技能

Source of truth：`~/Dev/tools/cc-configs/`。改动后 `bash ~/Dev/tools/cc-configs/install.sh` 或直接在目录下工作（symlink 已做好）。

## 建 slash command

**选址**：`~/Dev/tools/cc-configs/commands/<name>.md`

**模板**：

```markdown
---
description: 一句话描述（会显示在卡片上）
argument-hint: <args>
---

正文段，说明任务是什么、为什么需要。

## 用法

```bash
/<name> <args>
```

## 流程

1. 步骤
2. 步骤

## 参数

| 参数 | 说明 |
|---|---|

## 规则

- 凭证在 `~/.personal_env`，不问用户要
- 幂等：每步先 list 再 add
- 失败立即停止

## 参考

- 现成工具：`~/Dev/devtools/...`
```

**命名约定**：
- 短动词：`/fix` `/ship` `/cf` `/pull`
- 复合用连字符：`/ship-site` `/update-hooks` `/read-docx`
- 子命令用参数：`/merge md` 不用 `/merge-md`

## 编排命令（meta）

涉及 ≥3 步常用链路时才建。例子：

- `/groom` = `/pull` → `/audit` → `/promote` → `/ship`
- `/launch` = `/site-add` → `/groom` → `/repo-map` → `/ship-site` → `/deploy`

编排命令内部只**调用**其他命令，不重复实现逻辑。

## 建 skill

**全局 skill**：`~/Dev/tools/cc-configs/skills/<name>/SKILL.md` — 跨项目常规规范（`context` / `plan-first` / `harness`）。

**领域 skill**：`~/Dev/tools/cc-configs/domain-skills/<name>/SKILL.md` — 特定项目/领域的上下文（水利 10 个）。

通过 `harness.yaml` 配置分发到项目 `.claude/skills/`，项目 cd 进去时自动加载（被动触发）。

**skill 模板**：

```markdown
---
name: <name>
description: 被动触发描述。当 <X> 时触发。
---

# <Title>

## 业务概述

## 关键概念 / 数据 / 命令

## 踩坑

## 相关工具 / 脚本
```

## command vs skill

| | command | skill |
|---|---|---|
| 触发 | 主动 `/name` | 被动（按项目/关键词） |
| 场景 | 执行某类任务 | 给 AI 上下文 |
| 写法 | 流程化步骤 | 说明文档 |

## 治理原则

**只按重叠删，不按频率删**（2026-04-17 feedback_commands_cleanup_rule）：

- 命令 A 所有功能能被命令 B 完成 → A 归档
- 两个命令场景完全重复 → 挑命名更好的留
- 使用频率低 ≠ 归档理由（可能只是还没触发场景）

## 不造轮子

建新命令前：

1. 看 `~/Dev/tools/cc-configs/commands/` 有没有现成的
2. 看 `commands/archive/` 有没有可以复活的
3. 看 `~/Dev/devtools/lib/tools/` 有没有现成脚本可以包
4. 没有才新建

## 验证闭环

本站点 `cmds.tianlizeng.cloud` 每次 push 到 cc-configs 仓库后自动从源文件更新。改 `.md` 后：

```bash
cd ~/Dev/stations/cmds && bash deploy.sh
```

新命令几秒内在 `https://cmds.tianlizeng.cloud/<name>` 可见。
"""


def render_how_to_create() -> str:
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>怎么建一个新命令 / 技能 — CC Docs</title>
<style>{BASE_CSS}</style>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>
{NAVBAR_HTML}
<div class="breadcrumb">
  <a href="index.html">CC Docs</a> / <span>怎么建一个新命令 / 技能</span>
</div>

<article class="body" id="body" style="--c:#0071E3;border-left:5px solid #0071E3"></article>

<footer>
  <a href="index.html">← 返回列表</a>
</footer>

<script id="src" type="text/plain">{esc(HOW_TO_CREATE_MD)}</script>
<script>
document.getElementById('body').innerHTML = marked.parse(document.getElementById('src').textContent);
</script>

</body>
</html>
"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    if not CC_ROOT.exists():
        print(f"ERROR: {CC_ROOT} not found", file=sys.stderr)
        sys.exit(1)

    SITE_DIR.mkdir(parents=True, exist_ok=True)

    items = collect_items()
    print(f"Collected {len(items)} items")

    # index
    idx_html = render_index(items)
    import shutil as _shutil
    _shared_js = Path.home() / "Dev/devtools/lib/templates/site-filter.js"
    if _shared_js.exists():
        _shutil.copy(_shared_js, SITE_DIR / "site-filter.js")
    (SITE_DIR / "index.html").write_text(idx_html, encoding="utf-8")

    # details
    for it in items:
        detail_html = render_detail(it, items)
        (SITE_DIR / f"{it['slug']}.html").write_text(detail_html, encoding="utf-8")

    # how-to
    (SITE_DIR / "_how-to-create.html").write_text(render_how_to_create(), encoding="utf-8")

    total_size = sum(f.stat().st_size for f in SITE_DIR.glob("*.html"))
    file_count = len(list(SITE_DIR.glob("*.html")))
    print(f"Wrote {file_count} HTML files, {total_size:,} bytes total → {SITE_DIR}")


if __name__ == "__main__":
    main()
