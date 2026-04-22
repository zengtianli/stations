# Claude Code Agent Team 分屏指南（tmux 方案）

## 背景

Claude Code 的 agent team 多面板分屏只支持 **tmux** 和 **iTerm2** 两个后端。Ghostty 尚未支持（[#24189](https://github.com/anthropics/claude-code/issues/24189)）。

在 Ghostty 中使用分屏的解决方案：**在 tmux 会话内启动 Claude Code**。

## 快速开始（3 步）

### 1. 确认 tmux 已安装

```bash
tmux -V
# 输出：tmux 3.6a（已安装）
```

### 2. 配置 settings.json

在 `~/.claude/settings.json` 中添加：

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "teammateMode": "tmux"
}
```

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | `"1"` | 启用实验性 agent teams |
| `teammateMode` | `"tmux"` | 强制使用 tmux 分屏 |
| `teammateMode` | `"auto"` | 自动检测（tmux 内用 tmux，iTerm2 内用 iTerm2） |
| `teammateMode` | `"in-process"` | 不分屏，全部在主面板内（Shift+↓ 切换） |

### 3. 在 tmux 中启动 Claude Code

```bash
# 新建 tmux 会话
tmux new-session -s cc

# 在 tmux 内启动 claude
claude
```

启动 agent team 后，每个 teammate 会自动在新的 tmux pane 中打开，形成分屏视图。

## 推荐 tmux 配置

在 `~/.tmux.conf` 中添加：

```bash
# 关键：pane 索引必须从 0 开始（Claude Code 假设 0-based）
set -g base-index 0
set -g pane-base-index 0

# 基础优化
set -g default-terminal "tmux-256color"
set -g history-limit 50000
set -g mouse on
```

> **踩坑警告**：如果 `pane-base-index` 设为 1，teammate 指令会发到错误的 pane，导致 agent 卡住（[#23527](https://github.com/anthropics/claude-code/issues/23527)）。

## 日常使用流程

```bash
# 启动
tmux new-session -s cc    # 或 tmux attach -t cc（恢复已有会话）
claude

# 在 Claude Code 中创建 team
> 帮我创建一个 agent team 做 XXX

# 结束后
# Ctrl+B, D — detach tmux（保留会话）
# tmux kill-session -t cc — 彻底关闭
```

## tmux 常用快捷键

所有操作前先按 `Ctrl+B`（tmux 前缀键）：

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+B, D` | Detach（退出但保留会话） |
| `Ctrl+B, ↑/↓/←/→` | 在 pane 之间切换 |
| `Ctrl+B, Z` | 当前 pane 全屏/还原 |
| `Ctrl+B, [` | 进入滚动模式（q 退出） |
| `Ctrl+B, X` | 关闭当前 pane |

## 已知问题

| 问题 | 影响 | 规避 |
|------|------|------|
| 同时 spawn 4+ agent 时部分失败 ([#23615](https://github.com/anthropics/claude-code/issues/23615)) | 命令被截断 | 控制在 2-3 个 agent |
| SSH+tmux 下中文渲染问题 ([#37396](https://github.com/anthropics/claude-code/issues/37396)) | CJK 文本显示异常 | 本地使用不受影响 |
| agent 清理时可能误杀 tmux session ([#29787](https://github.com/anthropics/claude-code/issues/29787)) | 数据丢失风险 | 重要工作及时保存 |

## 替代方案

如果不想用 tmux，也可以直接切到 **iTerm2** 启动 Claude Code，`teammateMode: "auto"` 会自动使用 iTerm2 原生分屏。
