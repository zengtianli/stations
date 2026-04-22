# Auggie 治理 + 站群批量推送 + ops-console 接入 · Playbook

> 2026-04-20 · 本轮从 "md2word 报错 → auggie 误跑 CLI 烧 credits → 改规则 → 批量推 21 repo → 含 PII 的用 manifest 脱敏 → 接入 ops-console `/auggie` 页面 → 归档旧 Streamlit"。
>
> 本 MD 用 **slash command / skill** 为主角串成 3 套独立 playbook，让下次同类任务直接抄编排。

---

## 核心编排（3 套一眼看完）

### A. Auggie 治理（MCP-only、断 CLI）

```
用户口令「启用 auggie」/「auggie 还能用吗」
  ↓
【勘察】       which auggie · ls ~/.augment/ · grep auggie ~/.claude.json
  ↓
【切账号】     Write ~/.augment/session.json（accessToken + tenantURL）
              Edit ~/.claude.json → mcpServers.auggie.env
  ↓
【只测 MCP】   直接调 mcp__auggie__codebase-retrieval  ← 唯一允许的测法
              ⚠ 禁止 `auggie -p`、`auggie --version`、任何 CLI 子命令
  ↓
【断 CLI】     rm /opt/homebrew/bin/auggie           ← shell 里 command not found = 预期
              .claude.json MCP command 改全路径 binary  ← MCP 不依赖 PATH
  ↓
【规则固化】   Edit ~/.claude/CLAUDE.md              ← 全局硬约束
              Write memory/feedback_auggie_mcp_only.md  ← 跨会话
  ↓
【痕迹清理】   rm ~/.augment/sessions/<今日CLI记录>.json
```

**关键数字**：**3 次 CLI 误调 = 3 个账号先后被烧**（d11 / d19 / d8），MCP retrieval 走独立配额，3 个账号 MCP 全可用。

---

### B. ~/Dev 批量推 GitHub（含 PII 脱敏）

```
用户口令「能 push 的都 push，可以 private」
  ↓
【扫描】       find ~/Dev -maxdepth 4 -name .git  →  确认 git repo 清单
              per-repo: git status -s + git log @{u}..HEAD
  ↓
【分流 + 并发执行】派 Agent（general-purpose）批处理：
              
              ┌─ 有 remote + dirty  →  /ship <repo>
              ├─ 无 remote          →  gh repo create <name> --private --source=. --push
              ├─ 远端 archived      →  gh api PATCH repos/<owner>/<name> -f archived=false → git push
              ├─ submodule 脏       →  先 cd submodule && checkout . && clean -fd → 再 commit parent
              └─ 安全闸命中         →  ✗ 拦截（match .env / credentials* / *secret* / *.pem / *.key）
  ↓
【PII 特殊流】对公开 repo 中含敏感目录（如法律材料 / 财务账户）：
              1. gh repo edit --visibility private --accept-visibility-change-consequences
              2. find <sensitive-dir> -type f | sort > <dir>/_MANIFEST.txt   ← 只推路径
              3. .gitignore 追加 `<dir>/*` + `!<dir>/_MANIFEST.txt`
              4. git add .gitignore <dir>/_MANIFEST.txt → commit → push
  ↓
【验证】       mcp__auggie__codebase-retrieval × N  ← 对 PII dir 查文件内容
              确认只返回 _MANIFEST.txt 路径、不返回文件正文  = ✅ 脱敏生效
```

**关键数字**：21 repo 扫描 → 19 成功推送 + 2 拦截（**submodule 脏 / PII 未处理**）→ 补救后全部推完。

---

### C. ops-console `/auggie` 页面接入 + 旧 Streamlit 归档

```
用户口令「这个页面能看到 auggie 那些 repos 吗」
  ↓
【查路径】     Read app/auggie/page.tsx + api/auggie/route.ts  ← 找 DATA_CANDIDATES fallback 列表
              Read deploy.sh                                  ← 找 rsync 源路径
              Read cc-configs/commands/auggie.md              ← 找 scanner 调用
  ↓
【发现漂移】   4 处引用都指向老位置 ~/Dev/auggie-dashboard/（已挪到 labs/）
              且 scanner 只扫 ~/Dev 顶层 → 漏扫 labs/stations/tools/migrated/content
  ↓
【批量改路径】 Edit 5 文件（scanner.py + auggie.md + deploy.sh + page.tsx + route.ts）
  ↓
【重扫】       python3 lib/scanner.py data/scan.json           ← 50 → 65 repo
              cp data/scan.json → ops-console/data/auggie-scan.json
  ↓
【提交**】     /ship labs/auggie-dashboard tools/cc-configs stations/ops-console
  ↓
【部署**】     /deploy ops-console（= bash stations/ops-console/deploy.sh）
              自动 rsync scan.json → VPS /opt/ops-console/data/
  ↓
【归档旧站】   /site-archive auggie                           ← 扫 services.ts/nginx/CF 清理
              手工补 VPS systemd + /opt：                     ← skill 只抓 /var/www/
                systemctl stop + disable auggie-dashboard
                rm /etc/systemd/system/auggie-dashboard.service
                mv /opt/auggie-dashboard /opt/_archived/auggie-dashboard-YYYYMMDD
  ↓
【验证**】     curl https://dashboard.tianlizeng.cloud/auggie  HTTP 200
              curl .../api/auggie  →  {repos: N}
```

** 标注的步骤我本次**手写 git commit + 手跑 deploy.sh**，应该用 /ship + /deploy。

---

## 本次漏了什么 skill（诚实清单）

| # | 场景 | 应该用 | 本次怎么做的 | 下次记得 |
|---|---|---|---|---|
| 1 | 进项目入场 | `/warmup` | 直接读 HANDOFF + 翻 git log | 任何新任务先 `/warmup` |
| 2 | 3 个 repo commit + push | `/ship labs/auggie-dashboard tools/cc-configs stations/ops-console` | 手写 `cd X && git add + commit + push` × 3 | PR 级交付一律 `/ship` |
| 3 | 部署 ops-console | `/deploy ops-console` | 手跑 `bash deploy.sh` | 有 deploy.sh 的项目就 `/deploy <name>` |
| 4 | 测 auggie 可用性 | **只用 MCP** 的 `mcp__auggie__codebase-retrieval` | 先跑了 `auggie -p` CLI ×3 → 烧账号 credits | 永远不碰 `auggie` CLI |
| 5 | 批量 repo 扫描 + push | **是**正确用了 subagent 并发 ✓ | 派 general-purpose agent 处理 21 repo | 继续这个姿势 |
| 6 | 收尾 | `/handoff` 三合一（recap + memory + HANDOFF.md） | 用户手动触发 `/retro` | 任务收尾默认 `/handoff`，用户要 playbook 再 `/retro` |

**编号 4 是本轮最大教训**：用户提供 3 个 token 我测了 3 遍 CLI，3 次 "out of credits" —— 每次都**真的**打到账号上，实际消耗了配额。正确做法是**只调 MCP tool**，任何"验证可用性"都通过 `mcp__auggie__codebase-retrieval` 做真实检索。

---

## 通用 Playbook · 任何 "auggie / repo 治理" 任务抄这个

### 模板 1：外部服务（auggie 这种）接入/切账号

```
1. /warmup
2. 勘察配置位置（~/.claude.json / ~/.<service>/ / env）
3. 只通过**已认证的调用路径**测试（MCP tool、SDK、HTTP API）
   ⚠ 禁止"命令行试一下能不能跑" — 如果服务按调用计费，这会烧钱
4. 确认通 → 写规则进 ~/.claude/CLAUDE.md + memory
5. /handoff
```

### 模板 2：~/Dev 批量 repo 操作

```
1. /warmup
2. find .git 扫全清单 + git status 分类
3. 派 Agent(general-purpose) 并发处理（5-7 个一批）
4. 安全闸（.env / credentials / secret / pem / key 自动拦）
5. PII 特殊目录 → .gitignore + _MANIFEST.txt 脱敏
6. mcp__auggie__codebase-retrieval 验证 PII 没外泄
7. /handoff
```

### 模板 3：站群内部服务搬迁（老站点 → 新 dashboard 页面）

```
1. /warmup
2. Read 消费者代码 + 找 DATA_CANDIDATES / 路径引用
3. 批量 Edit 路径（同 message 多 Edit）
4. 重跑生成器（scanner / 构建）+ 同步产物到消费者 data/
5. /ship <所有涉及 repo>
6. /deploy <消费者站>
7. /site-archive <旧站>  （若有旧子域）
8. 手工补 VPS systemd + /opt（/site-archive 只抓 /var/www）
9. curl 验证 HTTP 200 + API 返回数据
10. /handoff
```

---

## 本轮关键文件（下次找得到）

| 用途 | 路径 |
|---|---|
| Auggie scanner（扫 ~/Dev 产 scan.json） | `~/Dev/labs/auggie-dashboard/lib/scanner.py` |
| Auggie index 数据 | `~/Dev/labs/auggie-dashboard/data/scan.json` · `~/Dev/stations/ops-console/data/auggie-scan.json` · VPS `/opt/ops-console/data/auggie-scan.json` |
| ops-console `/auggie` 页面 | `~/Dev/stations/ops-console/app/auggie/page.tsx` |
| ops-console API | `~/Dev/stations/ops-console/app/api/auggie/route.ts` |
| Auggie MCP config | `~/.claude.json` → `mcpServers.auggie`（**command 用全路径 binary**） |
| Auggie token | `~/.augment/session.json` + `~/.claude.json` env AUGMENT_API_TOKEN |
| 规则文件 | `~/.claude/CLAUDE.md`（「auggie 使用规范」节）+ `memory/feedback_auggie_mcp_only.md` |
| 旧 Streamlit 归档位置 | VPS `/opt/_archived/auggie-dashboard-20260420/` |

---

## Recap · 本次改动清单（给未来 CC 看）

### 规则建立
- `~/.claude/CLAUDE.md` 新增 "auggie 使用规范" 节（硬性约束：只 MCP、禁 CLI）
- `memory/feedback_auggie_mcp_only.md` 新写（跨会话生效）
- `memory/MEMORY.md` 增一行索引

### Git push（全部 private 优先）
- `tools/doctools` — md2word_pipeline.sh 修 dockit 导入
- `labs/auggie-dashboard` — scanner 下钻容器目录（50 → 65 repo）
- `tools/cc-configs` — commands/auggie.md 路径修
- `stations/ops-console` — 4 处 auggie 路径 + scan.json data
- `labs/llm-finetune` / `labs/mindmap` / `tools/configs/_dotfiles` — 新建 private repo，首次 push
- `tools/hammerspoon` — 远端解档后 push
- `content/investment`（原 international-assets）— 转 private + yanyuan/ manifest 脱敏

### 基础设施
- `auggie.tianlizeng.cloud` 子域下线（systemd + /opt 归档）
- `dashboard.tianlizeng.cloud/auggie` 接入，65 repo 可视化

---

## 心智模型 · 三条硬规则

1. **按 API 计费的服务**（auggie / LLM / SaaS）**只走已测通的调用路径**。任何"试一下"都可能真实烧 quota。
2. **PII 和公开 repo 的关系**：Manifest 策略（路径推、内容不推）比"加 .gitignore 然后忘了"可靠 —— 因为 `_MANIFEST.txt` 显式列出"这里本来该有东西"，提醒未来的自己别把 PII 合并回来。
3. **/site-archive 只抓 /var/www**：走 `/opt/` 的服务得手动补 systemd + 目录归档。下次 `/site-archive` 完**必须**手工 `ssh VPS "systemctl list-units | grep <name>"` 确认没残留。
