# Raycast vs Hammerspoon · 边界与替代分析 (2026-04-27)

## TL;DR

**保持现状的混合架构是对的，不要继续 HS → Raycast 单向迁移。** 各自有不可替代的核心场景，强行统一会丢失关键能力。

| 维度 | Raycast 强项 | Hammerspoon 强项 |
|---|---|---|
| 触发方式 | UI 搜索（fuzzy）| 全局 hotkey（无 UI，瞬时）|
| 适合 | 偶尔用、要查找、参数化输入 | 高频肌肉记忆、瞬时反馈 |
| 上下文感知 | 弱（脚本自己解）| 强（scope: finder/global/app-specific）|
| OS 集成深度 | 浅（shell 子进程）| 深（直调 Cocoa API）|
| 学习曲线 | 低（写 .sh + 元数据头）| 高（Lua + HS API）|
| 调试 | print + Raycast log 窗口 | hs.console live REPL |

## 2026-04-18 那波迁移做了什么

`~/Dev/tools/hammerspoon/lib/hotkeys.lua:3-10` 记录：

> 移除清单（由 Raycast 接管）：
> - apps.open_ide / apps.launch_apps
> - system.copy_names_and_content / compress / restartApp / display_1080 / display_4k
> - system.brew_maintain / file_print
> - network.*（6 条 ClashX 代理）
> - window.toggle_float / toggle_mouse / organize / toggle_yabai

**共 19 条 hotkey 绑定下线**，对应功能在 Raycast 里以 script-command 形式存在。这波是对的，因为这些都是：
- 偶尔用（不需要肌肉记忆 hotkey）
- 长名字易搜索（Raycast 的 fuzzy 比记 hotkey 强）
- 一次性触发（不需要 OS-level 事件钩子）

## 当前 HS 还留着的（不该再迁）

读 `lib/hotkeys.lua` + `modules/{apps,window,media,keymap}.lua` 总结：

### 留 HS 的 4 类

| 场景 | 例子 | 为什么不迁 Raycast |
|---|---|---|
| **scope: finder 操作** | 终端在此处打开 / Nvim 编辑选中文件 / 复制文件名 / 粘贴到 Finder | 需要读 Finder 当前选中状态。Raycast 也能做（Finder API），但 hotkey 在 Finder 里直接按是肌肉记忆，UI 搜索要切上下文，体验差 |
| **scope: global 媒体** | 播放/暂停 / 上下首 / 音量 | 一键操作，不需要看屏幕。Raycast 必须打开 UI |
| **修饰键重映射** | Right Option → Hyper / Ctrl+HJKL → 方向键 | 系统级 keymap，Raycast 完全做不了 |
| **app-specific hotkey** | WeChat 未运行时按 X 启动 | 需要 `hs.application.watcher` 监听 app 状态变化，Raycast 没这个能力 |

### 实际还在用的 HS 配置

```lua
-- modules/keymap.lua
init_hyper()         -- Right Option = Hyper key
init_vim_nav()       -- Ctrl+HJKL → arrow keys

-- modules/apps.lua
open_terminal()      -- Finder 当前目录开 Ghostty
open_nvim()          -- Finder 选中文件 nvim 打开
open_finder_here()   -- 在当前目录开新 Finder 窗口
create_folder()      -- Finder 内新建文件夹
run_script()         -- 跑选中的 .sh
init_wechat_hotkey() -- WeChat 启动器（仅未运行时生效）

-- modules/window.lua
yabai 操作（toggle_float/mouse/organize/yabai/restart）

-- modules/media.lua
媒体控制 + 音量

-- modules/system.lua
copy_filenames / paste_to_finder / 等
```

## 当前 Raycast 53 commands 分布

源 repo 三块：
- **devtools** (11)：CCLog stats / Hydraulic Streamlit 启动 / Git smart push / TTS / Sessions export
- **tools/doctools** (28)：DOCX/PPTX/XLSX/MD/CSV 各种格式转换
- **tools/mactools** (14)：File ops / Display 切换 / Homebrew 维护 / 提醒事项 / app launcher

完整清单见 `~/Dev/tools/raycast/COMMANDS.md`。

## 替代潜力评估

### Raycast → HS 替代？❌ 不建议

要点：HS 没有 fuzzy search UI。把 Raycast 的 53 个命令塞进 HS 意味着要为每个命令分配 hotkey（人脑记不住 53 个 hotkey）或在 HS chooser/menubar 里做菜单（UI 体验远差于 Raycast）。

唯一例外：高频 Raycast 命令可以**额外**绑 HS hotkey 加速（不是替代）。

### HS → Raycast 替代？❌ 当前留下的不该再迁

HS 留下的 4 类在 Raycast 里都做不好：
- Finder scope hotkey：Raycast 触发要先打开 UI（cmd+space）→ 搜命令 → Enter，比 HS 一键直按多 2-3 次操作
- 全局媒体 hotkey：根本不能在 Raycast 里做（UI 必须开屏）
- 修饰键重映射：Raycast 做不了
- app watcher 类：Raycast 没事件订阅模型

### 两者结合 ✅ 推荐

**判别表**：

| 场景特征 | 选 Raycast | 选 HS |
|---|---|---|
| 触发频次 < 1/天 | ✓ | |
| 触发频次 > 5/天 | | ✓ |
| 有参数（路径/文本/选项）| ✓ | |
| 需要看输出 | ✓ | |
| 需要 OS 事件钩子 | | ✓ |
| 需要 Finder/app 上下文 | | ✓ |
| 复杂逻辑（>50 行）| ✓（写 .py）| ✓（写 .lua）|
| 仅是 shell 一行 | ✓ | ✓ |
| 跨 macOS 版本兼容性 | Raycast 自维护 | HS API 偶有 break |

## 一些可优化的地方

### 1. HS 留的 yabai hotkey vs Raycast 的 yabai.py 重复

`modules/window.lua` 有 `toggle_float / toggle_mouse / organize / toggle_yabai / restart_yabai`，
而 Raycast `yabai.py` 也实现了同样 5 个子命令。重复但不矛盾 —— HS hotkey 是肌肉记忆触发，Raycast 是搜索触发。**保留双绑**。

### 2. HS WeChat 启动器单独留着

`apps.init_wechat_hotkey()` 用 `hs.application.watcher` 实现"WeChat 未运行时按 X 启动，已运行时让按键透传"。**这是 Raycast 完全做不了的**，必须留 HS。

### 3. 中文 description 可以渐进英文化

54 commands 的 title 这次全英文化了，但 description 仍有约 10 个中文。Raycast 搜索按 title fuzzy，description 只是显示用，不影响搜索。**不优先**，但下次迁批量改时顺带。

### 4. clashx/raycast/commands 是空目录

`~/Dev/tools/clashx/raycast/commands/` 是空的（之前 6 条 ClashX 代理被迁去 Raycast 但好像没真迁过去？）。要么删空目录，要么把 ClashX 切换的 .sh 真的写进去。建议查一下 2026-04-18 那次迁移的实际去向。

## 决策建议

**继续保持现有边界。HS 留 4 类不可替代场景，Raycast 装 53+ 偶发/参数化/搜索式命令。**

下次想加新自动化时按这棵树判：

```
新功能要加？
├─ 需要 OS 事件钩子（app launch/sleep/USB）→ HS
├─ 需要修饰键重映射 → HS
├─ 高频肌肉记忆 hotkey（>5/天）→ HS
├─ 上下文感知（Finder 选中/当前 app）→ HS
└─ 其他都进 Raycast（写 .sh/.py + sync.py）
```

## 参考

- HS 配置：`~/Dev/tools/hammerspoon/`（symlink 到 `~/.hammerspoon`）
- HS 功能汇总：`~/Dev/tools/hammerspoon/Hammerspoon-功能汇总.md`
- Raycast hub：`~/Dev/tools/raycast/`
- Raycast 命令清单：`~/Dev/tools/raycast/COMMANDS.md`
- 加 Raycast 命令的 SOP：`/raycast-sync`（slash command）
