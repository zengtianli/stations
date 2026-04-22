# Edict 迁移 GLM 踩坑复盘（2026-03-24）

## 背景

Claude 中转站（code.mmkg.cloud）挂掉，发现 OpenClaw 已提前切换到 GLM，趁机做了完整清理和多 Agent 全链路验证。

---

## 坑一：GLM reasoning 模式吃空 token

**现象**：`max_tokens: 100` 时，`content` 字段为空，`reasoning_content` 有内容。
**根因**：GLM 的 reasoning 模式先消耗 token 做思考，token 不够时 content 来不及生成就截断了。
**解决**：max_tokens 必须 >= 1000，推荐 4096+。
**验证**：`max_tokens: 1000` 后 content 正常返回。

---

## 坑二：kanban_update.py 路径 bug

**现象**：任务创建成功（有 JJC 编号、有流转记录），但 `/opt/edict/data/tasks_source.json` 里看不到，看板显示为空。
**根因**：`kanban_update.py` 第 27 行用相对路径计算数据目录：

```python
# 有 bug
_BASE = pathlib.Path(__file__).resolve().parent.parent
```

`sync_agent_config.py` 会把脚本复制到各 agent workspace（如 `/root/.openclaw/workspace-taizi/scripts/`），此时 `__file__` 解析为 workspace 副本路径，`parent.parent` 变成 `/root/.openclaw/workspace-taizi`，任务写入了错误目录。

**修复**：硬编码为绝对路径：

```python
# 修复后
_BASE = pathlib.Path("/opt/edict")
```

**附带问题**：历史上 6 条 JJC 任务（2026-03-10 至 2026-03-23）都写到了 `workspace-taizi/data/`，需要手动合并回 `/opt/edict/data/tasks_source.json`。
**已处理**：合并完成，7 条历史任务全部恢复。

---

## 坑三：main agent 是遗留目录，不是真实 agent

**现象**：`~/.openclaw/agents/main/` 目录存在，但 `openclaw agents list` 里没有 main。
**根因**：edict 早期版本 agent 叫 `main`，后来改名为 `taizi`，目录没删。
**处理**：不需要处理，不影响运行，知道是遗留物即可。

---

## 坑四：中转站挂了但系统已自动切换

**现象**：以为系统挂了，实际上 OpenClaw 早在上次会话时已把默认模型切为 `zhipu/GLM-5-Turbo`，Claude relay 挂了并不影响。
**教训**：出现"飞书没有响应"时，先查 gateway 日志确认是否真挂，不要假设是模型问题。

```bash
systemctl --user status openclaw-gateway --no-pager -l | tail -20
```

---

## 验证结果

| 验证项 | 结果 |
|--------|------|
| 11 个 agent 全部 GLM 响应 | ✅ |
| 全链路端到端（40s 完成） | ✅ |
| kanban 持久化修复后新任务写入 | ✅ JJC-20260324-002 |
| 历史任务恢复 | ✅ 6 条 |

---

## 当前架构（稳定状态）

```
飞书 → OpenClaw Gateway (:18789)
           ↓
        太子 (GLM-5-Turbo)  ← 分拣旨意
           ↓
        中书省 (glm-4.5-air) ← 规划
           ↓ (并行)
        门下省 (GLM-5-Turbo) ← 审议
        尚书省 (glm-4.5-air) ← 执行/派发
           ↓
        六部 (GLM-5-Turbo) ← 执行
```

**Provider**：zhipu（aiproxy.xin/cosphere/v1）
**已清理**：anthropic/code.mmkg.cloud 相关配置全部删除（12 个 agent 的 auth-profiles.json 和 models.json）
