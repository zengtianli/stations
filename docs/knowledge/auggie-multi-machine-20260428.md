---
title: auggie 多机器索引共享 — 假设 / 验证步骤 / 降级方案
date: 2026-04-28
status: 文档完成 · 待用户在第二台机器实测
roadmap: ROADMAP.md § 支柱 A · A3
---

# auggie 多机器索引共享 — A3 方案与待 verify 清单

> ROADMAP v1.0 验收画像 #3：第二台机器（laptop / 工作机）配置同一份 augment session，能调到本机已建的索引（无需重建）。
>
> 状态：**文档完成 · 待用户实测**（self 单机器无法验证此条）。

## 1 · 工作假设（理论）

augment 的代码索引由 augmentcode.com **后端持久化**（Indie Plan 用户私有 vector DB），客户端 (auggie CLI / MCP) 只是发查询拿结果。所以：

- 同一 OAuth session 多端登录 → 应拿到同一份后端索引
- 两端调 `auggie -p -q "..." -w <path>` 第一次召回都应 ≤ 5s（不重建）
- 单机预热（`auggie_warmup.py run`）的代码索引在云端，**理论应跨端共享**

**验证标的**：上述假设是否成立。如果不成立，必须降级。

## 2 · 实测步骤（用户在第二台机器跑）

### 2.1 准备

第二台机器已有：
- nvm `auggie` ≥ v0.24.0（或与第一台同版本）
- `~/.augment/session.json`（**关键**：从第一台 scp 过来 OR 重新 `auggie login` 用同一邮箱）
- 项目 clone 完整：`stations/` `devtools/` `labs/hydro-apps/` 至少 3 个 indexable workspace

### 2.2 测试矩阵

第二台机器跑（每条 ≤ 60s 视为 cold-start 共享 ok）：

```bash
# 测试 1 — 极小仓
time auggie -p -a -q "warmup test" -w ~/Dev/devtools

# 测试 2 — 中型仓（已知第一台 warm 过）
time auggie -p -a -q "warmup test" -w ~/Dev/stations

# 测试 3 — 大仓（≥ 5G）
time auggie -p -a -q "warmup test" -w ~/Dev/labs/hydro-apps
```

### 2.3 判定

| 第二台首查 duration | 判定 |
|---|---|
| ≤ 5s | 后端共享 ok ✅ — 索引复用，A3 acceptance ✅ |
| 5-60s | partial ok 🟡 — 元数据共享但代码可能 re-vectorize；可接受 |
| > 60s 或 timeout | **不共享** ❌ — 需走降级方案 §3 |

## 3 · 降级方案（如实测 §2 失败）

如果第二台首查 > 60s，augment 后端**不**跨端共享，每端必须独立预热。

### 3.1 注册表共享（仍是单 SSOT）

`~/Dev/tools/configs/auggie-workspaces.yaml` 仍是唯一手写 SSOT。两台机器都从 git pull 这份，**不要各机器各自维护**。

### 3.2 各端独立 warmup

第二台跑：
```bash
cd ~/Dev/devtools && git pull
python3 ~/Dev/devtools/lib/tools/auggie_workspaces.py build
python3 ~/Dev/devtools/lib/tools/auggie_warmup.py run
```

各端独立的 `auggie-health.json` 不合并（避免互相覆盖）。考虑：
- `auggie-health.<hostname>.json` 命名分离
- ops-console `/auggie/workspaces` 表读 `auggie-health.<MAIN_HOST>.json`（约定主端）

### 3.3 ROADMAP A3 acceptance 调整

如降级：
- ✅ 注册表跨端共享（git）
- ✅ 各端独立 warmup（10-20 min）
- ❌ "首次召回 ≤ 5s" 改为 "已预热则 ≤ 5s；新机器需先跑一次 warmup"

仍可 ship v1.0，注明此条用了降级路径。

## 4 · 第二台机器初始化 checklist（A3 ✅ / 降级共用）

- [ ] nvm + node v22.21.1 + auggie binary
- [ ] `auggie login` OAuth 用 zengtianli1@gmail.com（与第一台同邮箱）
- [ ] git clone（核心 repo）：
  - `stations/` (monorepo)
  - `devtools/`
  - `tools/configs/` `tools/cc-configs/`
  - 按需 `labs/*`
- [ ] source `~/.personal_env`（或重新填）
- [ ] 跑 §2.2 测试矩阵记录 3 条 duration
- [ ] **回填本文 §5 实测结果**

## 5 · 实测结果

<!-- VERIFY: 用户在第二台机器实测后填这里 -->

```
机器: <hostname / 型号>
日期: <YYYY-MM-DD>
auggie 版本: <output of `auggie --version`>

测试 1 (devtools):  <duration> · <status>
测试 2 (stations):  <duration> · <status>
测试 3 (hydro-apps): <duration> · <status>

结论: [ ] 共享 ok / [ ] partial / [ ] 不共享（用降级 §3）
```

## 6 · 引用

- ROADMAP § 支柱 A · A3：`~/Dev/ROADMAP.md`
- session.json 配置：`~/.augment/session.json`（OAuth 自动写入）
- auggie 反代历史档案（已弃）：`~/Dev/stations/docs/knowledge/_archive-auggie-reseller-20260427/`
- workspace 注册表：`~/Dev/tools/configs/auggie-workspaces.yaml`
- 预热脚本：`~/Dev/devtools/lib/tools/auggie_warmup.py`
