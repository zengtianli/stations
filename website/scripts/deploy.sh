#!/bin/bash
# 部署脚本：将 symlink 临时替换为实际文件，提交推送后恢复
# 用法: bash scripts/deploy.sh "commit message"

set -e

cd "$(git rev-parse --show-toplevel)"

COMMIT_MSG="${1:-deploy: 更新内容}"

# 扫描工作目录中的 symlink（排除 node_modules/.next/.cursor/.git）
SYMLINKS=()
TARGETS=()

while IFS= read -r file; do
  target=$(readlink "$file")
  if [ -e "$target" ]; then
    SYMLINKS+=("$file")
    TARGETS+=("$target")
  else
    echo "⚠️  跳过: $file -> $target (目标不存在)"
  fi
done < <(find . -maxdepth 3 -type l \
  -not -path './node_modules/*' \
  -not -path './.next/*' \
  -not -path './.cursor/*' \
  -not -path './.git/*' \
  2>/dev/null | sed 's|^\./||')

if [ ${#SYMLINKS[@]} -gt 0 ]; then
  echo "📋 发现 ${#SYMLINKS[@]} 个 symlink 需要处理:"
  for i in "${!SYMLINKS[@]}"; do
    echo "   ${SYMLINKS[$i]} -> ${TARGETS[$i]}"
  done

  # 步骤 1: 替换 symlink 为实际文件
  echo ""
  echo "🔄 替换 symlink 为实际文件..."
  for i in "${!SYMLINKS[@]}"; do
    link="${SYMLINKS[$i]}"
    target="${TARGETS[$i]}"
    rm "$link"
    if [ -d "$target" ]; then
      cp -r "$target" "$link"
    else
      cp "$target" "$link"
    fi
    echo "   ✅ $link"
  done
else
  echo "没有 symlink 需要处理"
fi

# 步骤 2: 提交并推送
echo ""
echo "📦 提交并推送..."
git add -A
git commit -m "$COMMIT_MSG" || echo "没有新的改动需要提交"
git push origin main

# 步骤 3: 恢复 symlink
if [ ${#SYMLINKS[@]} -gt 0 ]; then
  echo ""
  echo "🔗 恢复 symlink..."
  for i in "${!SYMLINKS[@]}"; do
    link="${SYMLINKS[$i]}"
    target="${TARGETS[$i]}"
    rm -rf "$link"
    ln -s "$target" "$link"
    echo "   ✅ $link -> $target"
  done
fi

echo ""
echo "🎉 部署完成！本地 symlink 已恢复。"
