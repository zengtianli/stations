# OpenClaw 架构全解

> 基于官方 GitHub 文档整理，供理解 edict 三省六部架构使用
> 更新：2026-03-23

---

## 一、是什么

OpenClaw 是一个**本地运行的个人 AI 助手框架**，核心理念是：

- 任何通讯平台（飞书、WhatsApp、Telegram、Discord、Slack 等 21 个）都能接入
- 本地 Gateway 进程统一管理 agent、session、tool
- 多 agent 协同（通过 sessions_spawn / sessions_send）

口号：*Your own personal AI assistant. The lobster way. 🦞*

---

## 二、核心架构

```
用户（飞书消息）
     ↓
  Channel（渠道适配器）
     ↓
  Binding（路由规则：哪条消息给哪个 agent）
     ↓
  Gateway（本地进程，127.0.0.1:18789）
     ↓
  Agent（独立大脑：有自己的 workspace、session、auth）
     ↓
  LLM（GLM / Claude / GPT 等）
```

---

## 三、目录结构

```
~/.openclaw/
├── openclaw.json          # 全局配置（JSON5 格式）
├── workspace/             # 默认 workspace（单 agent 时用）
│   ├── SOUL.md            # 人格/角色定义（每次 session 注入）
│   ├── AGENTS.md          # 操作指令 + 记忆（规则、优先级）
│   ├── USER.md            # 用户档案
│   ├── IDENTITY.md        # agent 名字/风格/emoji
│   ├── TOOLS.md           # 工具使用注记（guidance，不控制权限）
│   ├── HEARTBEAT.md       # 可选心跳检查清单
│   ├── MEMORY.md          # 可选长期记忆
│   └── skills/            # workspace 级 skill
│
├── workspace-taizi/       # 太子的 workspace（edict 多 agent 配置）
├── workspace-zhongshu/    # 中书省的 workspace
├── workspace-shangshu/    # 尚书省的 workspace
├── workspace-bingbu/      # 兵部的 workspace
├── ... （六部各自独立）
│
├── agents/
│   └── <agentId>/
│       ├── sessions/
│       │   └── sessions.json    # session 历史（对话消息）
│       └── agent/
│           ├── models.json      # 该 agent 可用模型列表
│           └── auth-profiles.json  # 该 agent 的 API key + 失败统计
│
├── subagents/
│   └── runs.json           # sessions_spawn 的历史记录
│
├── logs/
│   └── openclaw-YYYY-MM-DD.log
│
└── skills/                 # 全局 skill
```

---

## 四、openclaw.json 关键字段

### agents 块

```json5
{
  agents: {
    defaults: {
      model: { primary: "zhipu/GLM-5-Turbo" },
      subagents: {
        maxConcurrent: 1,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60
      }
    },
    list: [
      {
        id: "taizi",                            // stable agent id（路由和 session key 都用它）
        workspace: "~/.openclaw/workspace-taizi",
        subagents: {
          allowAgents: ["zhongshu"]             // ← 这里控制 sessions_spawn 白名单
        }
      },
      {
        id: "zhongshu",
        workspace: "~/.openclaw/workspace-zhongshu",
        subagents: {
          allowAgents: ["menxia", "shangshu"]   // 允许 sessions_spawn 这两个
        }
      }
    ]
  }
}
```

### bindings 块（消息路由）

```json5
{
  bindings: [
    {
      agentId: "taizi",
      match: {
        channel: "feishu",
        accountId: "*"     // 匹配所有飞书账号
      }
    }
  ]
}
```

---

## 五、Workspace Bootstrap 文件

每次 session 开始，OpenClaw 自动注入以下文件（按优先级排序）：

| 文件 | 用途 | 大小限制 |
|------|------|---------|
| `SOUL.md` | **人格/角色/行为规则**（核心！） | 截断到 20000 字符 |
| `AGENTS.md` | 操作指令 + 记忆 | 同上 |
| `USER.md` | 用户档案 | 同上 |
| `IDENTITY.md` | agent 名字/emoji | 同上 |
| `TOOLS.md` | 工具使用 guidance（不控制权限） | 同上 |
| `HEARTBEAT.md` | 心跳检查清单 | 同上 |

**总计上限 150000 字符**。SOUL.md 没有固定 schema，纯 Markdown，内容由用户定义。

---

## 六、Agent 间通信：两种方式

### 方式 A：sessions_spawn（子 agent）

```
父 agent 调用 sessions_spawn 工具
  → OpenClaw 创建新 session：agent:<agentId>:subagent:<uuid>
  → 子 agent 执行任务
  → 结果返回给父 agent
  → session 自动归档（60 分钟后）
```

**特点：**
- OpenClaw 原生工具，GLM 天然倾向用它
- 子 session key 含 `subagent`：`agent:menxia:subagent:xxx`
- **仪表盘不显示**（deliver: false，不发到渠道）
- 子 agent 不能再次 spawn（禁止二级嵌套）
- 受 `allowAgents` 白名单控制（`[]` = 禁用）

### 方式 B：npx openclaw agent（standalone 进程）

```
父 agent 通过 Bash tool 运行：
npx openclaw agent --agent bingbu --message "..."
  → 启动独立的 openclaw 进程
  → **仪表盘可见**（独立 session）
  → 结果通过 stdout 或 sessions_send 返回
```

**特点：**
- 需要模型主动调用 Bash tool
- 仪表盘可见 ✅
- 异步执行：命令立即返回 `Command still running (session xxx, pid yyy)`
- 需要用 `npx openclaw process poll <session_id>` 等待结果
- GLM 不会主动选这个（偏好 sessions_spawn）

### 两者对比

| 维度 | sessions_spawn | standalone (npx) |
|------|---------------|-----------------|
| 仪表盘可见 | ❌ | ✅ |
| 模型自然选择 | ✅ GLM 默认用 | ❌ 需要强制 |
| 调用复杂度 | 简单（一行） | 复杂（异步+polling）|
| 嵌套支持 | ❌ 不能二级 | ✅ 可以 |
| 控制方式 | allowAgents 白名单 | SOUL.md 指令 |

---

## 七、sessions_spawn 控制机制

**关键配置**：`agents.list[].subagents.allowAgents`

```json5
allowAgents: ["*"]        // 允许 spawn 任意 agent
allowAgents: ["menxia"]   // 只允许 spawn 门下省
allowAgents: []           // 禁止所有 sessions_spawn
```

设为 `[]` 后：
- sessions_spawn 工具从可用工具列表中移除
- 模型无法调用 sessions_spawn（不是返回错误，而是工具本身消失）
- 模型需要 fallback 到其他方式（如 bash）

---

## 八、edict 三省六部与 OpenClaw 的映射

```
edict 概念           →    OpenClaw 概念
────────────────────────────────────────
太子 (taizi)         →    Agent（飞书消息入口）
中书省 (zhongshu)    →    Agent（sessions_spawn 子 agent）
门下省 (menxia)      →    Agent（sessions_spawn 子 agent）
尚书省 (shangshu)    →    Agent（sessions_spawn 子 agent）
六部 (bingbu 等)     →    Agent（sessions_spawn 子 agent）

SOUL.md              →    workspace 注入文件（人格/规则）
JJC-xxxx 任务        →    自定义看板（不是 OpenClaw 原生概念）
edict 仪表盘         →    OpenClaw Dashboard（127.0.0.1:18789）
sync_agent_config.py →    将 ~/Dev/edict/agents/ 同步到 workspace
```

**当前 edict 架构问题：**

```
太子 ──npx openclaw agent──→ 中书省  ✅ standalone，仪表盘可见
中书省 ──sessions_spawn──→ 门下省   ❌ subagent，仪表盘不可见
中书省 ──sessions_spawn──→ 尚书省   ❌ subagent，仪表盘不可见
尚书省 ──sessions_spawn──→ 六部     ❌ subagent，仪表盘不可见
```

**目标架构（六部可见）：**

```
太子 ──npx openclaw agent──→ 中书省  ✅
中书省 ──npx openclaw agent──→ 门下省  ✅
中书省 ──npx openclaw agent──→ 尚书省  ✅
尚书省 ──npx openclaw agent──→ 六部   ✅
```

---

## 九、Dashboard 功能说明

访问：`http://127.0.0.1:18789`（VPS 需要 SSH 隧道：`ssh -L 7891:localhost:18789 root@VPS_IP`）

| 模块 | 说明 |
|------|------|
| Chat | 直接与 agent 对话，实时 tool call 可视化 |
| Sessions | 所有 session 列表（包括子 agent session） |
| Channels | 飞书/WhatsApp 等渠道状态 |
| Cron jobs | 定时任务管理 |
| Config | 直接编辑 openclaw.json |
| Logs | 实时日志 |

**仪表盘显示哪些 session：**
- 独立 agent session（`agent:xxx:main`）✅ 显示
- sessions_spawn 子 agent（`agent:xxx:subagent:uuid`）❌ 不显示（deliver: false）
- standalone 进程 session（`agent:xxx:main` 独立进程）✅ 显示

---

## 十、核心局限 & edict 的选择

| 局限 | 说明 |
|------|------|
| sessions_spawn 不可见 | 子 agent 不推送到渠道，仪表盘无显示 |
| 子 agent 不能二级嵌套 | 子 agent 内部不能再 spawn |
| SOUL.md 大小限制 | 20000 字符/文件，150000 总计 |
| 异步 standalone 复杂 | npx openclaw agent 需要 polling 等待结果 |

edict 当前选择了 sessions_spawn（链路跑通，但六部不可见）。
改成 standalone 需要 GLM 理解异步 polling，难度高。

---

## 十一、GLM 模型选型（Agent 场景）

| 模型 | Tool Call 能力 | 定位 | 推荐用途 |
|------|--------------|------|---------|
| **GLM-4.7**（Z.ai新体系）| 84.7分（超Claude Sonnet 4.5）| 旗舰 | 调度层（中书/尚书）|
| **GLM-4.5-air** | 90.6% tool call 成功率 | Agent 专项 | 调度层 |
| **GLM-4.6** | 强，支持多模态 FC | MoE旗舰 | 通用 |
| **GLM-5-Turbo**（当前）| 较弱 | 快速轻量 | ❌ 不适合 Agent 调度 |
| **GLM-Z1 系列** | 中等 | 推理增强 | 适合分析，不适合 FC 密集 |

**关键结论：GLM-5-Turbo 不是 Tool Call 优化模型，不适合做调度层。**
改成 GLM-4.5-air 或 GLM-4.7，指令遵循和 tool call 成功率会大幅提升，无需换框架。

---

## 十二、替代框架对比

| 框架 | 一句话 | 复杂度 | 可视化 | GLM 支持 |
|------|--------|--------|--------|---------|
| **CrewAI** | 原型最快，角色扮演团队 | 低 | CrewAI Studio | ✅ base_url |
| **AgentScope（阿里）** | 原生适配 GLM，透明可控 | 中 | Workstation | ✅ 内置 ZhipuAI wrapper |
| **LangGraph** | 生产级状态机，最精确 | 高 | LangSmith（付费）| ✅ base_url |
| **AutoGen/AG2** | 对话驱动，有免费 Studio | 中 | AutoGen Studio | ✅ base_url |
| **纯 Python** | 零依赖，手写调度 | 极低 | 无（自建）| ✅ 直接 requests |

**edict 三省六部场景推荐**：
- 最小改动：换 GLM 模型（GLM-4.5-air），保留 OpenClaw
- 中改动：用 AgentScope 替代（原生 GLM 支持，有可视化）
- 大改动：用 LangGraph（最强状态管理，但学习成本高）
