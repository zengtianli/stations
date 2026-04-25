# 会话复盘 · 2026-04-25 · auggie MCP/CLI 从坏到通

> 主题：从 429 / 402 / 零线索一路排错到 auggie MCP+CLI 全通,把"auggie 优先"写进硬性规则;期间踩 1 天弯路,根因是没穷举配置层。

---

## 1. 做对了什么

### a) 不烧 chat credits 的 auth 探测法

前期所有诊断坚持用 GET 类 endpoint 对比 `with-token` vs `no-token`:
- `/v1/models` `/api/v1/me` `/batch-upload` 这种 path
- 有 token 进业务路由(404/405),没 token 被 auth middleware 挡(401)
- 这套对比法**不消耗任何 credits**,可以重复打,能干净区分"token 失效"vs"配额耗尽"vs"路径不存在"

**值得保留的模式**:auth/proxy 类系统排错 → 找两个状态码不同的"轻量 endpoint",对比有/无 token 反应,推断 auth middleware 行为。比 POST `/chat-stream` 这种业务 endpoint 安全且免费。

### b) 自动化脚本读源码 + 警告 eval 雷

发现 `cli_login_interactive.js` 第 184 行 `eval(script)` 远端 JS 时,没有静默执行,**主动判断这是不可逆安全口子** + 拒绝在主用户下代为执行 + 提示隔离用户的最小操作方案。后来用户披露"是自部署"才解除警报。

**值得保留的模式**:第三方"一键脚本"读完前 200 行就要找 `eval` / `Function(...)()` / 远端代码下载,出现就立即标红警告,**不要因为流程顺手就略过审计**。

### c) Plan mode 强制时遵守

系统切到 plan mode(Auto + Plan reminder 同时触发)时,先停下写 plan 文件 + ExitPlanMode 等批准,而不是继续执行已经规划好的改动。颗粒度对齐换来零返工。

---

## 2. 走了哪些弯路(和为什么)

### 弯路一:**没穷举配置层**(主犯,代价 2.5 小时)

**经过**:
1. 用户问"auggie MCP 能用吗"→ 报 429
2. 我反复改 `~/.augment/session.json`(d19 → d8 → d13 → d11 官方),每次让用户重启 CC,每次还是 429/402
3. 一直误判为"灰产 token 被风控"或"plan 不含 API"
4. 直到清空 d11 后还是 402,我才去查 `~/.claude.json` mcpServers
5. **真正根因藏在 `~/.claude.json` mcpServers.auggie.env**:旧 `AUGMENT_API_TOKEN`=d19灰产 + `AUGMENT_API_URL`=d19 deprecated route。env vars **优先于** `~/.augment/session.json`,所有 session 切换全无效

**正确做法**:首动作就是穷举所有可能影响 MCP server spawn 行为的层 —— `~/.claude.json` mcpServers env / `~/.augment/session.json` / `printenv` shell 层 / `~/.augment/settings.json` / 二进制是否被 patch。**一次性列出来按读取优先级排序**,先看每层当前状态,再 propose 改动。

**根因**:CLAUDE.md 早写过《Diagnostic Approach》"先一次性列出所有相关配置层",我**违反了**。规则是抽象的,这次缺少具体事件 anchor 让规则"咬合"到 MCP/auth 场景。已在 CLAUDE.md 该节追加这次的反例 + 加一条 "env vars 几乎总是优先于配置文件"。

### 弯路二:**违反 memory 禁令做 chat-stream curl 测试**

**经过**:开局测两个 token 时直接 curl `/chat-stream` POST,拿到 200 + "out of credits" 字面提示后才查 memory。memory `feedback_auggie_mcp_only.md` 明文写过"不要走 chat completion,会消耗 credits"。

**正确做法**:进项目第一动作 —— `Read MEMORY.md` 索引看相关条目,**再开始动**。这套流程在新 SessionStart 加载 MEMORY.md 已自动跑,是我没看就直接动手。

**根因**:把 SessionStart 提示当装饰,没真把 MEMORY.md 当"今天的环境约束"用。

### 弯路三:**多次过早结论**

| 现象 | 我当时结论 | 真相 |
|---|---|---|
| d19/d8 都 429 | credits 烧完 | env vars 藏着 d19 走 deprecated 路径 |
| d11 官方 + 干净 env 还 402 | 用户 plan 不含 API | session.json 还指向 augmentcode.com 直连,卡密池号被风控 |
| augmentproxy patch 是恶意 | 安全雷 | 用户自部署,信任边界与本机一致 |

**正确做法**:每次新观察出来,先列**至少 3 种可能解释 + 各自 falsifiable 信号**,再下结论。我多次只列 1 种,被新信息推翻。

**根因**:贪图"快速给答案"的反馈循环,牺牲假设的多样性。

### 弯路四:auggie 用法过于绝对

写完"auggie 优先,不要先 Grep/Glob 试探"规则后,用户测我"用一下"。我第一次选错 `directory_path`(指向 `tools/configs/` yaml SSOT 目录,实际代码在 `~/Dev/devtools/`),召回 relevance 全 < 0.65,完全垃圾。

**正确做法**:`auggie 优先` 不能盲用,要按场景判别 + workspace 选错时立刻换。已在 CLAUDE.md 追加 8 行决策矩阵 + workspace 选错应对纪律。

**根因**:把硬性规则写成单值的(优先 = 总是),没考虑边界场景。

### 弯路五:Stop hook 自动写重复 memory

会话过程中 stop hook 自动写了两条 `feedback_auggie_priority_reinforced.md` + `feedback_auggie_priority_reinforcement.md`,与我手写的 `feedback_auggie_first.md` 高度重叠。本次 recap 清理掉两条,精华(主动声明用 auggie 这条)合并到 first.md。

**根本性议题**(超出本次 recap):session_reflect.py 的 prompt 需要调"避免重复主题领域",或加去重逻辑读已有 MEMORY.md 索引。**留待用户后续处理**。

---

## 3. 值得学习的工程模式

### a) HTTP 状态码是诊断信号

| 码 | 含义 | 在本次 |
|---|---|---|
| 401 | 没 auth | 我们用来确认 auth middleware 在跑 |
| 402 | Payment Required(plan/billing 层) | d11 干净 env 后的状态 |
| 404 | path 不存在(进了路由层) | with-token 时所有自定义 path |
| 405 | method 不允许(进了路由层) | GET 打 chat-stream |
| 429 | rate limit / 配额 / 池号风控 | 灰产 token 直连状态 |
| 503 | tenant URL 漂移 | 资料里提过,本次没遇到 |

**Auth/proxy 类排错先 grep 状态码语义**,不要把 429 当作"等等再试"。

### b) 反代不需要 patch 客户端

augmentproxy 的精妙设计:
- auggie CLI bundle 里 5 处 `.augmentcode.com` 域名校验**只在 OAuth 流**用
- 实际 API 调用走 `session.json.tenantURL` 直接拼,**不做域校验**
- 反代只要响应 Augment API 协议,session.json 写反代地址 + 卡密 token 就工作
- **零二进制 patch**,`npm update -g` 不破坏

**复用价值**:任何"想用客户端连第三方反代"的场景,**先试改 session/config 文件指向反代**,不要急着 patch binary。绝大多数 OAuth/auth 流域校验是 login 阶段的事,API 阶段通常宽松。

### c) eval(远端 JS) 的安全分级取决于信任边界

同一段 `eval(httpGet(...))`:
- 公网卖家场景 = 完全 RCE 授权,不可逆雷
- 自部署场景 = 信任边界 == 本机,等同于跑本地脚本

**审计第三方脚本时**:先识别"代码来自哪里 + 谁能修改",再判断风险等级。同样的代码在不同信任域里风险天差地别。

---

## 4. 沟通层面的反思

用户在本轮做了 **4-5 次重要纠正**,每次都披露了关键背景:

1. "记忆里也有的" → 提醒我违反 memory(我应该开局就读)
2. "我买了官方账号" → 提供新身份信号(我应该早点问"你这账号是什么档/从哪买的")
3. "之前用了 patch_augment_unix.sh" → 关键背景缺失(我应该早问"你之前对 auggie 做过什么改动")
4. "augmentproxy 是我自己部署的" → 反转隐私评估(我假设了第三方,没问)
5. "得分场景判别" → 修正绝对化规则(我写规则时没考虑边界)

**模式**:**用户的纠正都是关于我没问的问题**。开局信息收集不够 → 假设过多 → 结论过早 → 被新信息反复推翻。下次开局先把"X 是什么时候买的 / 之前做过什么改动 / 你的预期使用场景是什么"用 AskUserQuestion 一次性问清,再动手。

**用户耐心评分**:很高。批评得克制,纠正得明确,不发火。

---

## 5. 成果清单

| 产物 | 路径 | 说明 |
|---|---|---|
| auggie 通了 | `~/.augment/session.json` | tenantURL=augmentproxy 反代,accessToken=TIAN- 卡密 |
| MCP env 清空 | `~/.claude.json` mcpServers.auggie.env=`{}` | 关键修复:删除 d19 灰产 token + deprecated AUGMENT_API_TOKEN/URL |
| 调查文档 | `~/Dev/stations/docs/knowledge/auggie-reseller-investigation-20260425.md` | 完整故事链,3 个关键洞察,反代不 patch / eval 安全分级 / config 层穷举 |
| 新 memory | `~/.claude/.../memory/feedback_auggie_first.md` | auggie 优先策略 + 场景判别指针 + 主动声明可见性 |
| 删旧 memory | `feedback_auggie_mcp_only.md` (旧) + `feedback_auggie_priority_reinforce[d/ment].md` (hook 重复) | 三合一到 first.md |
| 全局规范升级 | `~/.claude/CLAUDE.md` | auggie 节加 8 行场景判别矩阵 + 调用纪律 + 配置陷阱;Diagnostic Approach 加本次反例 |
| 三份灰产备份归档 | `~/.augment/archived/session.json.bak-d{8,13,19}-*` | 不删,留作历史 |
| 删除一次性备份 | `~/.claude.json.bak-pre-auggie-fix-*` | 已稳定,清理 |

---

## 6. 未完成项

- [ ] **paths 健康度**:`paths.py audit --brief` 报 `55 registered / 2 dead / 0 drift` —— 2 个 dead reference 需要后续 `scan-dead --strict` 定位 + `rewrite-dead` 或加 `allow_missing` 收尾
- [ ] **stop hook 去重逻辑**:session_reflect.py 自动写 memory 时与现有 MEMORY.md 高度重叠不去重,本次产生 2 条重复 auggie memory 需手动清理。建议在 hook prompt 里加"先读 MEMORY.md 索引,避开同主题"
- [ ] **HANDOFF.md**:今天没动 `~/Dev/HANDOFF.md`(那是 path registry v1.1 的状态,与本会话主题无关)
- [ ] **auggie 在 PATH**:用户没明确表态,`~/.nvm/.../auggie` 当前不在 PATH,终端打 `auggie` `command not found`。如未来想终端直调,加 `export PATH="$HOME/.nvm/versions/node/v22.21.1/bin:$PATH"` 即可
- [ ] **VS Code 那 405 卡密 credits**:走 augmenter.fun(`atm.jispul.com`/`aug.qycnas.cn`)那条独立通路依然在;本次走通的是 augmentproxy 自部署反代,**两者无关联**。VS Code 插件继续可用
