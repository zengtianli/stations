# Session Retro · ~/Dev 站群归位 + 全树减肥（2026-04-20）

> 从 38 根目录 → 9 根目录；回收 ~3.5GB；/station-promote skill 落地 + dogfood 13 站。踩坑：symlink 链 mv 后大面积断裂。

---

## § 本轮做了什么

### Phase 1 · 立 station_path SoT + /station-promote skill
- `~/Dev/devtools/lib/station_path.{py,sh}` — 路径发现 SoT（stations/ → tools/ → Dev/）
- `~/Dev/devtools/scripts/station-promote.sh` — mv + python 正则 sed + raycast 重链 + 烟测
- `~/Dev/tools/cc-configs/commands/station-promote.md` — thin skill
- 改 5 个核心脚本接入 station_path：`api-smoke.sh` / `menus.py` / `deploy-changed.sh` / `_services_ts.py` / `web-stack/infra/deploy/deploy.sh` (改 `$SCRIPT_DIR` 自相对)
- `~/Dev/tools/configs/playbooks/stations.md` 加 § Promote 新站入站群

### Phase 2 · 分层重构（38 → 9 根目录）
```
stations/   13 repo（+cc-options）
labs/        7 实验/桌面 app
content/     5（+investment 含 yanyuan/IIQE/strategy）
migrated/   12 fallback（.venv 已清空）
_archive/    5 历史
tools/      12（cc-configs, configs, doctools, mactools, clashx, hammerspoon, raycast, scripts, vps...）
devtools/    留根（CC hooks + LaunchAgent 锚）
CLAUDE.md HANDOFF.md
```

### Phase 3 · 空间回收 ~3.5GB
- migrated/\*/.venv × 10 → 3.25GB
- Paper\*.zip × 2 → 35MB
- 313 .DS_Store + 31 _files.md + 1431 __pycache__ → ~100MB

### Phase 4 · 拆 international-assets
- cc-dashboard → stations/cc-options（对应 cc-options.tianlizeng.cloud 子域）
- yanyuan + IIQE-Paper{1,3} + strategy + docs → content/investment/（含 .git 继承 github remote）

---

## § 踩坑与根因

### 🔴 坑 1：mv 后大面积 symlink 断裂（51 个）

**现象**：移动 `~/Dev/cc-configs` → `~/Dev/tools/cc-configs` 后：
- `/handoff` `/retro` 等 slash command 全部消失
- 终端提示符变回裸 shell（starship 不启动）
- Raycast 触发器无响应

**根因**：许多外部 symlink 硬编码 `~/Dev/<tool>/` 路径：
- `~/.claude/{commands,skills,agents,harness.yaml}` → `~/Dev/cc-configs/*`（4 个）
- `~/.zshrc` `.bashrc` `.zshenv` `.zprofile` `.bash_profile` `.profile` `.zimrc` `.gitconfig` `.gitignore_global` → `~/Dev/dotfiles/shell/*`（9 个）
- `~/.config/{nvim,yabai,yazi,karabiner,ghostty,starship.toml,hammerspoon}` → `~/Dev/dotfiles/*` 或 `~/Dev/hammerspoon`（7 个）
- `~/Dev/tools/raycast/commands/*` × 31 → `~/Dev/{doctools,mactools,...}/raycast/commands/*`

**解法**：python 脚本扫描 `~/` 和 `~/.config/` 和 `~/Library/LaunchAgents/` 下所有 symlink，修复 target 中含旧路径的。

**下次**：`station-promote.sh` 应扩展扫描范围到：`~/.claude/` `~/.config/` `~/` 顶层隐藏 dotfile、`~/Library/LaunchAgents/`。

### 🔴 坑 2：BSD sed 不认 `\b` word boundary

**现象**：第一版 `station-promote.sh` 用 `sed -i '' "s|~/Dev/X\b|...|"` 没生效，sed 报 success 但无改动。

**根因**：macOS 自带 BSD sed 不支持 GNU `\b`。

**解法**：改用 python `re.sub(r"(?![A-Za-z0-9_-])")` 负向零宽断言做 word boundary。

### 🔴 坑 3：bash `${var/pattern/replacement}` 保留反斜杠

**现象**：`"${old/\/Dev\/doctools\//\/Dev\/tools\/doctools\/}"` 产生含字面 `\/` 的断链。

**根因**：bash 参数扩展中 `/` 不需要转义；加了反斜杠它会原样保留。

**解法**：python 做路径替换更安全；或 bash 不加反斜杠：`"${old/\/Dev\/doctools\//\/Dev\/tools\/doctools\/}"` 应是 `"${old//\/Dev\/doctools\// \/Dev\/tools\/doctools\/}"` — 仍然复杂，**优先 python**。

### 🟡 坑 4：Python `Path.home() / "Dev" / "X"` 构造不被字符串 sed 命中

**现象**：改了 `~/Dev/X` 字符串引用，但 Python 代码里 `Path.home() / "Dev" / "X"` 的动态构造没匹配到。

**根因**：sed 只看字符串字面值。

**解法**：加一轮针对 Python `Path()` 构造的专用正则：`Path\.home\(\)\s*/\s*"Dev"\s*/\s*"X"` → `... / "Dev" / "tools" / "X"`。

### 🟡 坑 5：web-stack 移位后 .venv shebang 失效

**现象**：`mv ~/Dev/web-stack ~/Dev/stations/web-stack` 后 `uvicorn` 启动报 `bad interpreter`。

**根因**：`.venv/bin/uvicorn` shebang 硬编码旧路径的 python3 binary。

**解法**：`rm -rf .venv && uv sync --all-packages` 重建 venv。

### 🟢 坑 6：`~/Dev/_archive/` 与 `_archived/` 双 archive 目录

**根因**：命名不一致漂移。

**解法**：合并为 `_archive/` 一家。

---

## § 做对的

1. **SoT 优先**：`station_path.{py,sh}` 抽象出来后，所有后续移动都是"改一个地方"
2. **自相对 path**：`web-stack/infra/deploy/deploy.sh` 用 `$SCRIPT_DIR/../..` 自推 `WEB_STACK_ROOT`，完全无视 web-stack 自己在哪
3. **pre-sed 再 mv**：先全局替换路径引用，再 mv，避免 mid-flight 断档
4. **分批 dogfood**：11 站按"破坏面小→大"排序 promote，逐批验证 menus-audit
5. **Python 替代 BSD sed**：word boundary + Path 构造都靠 python 可靠

## § 做错的

1. **忘了扫 `~/` 和 `~/.config/`** — 第一版 skill 只扫 ~/Dev/raycast/commands/ 的 symlink
2. **一次性 bash 参数扩展栽过两次**（第一轮 sed 无效，第二轮 symlink 反斜杠）— 下次这类"路径修改"直接用 python
3. **沙箱拦过 2 次**（systemd + mass-migration）才意识到该先让用户确认每批

---

## § 通用 Playbook：`~/Dev` 目录大重构

```
用户: "我要把 XX 挪到 YY"
  ↓
/warmup                                    # 看当前状态 + skills
  ↓
Phase 1 · 路径发现 SoT（如未立）
  └─ 抽 station_path helper，集中路径解析逻辑
  ↓
Phase 2 · pre-sed 外围引用
  ├─ ~/Dev/{devtools,cc-configs,configs,tools,stations}/*  
  ├─ ~/.claude/ settings.json + .claude.json
  ├─ ~/.config/*
  ├─ ~/ 顶层 dotfile symlinks
  ├─ ~/Library/LaunchAgents/*.plist
  └─ 用 python 正则，带 `(?![A-Za-z0-9_-])` word-boundary
  ↓
Phase 3 · pre-sed Python 代码里的 Path 构造
  └─ `Path.home() / "Dev" / "X"` → `... / "Dev" / "tools" / "X"`
  ↓
Phase 4 · mv 物理搬
  └─ 靠 SoT 的脚本自适应；不需要改源码
  ↓
Phase 5 · 修残留 symlink
  ├─ ~/Dev 下（raycast 等）
  ├─ ~/.claude/
  ├─ ~/.config/
  └─ ~/ 顶层 + LaunchAgents
  ↓
Phase 6 · 验证
  ├─ /menus-audit（站群 SSOT）
  ├─ /sites-health（公网 200）
  ├─ 开新终端测 starship prompt
  ├─ 测 /handoff /retro 等 slash command 可用
  └─ 跑一次 Raycast 触发器
  ↓
/ship devtools tools/cc-configs tools/configs ...
```

---

## § 下次要做的

1. **扩展 `station-promote.sh` 扫描范围**到 `~/.claude/` `~/.config/` `~/Library/LaunchAgents/` `~/` 顶层 — 避免未来 promote 再踩同样的坑
2. **stations/cc-options/** 目前无 .git，需要 `git init` + push 到 github 时再做
3. **content/investment/** 的 github remote 还叫 `international-assets`，改名（可选）
4. **migrated/hydro-\*** 等 5/4 归档 github
5. **international-assets** WIP 已解决（拆分完成）

---

## § 关键文件索引

| 用途 | 绝对路径 |
|---|---|
| 路径 SoT | `/Users/tianli/Dev/devtools/lib/station_path.{py,sh}` |
| Skill 脚本 | `/Users/tianli/Dev/devtools/scripts/station-promote.sh` |
| Skill 文档 | `/Users/tianli/Dev/tools/cc-configs/commands/station-promote.md` |
| Playbook | `/Users/tianli/Dev/tools/configs/playbooks/stations.md` § Promote 新站入站群 |
| Memory | `/Users/tianli/.claude/projects/-Users-tianli-Dev/memory/reference_stations_layout.md` |
| Memory（本坑） | `/Users/tianli/.claude/projects/-Users-tianli-Dev/memory/feedback_destructive_ops_verification.md` |
