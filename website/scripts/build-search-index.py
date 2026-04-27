#!/opt/homebrew/bin/python3
"""Build FTS5 search index from:
- content/ markdown files (本站 blog/projects/research/about/...)
- catalog.yaml (跨站子域 + sub_pages metadata, 32+ entries)
- stack/projects.yaml (项目清单, 几十个项目)

每行加 `site` 字段标识来源（website / hydro-toolkit / cc-options / stack 等），
前端可在结果列表显示「来自 hydro-toolkit」。
"""

import os
import re
import sqlite3
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: pyyaml required. pip install pyyaml", file=sys.stderr)
    sys.exit(1)

CONTENT_DIR = Path(__file__).resolve().parent.parent / "content"
DB_PATH = Path(__file__).resolve().parent.parent / "data" / "search.db"
CATALOG_YAML = Path.home() / "Dev/tools/configs/menus/catalog.yaml"
STACK_YAML = Path.home() / "Dev/stations/stack/projects.yaml"

CATEGORY_MAP = {
    "blog": "博客",
    "projects": "项目",
    "research": "研究成果",
    "tools": "工具",
    "resume": "简历",
    "about": "关于",
}

URL_MAP = {
    "blog": "/blog",
    "projects": "/projects",
    "research": "/research",
    "tools": "/tools",
    "resume": "/resume",
    "about": "/about",
}


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Parse YAML frontmatter between --- delimiters. Returns (metadata, body)."""
    if not text.startswith("---"):
        return {}, text

    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text

    meta = {}
    for line in parts[1].strip().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # Simple key: value parsing (handles quoted and unquoted values)
        match = re.match(r'^(\w[\w-]*)\s*:\s*(.+)$', line)
        if match:
            key = match.group(1)
            value = match.group(2).strip()
            # Strip quotes
            if (value.startswith('"') and value.endswith('"')) or \
               (value.startswith("'") and value.endswith("'")):
                value = value[1:-1]
            # Handle YAML arrays like ["tag1", "tag2"]
            if value.startswith("[") and value.endswith("]"):
                items = re.findall(r'"([^"]*)"', value)
                if not items:
                    items = re.findall(r"'([^']*)'", value)
                value = ", ".join(items)
            meta[key] = value

    body = parts[2].strip()
    return meta, body


def strip_markdown(text: str) -> str:
    """Remove markdown syntax from text."""
    # Remove images
    text = re.sub(r'!\[([^\]]*)\]\([^)]+\)', r'\1', text)
    # Remove links, keep text
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Remove code blocks
    text = re.sub(r'```[\s\S]*?```', '', text)
    # Remove inline code
    text = re.sub(r'`[^`]+`', '', text)
    # Remove headers markers
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    # Remove bold/italic
    text = re.sub(r'\*{1,3}([^*]+)\*{1,3}', r'\1', text)
    # Remove horizontal rules
    text = re.sub(r'^---+$', '', text, flags=re.MULTILINE)
    # Remove blockquotes
    text = re.sub(r'^>\s+', '', text, flags=re.MULTILINE)
    # Remove badge images (shields.io etc)
    text = re.sub(r'\[!\[.*?\]\(.*?\)\]\(.*?\)', '', text)
    # Collapse whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def get_category(filepath: Path) -> str | None:
    """Determine category from file path relative to content dir."""
    rel = filepath.relative_to(CONTENT_DIR)
    top_dir = rel.parts[0]
    return top_dir if top_dir in CATEGORY_MAP else None


def get_slug(filepath: Path) -> str:
    """Extract slug from filename."""
    return filepath.stem


def build_url(category: str, slug: str, filepath: Path) -> str:
    """Build URL path from category and slug."""
    base = URL_MAP.get(category, f"/{category}")

    # _index files map to the category root
    if slug == "_index":
        return base

    # projects/items/xxx -> /projects/xxx
    if category == "projects":
        return f"{base}/{slug}"

    # blog posts get their own page
    if category == "blog":
        return f"{base}/{slug}"

    # resume versions
    if category == "resume" and slug != "_index":
        return f"{base}/{slug}"

    # tools get their own page
    if category == "tools" and slug != "_index":
        return f"{base}"  # tools page is single

    # about/research are single pages
    return base


def index_website_content(db: sqlite3.Connection) -> int:
    """Index website's own content/ markdown files. Returns count."""
    count = 0
    for md_file in sorted(CONTENT_DIR.rglob("*.md")):
        category = get_category(md_file)
        if category is None:
            continue
        if category in ("home", "global", "contact", "project-source", "resume-source"):
            continue

        raw = md_file.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(raw)
        title = meta.get("title", "")
        description = meta.get("description", meta.get("excerpt", meta.get("brief", "")))
        tags = meta.get("tags", "")
        slug = get_slug(md_file)
        url = build_url(category, slug, md_file)
        category_label = CATEGORY_MAP.get(category, category)
        content = strip_markdown(body)

        if not title and not content:
            continue

        db.execute(
            "INSERT INTO search_index (slug, url, title, description, category, tags, content, site) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (slug, url, title, description, category_label, tags, content, "tianlizeng.cloud"),
        )
        count += 1
    return count


def index_catalog(db: sqlite3.Connection) -> int:
    """Index catalog.yaml — 全部子域 + sub_pages 入口（跨站 metadata）."""
    if not CATALOG_YAML.exists():
        print(f"WARN: {CATALOG_YAML} not found, skip catalog indexing")
        return 0
    data = yaml.safe_load(CATALOG_YAML.read_text(encoding="utf-8"))
    count = 0
    for entry in data.get("entries", []):
        sid = entry.get("id", "")
        name = entry.get("name", "")
        desc = entry.get("description", "")
        url = entry.get("url", "")
        group = entry.get("group", "")
        if not name or not url:
            continue
        # 主条目：子域本身
        db.execute(
            "INSERT INTO search_index (slug, url, title, description, category, tags, content, site) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (sid, url, name, desc, group, "", desc, entry.get("subdomain", "") or "tianlizeng.cloud"),
        )
        count += 1
        # sub_pages：子页（如「关于我」、「作品」等）
        for sub in entry.get("sub_pages", []) or []:
            sub_label = sub.get("label", "")
            sub_path = sub.get("path", "")
            if not sub_label or not sub_path:
                continue
            sub_url = url.rstrip("/") + sub_path if sub_path.startswith("/") else f"{url}/{sub_path}"
            db.execute(
                "INSERT INTO search_index (slug, url, title, description, category, tags, content, site) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (f"{sid}-{sub_label}", sub_url, f"{name} · {sub_label}", desc, group, "", "", entry.get("subdomain", "") or "tianlizeng.cloud"),
            )
            count += 1
    return count


def index_stack_projects(db: sqlite3.Connection) -> int:
    """Index stack/projects.yaml — 项目清单（含 path/purpose/stack/status）."""
    if not STACK_YAML.exists():
        print(f"WARN: {STACK_YAML} not found, skip stack indexing")
        return 0
    data = yaml.safe_load(STACK_YAML.read_text(encoding="utf-8"))
    count = 0
    for grp in data.get("groups", []):
        group_name = grp.get("name", "")
        for proj in grp.get("projects", []):
            name = proj.get("name", "")
            purpose = proj.get("purpose", "")
            stack = ", ".join(proj.get("stack", []) or [])
            status = proj.get("status", "")
            domain = proj.get("domain", "")
            url = f"https://{domain}" if domain else "https://stack.tianlizeng.cloud"
            if not name:
                continue
            db.execute(
                "INSERT INTO search_index (slug, url, title, description, category, tags, content, site) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (f"stack-{name}", url, name, purpose, f"项目·{group_name}", stack, f"{purpose} {stack} {status}", "stack.tianlizeng.cloud"),
            )
            count += 1
    return count


def main():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    db = sqlite3.connect(str(DB_PATH))
    db.execute("DROP TABLE IF EXISTS search_index")
    db.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
            slug, url, title, description, category, tags, content, site,
            tokenize='unicode61'
        )
    """)

    n_website = index_website_content(db)
    n_catalog = index_catalog(db)
    n_stack = index_stack_projects(db)
    total = n_website + n_catalog + n_stack

    db.commit()
    db.close()
    print(f"Indexed {total} documents into {DB_PATH}")
    print(f"  website content : {n_website}")
    print(f"  catalog entries : {n_catalog}")
    print(f"  stack projects  : {n_stack}")


if __name__ == "__main__":
    main()
