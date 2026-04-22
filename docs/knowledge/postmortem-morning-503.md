# 复盘：/morning 503 排障记录

**时间**：2026-03-23  
**总耗时**：约 2 小时  
**症状**：飞书发 `/morning`，taizi 回复 `HTTP 503: api_error: No available accounts`

---

## 根因全景

```
飞书 /morning
  └── taizi (openclaw-gateway)
        ├── ❌ 问题1：旧 API key（已废弃）
        ├── ❌ 问题2：模型名不对（haiku 在该 key 下无账户）
        ├── ❌ 问题3：openclaw 三层配置只改了两层（漏 models.json）
        ├── ❌ 问题4：SOUL.md 没有 /morning 路由规则（workspace ≠ edict）
        └── ❌ 问题5：SOUL.md 改后不热重载，需重启 gateway
```

---

## 踩坑详情

### 坑1：错误判断根因

**现象**：`No available accounts: no available accounts`  
**我的判断**：key 余额耗尽  
**实际原因**：模型名 `claude-haiku-4-5-20251001` 在该 key 的套餐下没有配置，proxy 找不到对应账户

**教训**：`No available accounts` ≠ 余额耗尽。它的意思是"这个模型在 relay 池里没有可用账户"，通常是模型名错了或 key 套餐不包含该模型。应该先用 `/v1/models` 接口查可用模型列表，再对症下药。

---

### 坑2：没有从飞书端测试

**我做了什么**：用 `curl -X POST http://localhost:9002` 打 feishu-commands 端口，看到"已发送 ✅"就以为好了。  
**实际情况**：这只测了链路的后半段（feishu-commands → morning_briefing.py），完全跳过了前半段（飞书 → openclaw → taizi → feishu-commands）。

**教训**：端到端测试必须从入口（飞书）开始，不能只测中间某一层。用 Feishu API 模拟用户发消息也不行——bot 给用户发消息和用户给 bot 发消息是两个方向，只有后者才触发 openclaw 的 agent。

---

### 坑3：openclaw 有三层 API key 配置

以为改一个地方就够了。实际上 openclaw 的 key 存在三处：

| 文件 | 作用 | 是否热重载 |
|------|------|-----------|
| `~/.openclaw/openclaw.json` | 全局默认 | ✅ 热重载 |
| `agents/*/agent/auth-profiles.json` | 每个 agent 的认证 | ✅ 热重载 |
| `agents/*/agent/models.json` | 每个 agent 的模型+key | ✅ 热重载 |

我更新了前两层，漏掉了 `models.json`。而 openclaw 实际用的 key 是 `models.json` 里的，导致改了半天 key 还是走旧的。

**解决**：用 Python 批量更新所有 12 个 agent 的 `models.json`。

---

### 坑4：SOUL.md 的 workspace 版本和 edict 仓库不同步

openclaw 运行时加载的是 `/root/.openclaw/workspace-taizi/SOUL.md`，不是 `/opt/edict/agents/taizi/SOUL.md`。

- edict 仓库里的 SOUL.md：有铁律"收到 `/` 开头的消息立即 curl feishu-commands"
- workspace 里的 SOUL.md：老版本，没有这条规则，taizi 把 `/morning` 当闲聊回"早安"

**解决**：`cp /opt/edict/agents/taizi/SOUL.md /root/.openclaw/workspace-taizi/SOUL.md`

**预防**：edict 有 sync_agent_config.py 脚本负责同步，后续每次改完 edict 里的 SOUL.md 要确认 sync 有没有跑。

---

### 坑5：SOUL.md 改后不热重载

改了 `workspace-taizi/SOUL.md` 之后，发现 taizi 还是回"早安"。  
**原因**：openclaw-gateway 对 `openclaw.json` 和 `models.json` 支持热重载，但 SOUL.md 不在热重载范围内，必须重启进程。

```bash
kill $(ps aux | grep openclaw-gateway | grep -v grep | awk '{print $2}')
# 进程会自动重启
```

---

## 正确的排障流程

```
1. 飞书报错 → 先看 /tmp/openclaw/openclaw-*.log，确认是哪一层报错
2. openclaw 层 503 → 查 models.json 里的 key 和模型名
3. 用新 key 先调 /v1/models 看可用模型列表，确认模型名
4. taizi 回复不对（没走 curl）→ 看 workspace-taizi/SOUL.md，和 edict 比对
5. 改完配置 → 判断是否需要重启 gateway（SOUL 改动必须重启）
6. 最终验证 → 从飞书真实发消息，看 openclaw 日志的 dispatch + feishu-commands journal
```

---

## 关键命令速查

```bash
# 查 openclaw 实时日志
tail -f /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log | python3 -c "
import sys,json
for l in sys.stdin:
    try: d=json.loads(l); print(d.get('time','')[11:19], d.get('1','')[:120])
    except: pass
"

# 批量更新所有 agent 的 models.json key
python3 -c "
import json,glob
NEW='sk-xxx'
for p in glob.glob('/root/.openclaw/agents/*/agent/models.json'):
    d=json.load(open(p))
    for v in d.get('providers',{}).values():
        if v.get('apiKey'): v['apiKey']=NEW
    json.dump(d,open(p,'w'),indent=2)
    print('updated',p)
"

# 同步 edict SOUL.md 到 workspace
cp /opt/edict/agents/taizi/SOUL.md /root/.openclaw/workspace-taizi/SOUL.md

# 重启 openclaw-gateway
kill $(ps aux | grep openclaw-gateway | grep -v grep | awk '{print $2}')

# 验证 key + 模型可用性
curl -s -X POST https://code.mmkg.cloud/v1/models \
  -H "x-api-key: $KEY" -H "anthropic-version: 2023-06-01"
```

---

## 最终修复清单

| 修改项 | 位置 | 说明 |
|--------|------|------|
| API key 换新 | `/root/.env` | 环境变量化，feishu-commands 服务读取 |
| 模型名修正 | 三个 `.py` 脚本 | `haiku` → `claude-sonnet-4-5` |
| openclaw key 更新 | 12个 `models.json` + `auth-profiles.json` + `openclaw.json` | 全部换新 key |
| SOUL.md 同步 | `workspace-taizi/SOUL.md` | 从 edict 仓库覆盖 |
| gateway 重启 | 进程 kill | 让新 SOUL.md 生效 |
