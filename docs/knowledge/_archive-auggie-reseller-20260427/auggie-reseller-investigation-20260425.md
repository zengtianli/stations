# Auggie / Augment 灰产中转调查 (2026-04-25)

## 起因

`mcp__auggie__codebase-retrieval` 突然失效,所有调用返 `429 Too Many Requests`。
本来记忆里 `d19 / d8` 4 天前还能用,怀疑被卖家做手脚(此前和卖家有冲突)。
经过排查,主因不是封号,而是**直连 `*.api.augmentcode.com` 这条路被 Augment 风控了**;真正可用的接法可能是走卖家反代。

## 三个 token 现状

| Tenant | Account 邮箱 | Auth | MCP retrieval |
|---|---|---|---|
| `d19.api.augmentcode.com` | `fvbcfg656@zohomail.cn` | ✅ 通过 | ❌ 429 |
| `d8.api.augmentcode.com`  | `fgdfrhrt54@zohomail.cn` | ✅ 通过 | ❌ 429 |
| `d13.api.augmentcode.com` | (atm.jispul.com 新发) | ✅ 通过 | ❌ 429 |

诊断方法(**不耗 credits**):同一 path 比较 with-token vs no-token

```
/v1/models    with=404, no=401
/api/v1/me    with=404, no=401
/batch-upload with=405, no=401
/chat-stream  with=405, no=401
```

with-token 进业务路由(404/405),no-token 被 auth 层挡(401) → **token 全活,账号未封**。

## 卖家广告 vs 实测真相

卖家宣传(`aug.qycnas.cn` / `atm.jispul.com` 同一伙):

> 新注册账号 0 额度,永不过期!可用来 ACE MCP / Augment 中转
> 提供 access-token + tenant_url

技术主张 vs 实际:

| 卖家主张 | 实际 |
|---|---|
| MCP 不消耗 credits | ❌ 误导。官方 docs 写 MCP 检索每次 40-70 credits,2025-10-20 起统一 credit 池,无独立免费额度 |
| 0 额度账号能用 ACE | ⚠️ 半真。靠 free trial 余量,烧完即停 |
| `~/.augment/session.json` 写他们给的 tenant_url + access_token 就行 | ❌ 我们 3 个 tenant 全部直连 429 |

## 假设:Augment 在直连路径做了池号风控

所有从 atm.jispul.com 拿出来的 token,直连 `d*.api.augmentcode.com` **立即** 429 —— 新发 token 不该零余额,更像是被识别为灰产池号后只允许通过卖家自己的反代进来。

证据链:
- 三个不同 tenant、不同邮箱、不同时间段拿到的新 token,**症状完全一致**
- Auth middleware 通过(token 不是被 revoke)
- `/chat-stream` POST 仍能 200,返"out of credits"+真实邮箱(说明账号实体存在)
- 卖家给的 IDEA 插件用 `-javaagent:augment-agent-1.0.5-bugment.jar` 字节码改写,八成是把原插件硬编码的 `*.api.augmentcode.com` 替换成 `aug.qycnas.cn`

如果假设成立 → **正确接法不是写 `*.api.augmentcode.com`,而是反代 `https://aug.qycnas.cn/`**(或镜像 `xg.qycnas.cn` / `jispul.com`)。

## 待验证:静态拆 vsix 拿真实 base URL

用户考虑装 VS Code 摸索。**不用真装**:

```bash
# 拆 .vsix（本质是 zip）
mkdir -p /tmp/aug-vsix && cd /tmp/aug-vsix
unzip <卖家给的>.vsix
# 抓硬编码 URL
rg -o 'https?://[^"'"'"' ]+' extension/ | sort -u
rg -i '(base.*url|tenant|endpoint|auth.*token|api\.augment|qycnas)' extension/

# 拆 IDEA agent jar
unzip -d /tmp/aug-jar augment-agent-1.0.5-bugment.jar
strings /tmp/aug-jar/**/*.class | rg 'https?://|augment|qycnas'
```

如果静态拆只拿到 base URL 没 token,装完看运行时:

```bash
# VS Code 插件状态
ls ~/Library/Application\ Support/Code/User/globalStorage/ | rg -i augment
sqlite3 ~/Library/Application\ Support/Code/User/globalStorage/<id>/state.vscdb \
  "SELECT * FROM ItemTable WHERE key LIKE '%token%' OR key LIKE '%tenant%'"

# Keychain
security dump-keychain -d ~/Library/Keychains/login.keychain-db | rg -i -A2 augment
```

最终配回:

```json
// ~/.augment/session.json
{
  "accessToken": "<拆出来>",
  "tenantURL": "<https://aug.qycnas.cn/ 或镜像>",
  "scopes": ["email"]
}
```

抓包兜底用 `mitmproxy`(贵,A/B 都失效再用)。

## 余额查询入口

| 维度 | 入口 |
|---|---|
| sk-key 卖家面板 | `https://api.jispul.com`(资料原文)用买的 sk- 登录看消费 |
| Augment 官方 dashboard | `https://app.augmentcode.com/account/subscription` —— 但池号没邮箱密码,**走不通** |
| CLI 探测 | 有 memory 禁令,reason 是"0 credit + CLI 烧 credit",但 d13 据说有 10 刀,场景不同;需要用户明确批准 |

## 安全/隐私底线(**不重复评估,直接执行**)

走第三方反代 / 池号 = 卖家方能看到:
- prompt 全文 + 文件内容 + tool result
- 经过 prompt 的任何 secret(`~/.personal_env`)
- 会话历史(包括 token 字面值)

承担成本如下:
- ✅ Claude 走官方订阅,**永不**改 `ANTHROPIC_BASE_URL` / 装 CC Switch
- ✅ Augment 这条只在隔离任务用,主路径 fallback 用 Grep / Glob / Explore subagent
- ❌ 不要把 sk-key 写进 `~/.zshrc` / 任何 shell rc(只在 atm.jispul.com 浏览器登录用)
- ❌ 不要 ANTHROPIC_AUTH_TOKEN 设成 sk- 形式

## 决策树(下次会话从这里继续)

```
卖家给的 vsix 文件到手了吗?
├─ 是 → 静态拆 vsix（路径 A）
│    └─ 拿到 base URL?
│         ├─ 拿到 + token → 写 session.json 重启测 MCP
│         ├─ 只拿到 base URL → 装插件看 globalStorage/Keychain（路径 B）
│         └─ 拿不到 → mitmproxy（路径 C）
│
└─ 否 → 找卖家要 vsix 链接;或先在 api.jispul.com 查 sk-key 余额状态
```

## 后续:走通了(同日下午,自部署反代方案)

下午用户披露关键信息:除了灰产卡密外,**还有自部署的 Augment 反代** `https://www.augmentproxy.com`。隐私不是问题(自己的服务器),只剩工程问题。

### 最终走通的链路

```
Claude Code MCP / 终端 auggie CLI
     ↓ 共用 augment.mjs binary + ~/.augment/session.json
     ↓
~/.augment/session.json
{
  "accessToken": "TIAN-92A4...",                    ← 卡密本身就是 token
  "tenantURL": "https://www.augmentproxy.com/tenant-proxy/",
  "scopes": ["email"]
}
     ↓
augmentproxy 反代 → 池化 Augment 后端 → ACE 返回结果
```

### 三个关键洞察

**1. 反代不需要 patch CLI bundle** —— `.augmentcode.com` 的 5 处域名检查只用在 `auggie login` OAuth 流(域校验 OAuth tenant URL)。实际 API 调用走 `session.json.tenantURL` 直接拼,**不做域校验**。所以反代只要响应 Augment API 协议,原版 CLI 看不出区别。

`patch_augment_unix.sh` 那种 sed 改 extension.js 是给 VS Code 插件用的(需要它接受非官方 OAuth URL);**CLI 不需要 patch**。`npm update -g @augmentcode/auggie` 不会破坏这套接法。

**2. 登录脚本 `cli_login_interactive.js` 的 `eval(远端 JS)` 是设计选择**

```js
// 第 184 行
client.get(`/cli/login.js?card_key=...&node_id=...`, (res) => {
    let script = '';
    res.on('data', (chunk) => script += chunk);
    res.on('end', () => {
        eval(script);  // ← 服务器返回什么 JS 就执行什么
    });
});
```

公网卖家场景下这是**完全的远程代码执行授权**(读 ~/.ssh / 写 ~/.zshrc / 任意 rm -rf 都可以),不可审计(每次返回 script 内容可不同)。**自部署场景下**,因为服务器是自己的,信任边界与本机一致,不构成新风险。

**3. 之前 d11 官方号 + 灰产 token 反复 429/402 的真正根因**

`~/.claude.json` 里 auggie MCP server config 长期藏着 deprecated env vars:

```json
"env": {
  "AUGMENT_API_TOKEN": "45fa80fd...(d19 灰产 token)",
  "AUGMENT_API_URL": "https://d19.api.augmentcode.com/"
}
```

这两条优先级**高于** session.json,导致无论怎么改 session.json,MCP server 起来都是用 d19 灰产 + deprecated auth → Augment 后端 429。**修复就是删空 `env: {}`**。这个根因花了 1 天才发现,因为它"不在你以为它会在的地方"。

### 验证证据

```
$ auggie -p -a -q "List paths.py CLI subcommands" -w ~/Dev/devtools
resolve, list, build-const, audit, scan-dead, rewrite-dead

mcp__auggie__codebase-retrieval (~/Dev/devtools, "List subcommands of paths.py")
→ 15 个真实代码段返回,延迟正常
```

CLI 和 MCP 入口都通,共用 binary + session.json + 反代,**ACE 检索完整链路成立**。

## 复盘 · 真正应该早做的事

排错走了 1 天弯路,根因都是**没把"配置层"全列出来**。早做这两件事能省半天:

1. **进场就一次性列出所有相关配置层** —— `~/.augment/session.json` + `~/.claude.json` mcpServers + `~/.zshrc` env vars + `~/.augment/settings.json` + 本地 binary 状态(原版/打过 patch)。哪一层覆盖哪一层(env > session > defaults)写明白
2. **Augment 状态码语义早搞清** —— 401/402/404/405/429/503 各自含义,deprecated auth 的特征(429),plan 限制的特征(402),路径不存在(404)。这能让"d11 官方 + 干净 env 还是 402"这种异常立刻定位

CLAUDE.md 里早就写过《Diagnostic Approach》:"先一次性列出所有相关配置层,再提修复方案;不允许「发现一层 → 修一层 → 发现下一层」串行模式"。这次违反了,所以付了时间。

## 当前最终状态

- `~/.augment/session.json` → augmentproxy 反代 + 卡密直接做 accessToken（前缀随批次变 `TIAN-` / `MON-` ...）
- `~/.augment/archived/session.json.bak-d{8,13,19}-*` → 三份灰产历史归档
- `~/.claude.json` mcpServers.auggie.env → `{}`(原藏的 d19 灰产 + deprecated auth 已清)
- `auggie` CLI binary → 原版未改

## 相关文件

- `~/.augment/session.json` —— 当前 augmentproxy 反代
- `~/.augment/archived/` —— 三份灰产 session 历史归档
- `~/.claude.json` mcpServers.auggie —— env 已清空,会读 session.json
- `~/Dev/CLAUDE.md` —— 全局 auggie 使用规范

## 2026-04-27 后续：重新登录走 augmentproxy 官方交互脚本

旧 d11 卡密 token 用尽，换新卡密 `MON-AF731A659BD42E00C60B42DDE27A8FE0`（55000 credits, status=active）。

这次不再手写 session.json，改用 augmentproxy 自家的交互登录脚本（macOS 适配）：

```bash
curl -sL "https://www.augmentproxy.com/cli_login_interactive.js" -o /tmp/l.js \
  && node /tmp/l.js \
  && rm /tmp/l.js
```

脚本会：
1. 验证卡密 + 显示余额/状态
2. 列出当前可用代理节点（带延迟）让你选
3. 写入 `~/.augment/session.json`（卡密直接当 accessToken，tenantURL=`https://www.augmentproxy.com/tenant-proxy/`）

**比手写 JSON 强的地方**：
- 自动选节点（这次有两个：augmentproxy.com 和 augmentproxy.top，11ms vs 8ms）
- 即时余额可见，避免拿过期卡密反复试错
- 卡密前缀变化（这批是 `MON-`，旧批 `TIAN-`）由脚本兼容，文档不用反复追

**核对项**（每次换卡密后必做）：
- `cat ~/.augment/session.json` → tenantURL 末尾带斜杠、accessToken 是新卡密
- `jq '.mcpServers.auggie.env' ~/.claude.json` → 仍是 `{}`（不能因换卡密而引入 env vars）
- `auggie -p -a -q "..." -w ~/Dev/devtools` smoke 一次确认能召回
- MCP 那边要等下次 CC 重启才会读新 session（spawn 时只读一次）

**install.md / troubleshooting.md 同步更新**：卡密前缀描述改成"批次可变"，install.md §2 推荐交互脚本为首选路径，手写 JSON 降级为 fallback。
