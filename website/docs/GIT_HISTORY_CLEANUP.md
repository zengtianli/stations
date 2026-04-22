# Git 历史清理指南

> 关于从 Git 历史中永久删除隐私文件的说明

---

## ⚠️ 重要说明

从 Git 历史中删除文件是一个 **破坏性操作**，需要谨慎考虑。

### 当前状态

✅ **已完成的保护措施**：
- 隐私文件已添加到 `.gitignore`
- 未来不会再被提交到 Git
- 隐私文件已备份到 `/Users/tianli/portfolio-private-backup/`
- 项目根目录已清理，只保留必要文件

### 是否需要清理历史？

**不需要清理历史的情况**（推荐）：
- ✅ 仓库是私有的
- ✅ 隐私文件已在 `.gitignore` 中
- ✅ 没有实际的数据泄露风险
- ✅ 只有自己一个人维护项目

**需要清理历史的情况**：
- ❌ 仓库曾经是公开的
- ❌ 包含真实的敏感数据（密钥、密码等）
- ❌ 有多人协作，需要彻底清除敏感信息
- ❌ 需要减小仓库大小

---

## 🛡️ 风险提示

如果执行 Git 历史清理，会发生：

1. **所有 commit hash 改变** - 整个 Git 历史被重写
2. **需要强制推送** - 使用 `git push --force`
3. **协作者需要重新克隆** - 其他人的本地仓库会出现问题
4. **无法回退** - 操作不可逆
5. **可能破坏引用** - Pull Request、Issues 中的 commit 引用会失效

---

## 📋 清理前检查清单

在执行历史清理前，确认：

- [ ] 已完整备份整个项目
- [ ] 确认仓库没有其他协作者，或已通知所有协作者
- [ ] 确认所有重要的 Pull Request 已合并
- [ ] 确认所有工作已提交并推送
- [ ] 理解操作的破坏性和不可逆性
- [ ] 有应急恢复计划

---

## 🔧 清理方法

### 方法一：使用 git-filter-repo（推荐）

`git-filter-repo` 是 Git 官方推荐的历史重写工具。

#### 1. 安装工具

```bash
# macOS
brew install git-filter-repo

# Linux
pip3 install git-filter-repo

# 或手动安装
# https://github.com/newren/git-filter-repo
```

#### 2. 创建要删除的路径列表

创建文件 `paths-to-delete.txt`：

```
荣誉/
content/resume-materials/untitled folder/
博士研究生成绩单.md
本科成绩单.md
待补充信息清单.md
ry.pdf
```

#### 3. 执行清理

```bash
# ⚠️ 警告：这是破坏性操作！确保已备份！

# 克隆一个新副本（推荐在新副本上操作）
cd ~/Downloads
git clone /Users/tianli/Downloads/portfolio portfolio-clean
cd portfolio-clean

# 删除远程引用（git-filter-repo 要求）
git remote remove origin

# 执行清理
git filter-repo --invert-paths --paths-from-file paths-to-delete.txt

# 检查结果
git log --all --oneline

# 重新添加远程仓库
git remote add origin https://github.com/zengtianli/web.git

# 强制推送（⚠️ 破坏性操作）
git push --force --all
git push --force --tags
```

---

### 方法二：使用 BFG Repo-Cleaner

BFG 是另一个流行的工具，速度更快但功能较少。

#### 1. 安装 BFG

```bash
brew install bfg
```

#### 2. 执行清理

```bash
# 克隆裸仓库
git clone --mirror https://github.com/zengtianli/web.git portfolio-mirror.git

# 删除文件夹
bfg --delete-folders "荣誉" portfolio-mirror.git
bfg --delete-folders "untitled folder" portfolio-mirror.git

# 删除特定文件
bfg --delete-files "博士研究生成绩单.md" portfolio-mirror.git
bfg --delete-files "本科成绩单.md" portfolio-mirror.git
bfg --delete-files "ry.pdf" portfolio-mirror.git

# 清理和压缩
cd portfolio-mirror.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 强制推送
git push --force
```

---

## 🔄 清理后的操作

### 1. 更新本地仓库

```bash
# 删除旧仓库
cd ~/Downloads
rm -rf portfolio

# 重新克隆
git clone https://github.com/zengtianli/web.git portfolio
```

### 2. 验证清理结果

```bash
# 检查文件是否已从历史中删除
git log --all --full-history -- "荣誉/"
# 应该没有任何输出

# 检查仓库大小
du -sh .git
```

### 3. 通知协作者（如有）

如果有其他协作者，通知他们：

```
Git 历史已被重写，请删除本地仓库并重新克隆：

rm -rf portfolio
git clone https://github.com/zengtianli/web.git portfolio
```

---

## 💡 替代方案

如果不想清理历史，可以采取以下措施：

### 1. 确保仓库私有

在 GitHub 设置中确认仓库是私有的：
- 访问仓库设置页面
- 检查 "Danger Zone" → "Change repository visibility"
- 确保是 "Private"

### 2. 定期审查 .gitignore

确保 `.gitignore` 包含所有隐私文件：

```gitignore
# 隐私数据保护
荣誉/
content/resume-materials/untitled folder/
博士研究生成绩单.md
本科成绩单.md
待补充信息清单.md
*.pdf
!public/**/*.pdf
```

### 3. 使用 Git Hooks

创建 pre-commit hook 防止意外提交：

```bash
# .git/hooks/pre-commit
#!/bin/sh

# 检查是否包含隐私文件
if git diff --cached --name-only | grep -E "荣誉/|博士研究生成绩单"; then
    echo "❌ 错误：尝试提交隐私文件！"
    exit 1
fi
```

---

## 🎯 推荐做法

**对于个人项目（当前情况）**：

✅ **不清理 Git 历史**，原因：
1. 仓库是私有的
2. 没有协作者
3. 隐私文件已在 `.gitignore` 中
4. 操作风险大于收益

✅ **做好现有保护**：
1. 确保仓库私有
2. 定期检查 `.gitignore`
3. 本地保留备份
4. 不要公开分享仓库

---

## 📞 获取帮助

如果确实需要清理 Git 历史，建议：

1. **先在测试仓库上练习** - 确保理解整个流程
2. **完整备份** - 多处备份整个项目
3. **寻求专业帮助** - 如果不确定，咨询有经验的人

---

**文档版本**: v1.0  
**最后更新**: 2025-10-11  
**维护者**: Claude AI Assistant

**⚠️ 重要提醒**：如果不是非常必要，不建议清理 Git 历史。当前的保护措施已经足够。

