#!/opt/homebrew/bin/python3
"""Build FTS5 search index from content/ markdown files."""

import os
import re
import sqlite3
from pathlib import Path

CONTENT_DIR = Path(__file__).resolve().parent.parent / "content"
DB_PATH = Path(__file__).resolve().parent.parent / "data" / "search.db"

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


def main():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    db = sqlite3.connect(str(DB_PATH))
    db.execute("DROP TABLE IF EXISTS search_index")
    db.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
            slug, url, title, description, category, tags, content,
            tokenize='unicode61'
        )
    """)

    count = 0
    for md_file in sorted(CONTENT_DIR.rglob("*.md")):
        # Skip non-content directories
        category = get_category(md_file)
        if category is None:
            continue

        # Skip home and global content
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

        # Skip if no meaningful content
        if not title and not content:
            continue

        db.execute(
            "INSERT INTO search_index (slug, url, title, description, category, tags, content) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (slug, url, title, description, category_label, tags, content),
        )
        count += 1

    db.commit()
    db.close()
    print(f"Indexed {count} documents into {DB_PATH}")


if __name__ == "__main__":
    main()
