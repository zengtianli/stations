---
title: "44 个脚本的 Raycast 集成之路"
date: "2026-04-09"
author: "曾田力"
excerpt: "把命令行工具一键封装为 GUI 操作——58 个 Raycast wrappers 的设计思路、踩坑记录和效率提升数据。"
tags: ["开发工具", "CLI", "Raycast", "自动化"]
published: true
---

## 为什么要做 Raycast 集成

我有 44 个 CLI 脚本分布在 4 个仓库（doctools/devtools/mactools/clashx），涵盖文档处理、开发效率、系统管理、网络代理。它们很好用，但有个问题：**记不住命令**。

`python3 ~/Dev/tools/doctools/scripts/document/md2word.py --template standard --input foo.md`——谁能记住这个？

Raycast 解决了这个问题：⌘+Space → 输入关键词 → 回车执行。

## Wrapper 架构

每个 Raycast wrapper 是一个 shell 脚本，放在 `raycast/commands/` 目录下：

```bash
#!/bin/bash
# @raycast.title MD → Word
# @raycast.description 将 Markdown 转换为 Word 文档
# @raycast.icon 📄
# @raycast.mode compact

python3 ~/Dev/tools/doctools/scripts/document/md2word.py "$@"
```

关键设计：
- **元数据驱动**：标题、描述、图标都在注释里，Raycast 自动解析
- **模式选择**：`compact`（静默执行）vs `fullOutput`（显示输出）vs `inline`（显示在搜索栏）
- **参数传递**：通过 `@raycast.argument` 声明输入参数

## 4 个仓库的 Wrapper 分布

| 仓库 | 脚本数 | Wrappers | 典型功能 |
|------|--------|----------|---------|
| doctools | 17 | 27 | MD→Word、PDF 合并、Excel 处理 |
| devtools | 10 | 12 | repo 管理、CF API、健康检查 |
| mactools | 11 | 13 | 文件整理、窗口管理、系统设置 |
| clashx | 6 | 6 | 代理切换、节点测速 |

为什么 wrappers 比脚本多？因为有些脚本有多种调用模式，拆成多个 wrapper 更直观。比如 `cf_api.py` 拆成"DNS 列表""DNS 添加""Access 列表"三个。

## 踩过的坑

### 1. PATH 问题
Raycast 的 shell 环境不加载 `.zshrc`，所以 `python3`、`pnpm` 等命令找不到。解决方案：wrapper 开头手动 source：

```bash
source ~/.zshrc 2>/dev/null
```

### 2. 工作目录
Raycast 默认在 `/` 执行，脚本里的相对路径全部失效。解决方案：每个 wrapper 先 cd 到正确目录。

### 3. 交互式输入
Raycast 不支持 stdin 交互。需要输入的脚本必须改成参数传递或环境变量。

### 4. 通知反馈
用户看不到终端输出，脚本执行成功/失败没反馈。解决方案：加 `osascript` 弹通知：

```bash
osascript -e 'display notification "转换完成" with title "doctools"'
```

## 效率提升

量化了使用前后的差异（取 10 个高频操作的平均值）：

- **操作时间**：从 12 秒（打开终端→输入命令→回车）降到 3 秒（⌘+Space→关键词→回车）
- **记忆负担**：从"需要记住命令路径和参数"变为"只需记住功能关键词"
- **错误率**：参数拼错导致的重试从 15% 降到接近 0

## 下一步

- 把常用的 Claude Code skills 也做成 Raycast wrapper
- 增加参数表单（Raycast Script Commands 支持多参数输入框）
- 考虑迁移到 Raycast Extensions（TypeScript，更丰富的 UI）
