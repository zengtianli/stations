# Raycast + Hammerspoon · 全功能盘点与使用频率 (2026-04-27)

## TL;DR

- **HS 共 18 hotkey 绑定 + 6 个 orphan Lua 函数**（hotkeys.lua 已下线但 Lua 代码留着，可清）
- **Raycast 53 命令**（hub `~/Dev/tools/raycast/commands/`，3 repo 来源）
- **使用统计基本不存在**：现有 `~/.useful_scripts_usage.log` 只有 1/53 Raycast 命令真在打点；HS 0 埋点
- **历史遗失**：clashx 6 命令在老 log 用了 100+ 次（最高频），现 `~/Dev/_archive/clashx-2026-04-27/raycast/commands/` 空目录 — 需要查
- **行动**：先加埋点 → 用 2-4 周 → 再决定 archive 哪些。本次只能基于"orphan/重复"做硬归档候选

---

## 1. Hammerspoon · 18 个活跃 hotkey 绑定

来源 `~/Dev/tools/hammerspoon/lib/hotkeys.lua`。Hyper = Right Option（modules/keymap.lua 重映射成 Cmd+Ctrl+Shift）。

### 1.1 Finder scope（4 + 2 + 2 = 8）

| Hotkey | 功能 | 模块函数 | 备注 |
|---|---|---|---|
| ⌘⌃⇧ T | 终端在此处打开（Ghostty）| apps.open_terminal | 高频肌肉记忆 |
| ⌘⌃⇧ I | Nvim 编辑选中文件 | apps.open_nvim | |
| ⌘⇧ N | 创建新文件夹 | apps.create_folder | |
| ⌘⌥ N | 在当前目录开新 Finder 窗 | apps.open_finder_here | |
| ⌘⌃⇧ S | 运行选中脚本 | apps.run_script | |
| ⌘⌃⇧ R | 并行运行选中脚本 | apps.run_scripts_parallel | |
| ⌘⌃⇧ N | 复制文件名 | system.copy_filenames | 与 ⌘⇧ N 冲突？需查 scope 优先级 |
| ⌃⌥ V | 粘贴到 Finder | system.paste_to_finder | 与 Raycast 的 folder_paste.sh 重复（功能等价）|

### 1.2 全局媒体（4）

| Hotkey | 功能 | 模块函数 |
|---|---|---|
| ⌘⌃⇧ ; | 播放/暂停 | media.togglePlayback |
| ⌘⌃⇧ ' | 下一首 | media.nextTrack |
| ⌘⌃⇧ L | 上一首 | media.previousTrack |
| ⌘⌃⇧ P | 系统媒体 play/pause | media.systemPlayPause |

### 1.3 系统/窗口/帮助（3）

| Hotkey | 功能 | 模块函数 |
|---|---|---|
| ⌘⌥ , | 打开系统设置 | system.openSettings |
| ⌘⌃⇧ Y | 重启 Yabai | window.restart_yabai |
| ⌘⌃⇧ H | 显示快捷键帮助 | _hotkey_manager.show_help |

### 1.4 Karabiner-style 重映射（3，全局，无 HUD）

| Hotkey | 行为 | 模块函数 |
|---|---|---|
| ⌘ H | 删除字符 (= Delete) | keymap.delete_char |
| ⌘⌥ H | 删除单词 | keymap.delete_word |
| ⌘⌃ H | 删除到行首 | keymap.delete_to_line_start |

### 1.5 特殊：app watcher（不在 hotkeys.lua）

| Hotkey | 行为 | 模块函数 |
|---|---|---|
| ⌃⌥ W | 启动 WeChat（仅未运行时拦截，已运行透传给 WeChat）| apps.init_wechat_hotkey |

### 1.6 全程拦截（无单一 hotkey）

| 触发 | 行为 | 模块函数 |
|---|---|---|
| Right Option 按住 + 任意键 | 修饰键替换为 Hyper (⇧⌘⌃) | keymap.init_hyper |
| Ctrl+H/J/K/L | → ←/↓/↑/→（终端除外）| keymap.init_vim_nav |

---

## 2. Hammerspoon · 6 个 orphan Lua 函数（无 hotkey 绑定）

`hotkeys.lua:3-10` 注释明写"2026-04-18 移除 19 条迁去 Raycast 的绑定"。Lua 函数本体仍在 `modules/system.lua`：

| 函数 | 状态 | Raycast 替代 |
|---|---|---|
| system.brew_maintain | 🗑️ orphan | mactools/brew_maintain.py |
| system.file_print | 🗑️ orphan | mactools/file_print.py |
| system.display_1080 | 🗑️ orphan | mactools/display_1080.sh |
| system.display_4k | 🗑️ orphan | mactools/display_4k.sh |
| system.compress | 🗑️ orphan | （无 Raycast 替代，可能直接没了？）|
| system.restartApp | 🗑️ orphan | （无 Raycast 替代）|
| system.copy_names_and_content | 🗑️ orphan | （无 Raycast 替代）|

**还有**（modules/window.lua 4 个 yabai 相关）：

| 函数 | 状态 | Raycast 替代 |
|---|---|---|
| window.toggle_float | 🗑️ orphan | mactools/yabai.py float |
| window.toggle_mouse | 🗑️ orphan | mactools/yabai.py mouse |
| window.organize | 🗑️ orphan | mactools/yabai.py org |
| window.toggle_yabai | 🗑️ orphan | mactools/yabai.py toggle |
| window.restart_yabai | ✓ 仍绑 ⌘⌃⇧ Y | — |

apps.lua 还有：

| 函数 | 状态 |
|---|---|
| apps.launch_apps | 🗑️ orphan（mactools/sys_app_launcher.py 替代）|
| apps.open_ide | 🗑️ orphan？需查（注释说迁了，但用户可能仍用）|

**判断**：这些 orphan Lua 是死代码，建议归档 — 但因为你说"想多迁回 HS"，反而是**重新启用候选**。决策见 §6。

---

## 3. Raycast · 53 命令（按 packageName 分组）

完整版见 `~/Dev/tools/raycast/COMMANDS.md`。这里只列摘要，使用频率全部"待埋点"（除标★的）。

| Package | 数量 | 命令名（简）|
|---|---|---|
| Apps | 2 | app-open · Launch Gov DingTalk |
| CCLog | 3 | cclog-digest · cclog-site · cclog-stats |
| Custom | 1 | folder_paste ★ |
| Display | 2 | display_1080 · display_4k |
| Document | 1 | View MD as HTML |
| DOCX | 3 | docx-apply-template · docx-to-md · md-to-docx-template |
| Document Processing | 4 | doc-scan-sensitive · docx-image-caption · docx-text-format · md2word-pipeline |
| File Utils | 5 | Cleanup Downloads · Copy Finder Selection · Print Finder Selection · Organize Downloads · Smart Rename Downloads |
| Git | 1 | Smart Push All Repos |
| Hydraulic | 5 | Pollution Capacity Calc · Geocoding Tool · Reservoir Dispatch · Hydraulic Toolkit · Water Efficiency Analysis |
| OA 系统 | 1 | Open OA |
| Scripts | 14 | csv/md/pptx/xlsx/各种格式转换 |
| Secretary | 1 | CC Sessions Export |
| System | 3 | Maintain Homebrew · Create Reminder · Launch Essential Apps |
| TTS | 1 | tts-volcano |
| Window | 1 | Yabai Window Ops（**与 HS window.* 重复**）|

★ = 当前已埋点（仅 1 个）

---

## 4. 跨边界问题

### 4.1 重复（HS + Raycast 都有）

- **Yabai 操作**：HS 有 toggle_float/mouse/organize/yabai/restart_yabai 函数（仅 restart 仍绑 hotkey），Raycast 有 yabai.py（4 子命令）。**重复维护**。
- **Finder 粘贴**：HS keymap.paste_to_finder（⌃⌥ V）vs Raycast folder_paste.sh。功能近似。

### 4.2 历史遗失：ClashX

老 log 显示 ClashX 类命令是**最高频使用**（前 6 名：`clashx_enhanced.sh` 92 次，`sys_clashx.sh` 21 次，`clashx_mode_rule.sh` 7 次，`folder_paste.sh` 5 次，`clashx_status.sh` 5 次，`clashx_mode_global.sh` 5 次）。

**当前**：`~/Dev/_archive/clashx-2026-04-27/raycast/commands/` 是**空目录**。这些命令在 2026-04-18 那波"19 条迁 Raycast"里被列入，但实际去向不明。

**待查**：
- 这些 .sh 文件是被移到别处（应去 `~/Dev/_archive/clashx-2026-04-27/scripts/` 之类？）
- 还是真的删了？
- HS 里也没看到对应函数

### 4.3 mactools 8 个 .py 命令全无 hotkey

新加的 8 个 Python 命令（brew_maintain, downloads_organizer, file_copy, file_print, smart_rename, sys_app_launcher, yabai, create_reminder）只能从 Raycast UI 触发。`/raycast-sync` 文档里建议给高频的加 HS hotkey。

---

## 5. 使用统计现状

### 5.1 已有基础设施

`~/.useful_scripts_usage.log` (CSV: timestamp, script_name, category)，由 `~/Dev/tools/mactools/lib/common.sh` 的 `log_script_usage()` 写入。

### 5.2 实际埋点覆盖（残酷的事实）

- **Raycast**：53 命令中**仅 1 个**（`folder_paste.sh`）source 了 common.sh 并调 `log_script_usage`
- **Hammerspoon**：0 埋点
- **结论**：现有 log 391 条 = ClashX 老命令 + 几个手动改过的脚本 + folder_paste，**对当前 53+18 实际状态参考价值低**

### 5.3 老 log 的可挖掘信息（带名称迁移）

| 老命令名 | 老 log 次数 | 当前对应 |
|---|---|---|
| clashx_enhanced.sh | 92 | ❌ 当前不存在（ClashX 遗失） |
| docx/to_md | 41 | ✓ doctools/docx_to_md.sh |
| sys_clashx.sh | 21 | ❌ 同上 |
| markdown/to_docx | 13 | ✓ doctools/md_docx_template.sh 或 md2word_pipeline.sh（哪个？模糊）|
| clashx_mode_rule.sh | 7 | ❌ |
| folder_paste.sh | 5 | ✓ 当前同名（埋点延续）|
| clashx_status.sh | 5 | ❌ |
| clashx_mode_global.sh | 5 | ❌ |
| clashx_proxy.sh | 4 | ❌ |
| yabai_org | 2 | ✓ mactools/yabai.py org（或 HS window.organize 已下线）|
| ray_text_formatter_docx.sh | 4 | ✓ doctools/docx_text_formatter.sh |

### 5.4 Raycast 自己的 sqlite

`~/Library/Application Support/com.raycast.macos/raycast-activities-enc.sqlite`（412 MB）有 Raycast 内部记录的命令调用，但**加密**。没法直接 SELECT，且解密不在本次范围。

---

## 6. 加埋点的方案（建议先做这步再谈 archive）

### 6.1 Raycast 侧（52 个 .sh/.py 待补）

**.sh 模板**（在脚本顶部 metadata 后、业务逻辑前加 2 行）：
```bash
source "$(dirname "$(realpath "$0")")/../../lib/common.sh" 2>/dev/null
log_script_usage "$(basename "$0")" "<package>"
```

**.py 模板**（开头加）：
```python
import os, time
with open(os.path.expanduser("~/.useful_scripts_usage.log"), "a") as f:
    f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')},{os.path.basename(__file__)},<package>\n")
```

但 Raycast 命令分散在 3 个 repo（devtools/doctools/mactools），common.sh 路径不一致。建议**抽出独立工具**：

```
~/Dev/devtools/lib/log_usage.sh   # bash 版（被各 .sh source）
~/Dev/devtools/lib/log_usage.py   # python 版（被各 .py import）
```

每个 Raycast .sh / .py 在头部 source / import 即可。批量改用 sed 一遍能搞定。

### 6.2 Hammerspoon 侧（一处搞定）

`lib/hotkey_manager.lua` 是统一注册中心 —— 在 `register()` 函数里给所有 hotkey wrapper 包一层日志即可：

```lua
-- 伪代码
local function logged_call(module, func)
    return function()
        local f = io.open(os.getenv("HOME") .. "/.useful_scripts_usage.log", "a")
        if f then
            f:write(os.date("%Y-%m-%d %H:%M:%S") .. ",hs:" .. module .. "." .. func .. ",hammerspoon\n")
            f:close()
        end
        return require("modules." .. module)[func]()
    end
end
```

一处改动 = 18 个 hotkey 全埋点。WeChat watcher / vim_nav 这类拦截器另外手工加 io.open 一行。

### 6.3 数据收集周期

加埋点后 **2-4 周** 才能积累有意义的数据。在那之前任何 archive 决策都是猜测。

---

## 7. 本次能做的"硬归档"判断（不需要数据）

### 7.1 应该归档（orphan Lua，且 Raycast 已替代）

| Lua 函数 | 操作 | 理由 |
|---|---|---|
| system.brew_maintain | 删 | mactools 已替代 |
| system.file_print | 删 | mactools 已替代 |
| system.display_1080 / display_4k | 删 | mactools 已替代 |
| window.toggle_float / toggle_mouse / organize / toggle_yabai | 删 | mactools/yabai.py 已替代 |
| apps.launch_apps | 删 | mactools/sys_app_launcher.py 已替代 |

**但**：因为你说"想多迁回 HS"，这些 orphan 反而是 **首选重新启用对象**（Lua 代码现成，加 hotkey 行就能用）。

### 7.2 待查不能动

| 项 | 待查 |
|---|---|
| ClashX 6 命令遗失 | 找原始 .sh 文件去向 — git log clashx repo？ |
| system.compress / restartApp / copy_names_and_content | Raycast 里没对应，是真的废弃了还是漏迁？ |
| HS apps.open_ide | 注释说迁了，但实际工作流可能还在用？|

### 7.3 重复需收口

| 重复项 | 建议 |
|---|---|
| HS window.restart_yabai (⌘⌃⇧ Y) + Raycast yabai.py toggle | 选一个 — HS hotkey 体验更好，Raycast 这条可考虑删 |
| HS keymap.paste_to_finder + Raycast folder_paste.sh | 同上，HS hotkey 优 |

---

## 8. 推荐下一步（按优先级）

1. **查 ClashX 遗失** — `cd ~/Dev/_archive/clashx-2026-04-27 && git log --diff-filter=D --name-only | head -20` 看删了什么
2. **加埋点**（按 §6）— 抽 `log_usage.sh` + 改 hotkey_manager.lua
3. **2-4 周后** 跑 awk 出统计，根据真实数据决定 archive
4. 期间根据你"多迁 HS"意愿，每周抓 3-5 个 Raycast 高频命令补 HS hotkey
5. 季度归档：低频 + Raycast 已替代 → 删 Lua / 删 .sh

---

## 附录 A · 老 log 时间分布

```
首条: 2025-11-24 11:29
末条: 2026-04-23 17:24
跨度: ~5 个月
总条目: 391
独立命令名: 52 个
```

按月密度（粗）：~78 次/月，对 18 + 53 个功能而言极稀疏 —— 印证"埋点覆盖差"。

## 附录 B · 文件位置速查

```
HS 配置:        ~/Dev/tools/hammerspoon/  (symlink → ~/.hammerspoon)
HS 入口:        init.lua
HS 绑定声明:    lib/hotkeys.lua          ← 18 条
HS 注册器:      lib/hotkey_manager.lua   ← 加埋点处
HS 模块:        modules/{apps,keymap,media,system,window}.lua

Raycast hub:    ~/Dev/tools/raycast/commands/  ← 53 symlinks
Raycast 同步:   ~/Dev/tools/raycast/sync.py    （/raycast-sync 命令）
Raycast 文档:   ~/Dev/tools/raycast/COMMANDS.md（AUTO-GENERATED）

Raycast 源:     ~/Dev/devtools/raycast/commands/        (12)
                ~/Dev/tools/doctools/raycast/commands/  (28)
                ~/Dev/tools/mactools/raycast/commands/  (14)

使用日志:       ~/.useful_scripts_usage.log（CSV）
共享库:         ~/Dev/tools/mactools/lib/common.sh（log_script_usage 函数）

Raycast 内部:   ~/Library/Application Support/com.raycast.macos/raycast-activities-enc.sqlite
                （412MB，加密，本次未挖）
```
