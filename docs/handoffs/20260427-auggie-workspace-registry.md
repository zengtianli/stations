# Handoff · `~/Dev` · auggie workspace 注册表落地

> 2026-04-27 · 41 个 git repo 全部纳入 auggie dispatch SSOT；25 indexable / 16 not；CC 调 auggie 走闭环

## 当前进展

### 1. SSOT + 生成器 + dispatch 协议（全部完成）

- **SSOT yaml**：`~/Dev/tools/configs/auggie-workspaces.yaml`（手写，41 workspaces）
- **派生 JSON**：`~/Dev/tools/configs/auggie-workspaces.json`（CC 解析）
- **生成器**：`~/Dev/devtools/lib/tools/auggie_workspaces.py`
  - `build` (yaml→json) / `resolve <id>` / `list [--indexable] [--type] [--status]` / `audit`
- **全局 CLAUDE.md** (`~/.claude/CLAUDE.md`) § auggie 使用规范下新增 **workspace dispatch 协议**：CC 调 auggie 前必先 `resolve <id>` 拿路径，不凭直觉

### 2. 41 workspaces 分类

| status | 数量 | 处理 |
|---|---|---|
| `active` + `indexable=true` | **25** | auggie 主战场（stations / devtools / tools / labs 7 / content 3 / Work 5） |
| `archive` GitHub-archived | 3 | essays / learn / downloads-organizer · 不索引 |
| `archive` migrated-legacy | 10 | `migrated/hydro-*-legacy` · 已迁 stations/web-stack/services/，索引会污染召回 |
| `data` local-only | 2 | `water-src` 20G + `risk-map` 798M · 不上 GitHub，不索引 |
| `meta` | 1 | `dev-meta` (~/Dev) · 整体太大，禁止 `-w ~/Dev`，按子项目 dispatch |

### 3. 修复事故

- `~/Dev/Work/risk-map/.git` 历史误配指向 `dev-meta`（git log 全是 paths SSOT commits）→ `rm -rf .git`，退回普通工作目录。dev-meta 历史在 `~/Dev` 自身完整保留，无丢失

### 4. Memory + 复盘

- 新增 `reference_auggie_workspaces_registry.md`
- 新增 `feedback_data_vs_code_repo.md`（批量 push/索引前必先 du）
- 复盘：`~/Dev/stations/docs/knowledge/session-retro-20260427-auggie-workspace-registry.md`
- 旧 HANDOFF（paths v1.1）已归档：`~/Dev/stations/docs/handoffs/20260425-paths-registry-v1.1.md`

## 待完成

仅剩**观察项**（不卡新会话）：

- [ ] 实际使用一段时间，看是否有 indexable 标错的（数据型混了 code，或 archive 标错），按需调整 yaml
- [ ] `~/Dev/tools/configs/hammerspoon/` 顶层是 submodule clone 副本（与 `~/Dev/tools/hammerspoon/` 是两份），下次会话决定合并或归档

---

## 本轮第二批（同会话扩展）已完成

**configs SSOT 重构**（用户看到 du alias 改在两处后追问"重复配置"，触发更大重构）：

- 顶层 5 个 stale dotfiles 副本（`zsh/ nvim/ yabai/ yazi/ karabiner/`）归档至 `~/Dev/_archive/configs-stale-20260427/`，可回滚
- `tmux/` 和 `IDE/` 搬入 `_dotfiles/`，`~/.tmux.conf` 和 `~/.ideavimrc` 改 symlink
- `_dotfiles/link.sh` 补这两条 symlink
- `_dotfiles/shell/.../modern-cli.zsh`：删 `alias du="dust"` + `unalias du` 干掉 zim utility 自加的 `du -h` → 现在 `type du` = `du is /usr/bin/du`
- `tools/configs/CLAUDE.md` 重写（原版引用全失效路径）
- `tools/configs/README.md` 重写（setup 改为 `bash _dotfiles/link.sh` 一键部署）
- `tools/configs/CHANGELOG.md` 首条记录
- 顶层 commit：`9bbd9fd chore(configs): dedup dotfiles SSOT + tmux/IDE 纳入 _dotfiles + auggie-workspaces 注册表` + `8985540 docs(configs): 重写 CLAUDE.md 反映 _dotfiles 单一 SSOT + 加 auggie audit gate`

**paths 死链清理**：

- `paths: 55 registered / 0 dead / 0 drift`（从 19 dead 降至 0）
- 修了 3 处归档造成的新死链（`tools/configs/CLAUDE.md` 旧路径引用）
- `path-registry/` 加入 `SCAN_EXCLUDE_DIRS`（marketing README 设计占位非真死链）
- `~/Dev/paths.yaml` `allow_missing` 加 1 条：`stations/HANDOFF.md` 的 `site-health-YYYY-MM-DD.md` 占位
- devtools commit：`c361b15 feat(auggie): workspace registry generator + paths.py 加 path-registry exclude`

**pre-commit gate 扩展**：

- `~/Dev/tools/configs/menus/.pre-commit-hook.sh` 加 auggie-workspaces 改动时自动跑 audit gate（实测改 yaml → hook 触发 audit → 通过 → exit 0）

**新 slash command**：

- `/auggie-workspace-add <id> <path>` — 加新 repo 到注册表，含体积闸门 + 自动 github 探测 + build/audit + resolve 验证
- 文件：`~/Dev/tools/cc-configs/commands/auggie-workspace-add.md`

## 关键文件

| 文件 | 说明 |
|------|------|
| `/Users/tianli/Dev/tools/configs/auggie-workspaces.yaml` | SSOT 手写 · 唯一手改点 |
| `/Users/tianli/Dev/tools/configs/auggie-workspaces.json` | 派生 · `auggie_workspaces.py build` 生成 |
| `/Users/tianli/Dev/devtools/lib/tools/auggie_workspaces.py` | 生成器 + 解析器 + 校验器 |
| `/Users/tianli/.claude/CLAUDE.md` | 全局 § auggie 使用规范 + 新增 dispatch 协议节 |
| `/Users/tianli/Dev/stations/docs/knowledge/session-retro-20260427-auggie-workspace-registry.md` | 本轮 retro |
| `/Users/tianli/Dev/stations/docs/handoffs/20260425-paths-registry-v1.1.md` | 上一轮归档（paths v1.1） |

## 踩过的坑

### 1. 数据型 repo 不能和代码型一概而论 ⭐

**现象**：原计划"~/Dev 全部 push GitHub + 全部索引"。准备执行时先 `du -sh`，发现 `Work/water-src=20G`（PDF/zip）+ `Work/risk-map=798M`（shapefile）。

**根因**：用户的"全部上"包含了不该上的部分。GitHub 单文件 100M / repo 5G soft 限制；Augment 在 PDF/zip/shp 上索引出来的"代码"是垃圾召回，会污染所有后续 auggie 查询。

**解法**：体积闸门作为标准步骤 —— 批量 push / 批量索引前先 `du -sh`，data 型标 `type=data, indexable=false, github=null`。已固化 memory `feedback_data_vs_code_repo.md`。

### 2. risk-map .git 错配

**现象**：`git log` 全是 paths SSOT commits，跟目录里的水利数据无关。

**根因**：历史上不慎在该目录跑过 `git clone <dev-meta>` 或类似操作，覆盖了正确的 .git。

**解法**：`rm -rf .git` 退回普通工作目录。dev-meta 历史在 ~/Dev 自身保留，无丢失。

### 3. `du` 被 alias 拦截

**现象**：`du -sh <path>` 输出的是 du 命令的 help 文本（被 zsh alias 替换成了 `dust` 之类）。

**解法**：用绝对路径 `/usr/bin/du -sh ...` 绕开 alias。



删了这个alias，保持du 的干净

## 下个会话启动

```
/warmup
```

或者直接验证 workspace SSOT 还活着：

```bash
python3 ~/Dev/devtools/lib/tools/auggie_workspaces.py audit
python3 ~/Dev/devtools/lib/tools/auggie_workspaces.py list --indexable | head
```

## CC 调 auggie 的标准姿势（自检）

```bash
# 1. 拿路径
WS=$(python3 ~/Dev/devtools/lib/tools/auggie_workspaces.py resolve <id>)
# 2. 喂 auggie
auggie -p -a -q "..." -w "$WS"
```

或 MCP `mcp__auggie__codebase-retrieval` 的 `directory_path` 同样填 resolve 出的绝对路径。
