#!/bin/bash
# 自动生成 ~/docs/index.md
# 用法: bash ~/docs/update-index.sh

DOCS_DIR="$HOME/docs"
INDEX_FILE="$DOCS_DIR/index.md"

echo "# 文档索引" > "$INDEX_FILE"
echo "" >> "$INDEX_FILE"
echo "**最后更新**：$(date '+%Y-%m-%d %H:%M:%S')" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"

# 架构文档
echo "## 架构文档" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"
if [ -d "$DOCS_DIR/architecture" ]; then
  find "$DOCS_DIR/architecture" -name "*.md" -type f | sort | while read file; do
    filename=$(basename "$file")
    title=$(head -n 1 "$file" | sed 's/^# //' | sed 's/^## //')
    [ -z "$title" ] && title="$filename"
    echo "- [$title](architecture/$filename)" >> "$INDEX_FILE"
  done
fi
echo "" >> "$INDEX_FILE"

# 操作指南
echo "## 操作指南" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"
if [ -d "$DOCS_DIR/guides" ]; then
  find "$DOCS_DIR/guides" -name "*.md" -type f | sort | while read file; do
    filename=$(basename "$file")
    title=$(head -n 1 "$file" | sed 's/^# //' | sed 's/^## //')
    [ -z "$title" ] && title="$filename"
    echo "- [$title](guides/$filename)" >> "$INDEX_FILE"
  done
fi
echo "" >> "$INDEX_FILE"

# 决策记录
echo "## 决策记录" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"
if [ -d "$DOCS_DIR/decisions" ]; then
  find "$DOCS_DIR/decisions" -name "*.md" -type f | sort | while read file; do
    filename=$(basename "$file")
    title=$(head -n 1 "$file" | sed 's/^# //' | sed 's/^## //')
    [ -z "$title" ] && title="$filename"
    echo "- [$title](decisions/$filename)" >> "$INDEX_FILE"
  done
fi
echo "" >> "$INDEX_FILE"

# 讨论文档
echo "## 讨论文档" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"
if [ -d "$DOCS_DIR/discussions" ]; then
  find "$DOCS_DIR/discussions" -name "*.md" -type f | sort -r | while read file; do
    filename=$(basename "$file")
    title=$(head -n 1 "$file" | sed 's/^# //' | sed 's/^## //')
    [ -z "$title" ] && title="$filename"
    echo "- [$title](discussions/$filename)" >> "$INDEX_FILE"
  done
fi
echo "" >> "$INDEX_FILE"

# 项目文档
echo "## 项目文档" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"
if [ -d "$DOCS_DIR/projects" ]; then
  for project in "$DOCS_DIR/projects"/*; do
    if [ -L "$project" ] || [ -d "$project" ]; then
      project_name=$(basename "$project")
      echo "- [$project_name](projects/$project_name/)" >> "$INDEX_FILE"
    fi
  done
fi

# 知识库 — 财富管理
echo "## 财富管理" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"
if [ -d "$DOCS_DIR/knowledge/international-assets" ]; then
  find "$DOCS_DIR/knowledge/international-assets" -name "*.md" -maxdepth 1 -type f | sort | while read file; do
    filename=$(basename "$file")
    title=$(head -n 1 "$file" | sed 's/^# //' | sed 's/^## //')
    [ -z "$title" ] && title="$filename"
    echo "- [$title](knowledge/international-assets/$filename)" >> "$INDEX_FILE"
  done
fi
echo "" >> "$INDEX_FILE"

echo "---" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"
echo "**生成脚本**：\`~/docs/update-index.sh\`" >> "$INDEX_FILE"

echo "✅ 索引已更新：$INDEX_FILE"
