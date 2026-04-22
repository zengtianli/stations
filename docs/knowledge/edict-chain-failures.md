# edict 全链路失败分析

> 记录三省六部打通过程中所有失败点，便于复盘
> 更新：2026-03-24

---

## 目标链路

```
太子 → 中书省 → 门下省 → 尚书省 → 六部（bingbu/gongbu/...）
```

所有节点在 OpenClaw 仪表盘可见（standalone 模式）。

---

## 失败记录

### 失败 1：sessions_spawn 导致六部不可见

**现象**：尚书省调用六部时，六部 session 不在仪表盘显示（仪表盘只显示顶层 standalone session）

**根因**：尚书省用 `sessions_spawn` 调用六部，生成的 childSessionKey 是 `agent:bingbu:subagent:uuid`，OpenClaw 的 `deliver: false` 规则导致仪表盘不推送

**修复**：尚书省 SOUL.md 改为用 `npx openclaw agent --agent bingbu ...` 命令调用六部

---

### 失败 2：GLM-5-Turbo 无视 SOUL.md 文字禁令

**现象**：SOUL.md 明确写"禁止用 sessions_spawn 调用六部"，但 GLM-5-Turbo 仍然调用 sessions_spawn

**根因**：GLM-5-Turbo 是轻量快速模型，tool call 成功率低，指令遵循差，不适合做 agent 调度

**修复**：
1. `openclaw.json` 设置 `allowAgents: []` → sessions_spawn 工具从可用列表移除（不是报错，而是工具消失）
2. 将 zhongshu/shangshu 模型切换到 `zhipu/glm-4.5-air`（专为 agent 场景优化，工具调用成功率 90.6%）

---

### 失败 3：切换 glm-4.5-air 后 Canceled（lane wait exceeded）

**现象**：zhongshu 收到消息后返回 "Canceled" 而非实际回复

**根因**：之前残留了多个 openclaw 进程，session 队列锁死（lane wait exceeded timeout）

**修复**：
1. `pkill -9 -f openclaw` 杀死所有进程
2. 清空 session 文件：`echo '[]' > /root/.openclaw/agents/zhongshu/sessions/sessions.json`
3. 重启 gateway：`nohup npx openclaw gateway --port 18789 &`

---

### 失败 4：zhongshu 绕过尚书省直接调六部

**现象**：中书省有执行权限（bash/exec），且 SOUL.md 路由表里有六部 agent_id 列表，模型直接用 bash 调用 `npx openclaw agent --agent bingbu ...`，绕过了尚书省

**根因**：SOUL.md 的路由表本意是给尚书省用的，但 zhongshu 作为规划层也能看到这张表，加上模型有 exec 权限，就自作主张执行了

**修复尝试**：
- 在 SOUL.md 加禁令 "绝对禁止直接调用六部（bingbu/gongbu/libu/hubu/xingbu/libu_hr）" → ❌ 无效：铁律顺带把 agent id 教给了模型
- 改为 "绝对禁止直接调用任何六部 agent" → ❌ 仍然无效：模型从训练数据已知这些 agent

**最终修复**：
- `openclaw.json` 给 zhongshu 加 `tools.deny: ["exec"]`，完全移除 exec/bash 工具
- 启用 `agentToAgent: {enabled: true, allow: ["menxia", "shangshu"]}`，只能通过 `agent_send` 工具联系这两个 agent
- SOUL.md 里的"步骤 2/3"全改为 "使用 agent_send 工具发消息给 menxia/shangshu"，不再提 bash

---

### 失败 5：zhongshu 的 kanban_update.py 操作被误伤

**现象**：加了"中书省没有 bash 执行权限"规则后，模型无法执行 kanban_update.py，session 返回 Canceled

**根因**：限制了 exec 后，SOUL.md 里还留着 kanban_update.py 的 bash 命令示例，模型尝试运行失败，陷入死循环

**修复**：彻底删除 SOUL.md 里所有 kanban_update.py 和 bash 命令，中书省不做看板操作（看板由尚书省维护）

---

### 失败 6：gateway 重启 exit code 1

**现象**：执行 `nohup npx openclaw gateway --port 18789 &` 返回 exit code 1（但 gateway 实际已在运行）

**根因**：SSH 管道在 nohup 后台命令时可能误判退出码，实际进程已启动

**验证方法**：`pgrep -af openclaw` 确认进程存在即可，不要依赖 exit code

---

## 当前配置状态（2026-03-24）

| Agent | 模型 | allowAgents | exec | agentToAgent |
|-------|------|-------------|------|-------------|
| zhongshu | glm-4.5-air | [] (禁 sessions_spawn) | ❌ 已 deny | allow: menxia/shangshu |
| menxia | (默认) | [shangshu, zhongshu] | ✅ | 未启用 |
| shangshu | glm-4.5-air | [] (禁 sessions_spawn) | ✅ | 未启用 |
| 六部 | (默认) | (默认) | ✅ | 未启用 |

**zhongshu 强制链路逻辑**：
- 没有 exec → 无法自己运行 bash 命令
- 只有 agent_send → 只能联系 menxia 或 shangshu
- SOUL.md 流程：agent_send(menxia) → agent_send(shangshu) → 等待结果

---

## 待验证

- [ ] zhongshu → agent_send → menxia（准奏/封驳）
- [ ] zhongshu → agent_send → shangshu（执行令）
- [ ] shangshu → npx openclaw agent → 六部（仪表盘可见）
- [ ] 六部 session 在仪表盘正常显示
