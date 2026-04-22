# 智谱 GLM-5 接入 OpenClaw 配置手册

更新日期：2026-03-23

## GLM-5 API 基本信息

| 字段 | 值 |
|------|-----|
| 模型名 | `glm-5` |
| Base URL | `https://open.bigmodel.cn/api/paas/v4` |
| API Key | `2508f4c4f5ba403f9de8ba80103a3fc0.1QyV5o68gKxjA5o9` |
| API 格式 | OpenAI 兼容（`openai-completions`） |
| 协议 | Bearer Token |

### 快速验证

```python
import urllib.request, json

API_KEY = "2508f4c4f5ba403f9de8ba80103a3fc0.1QyV5o68gKxjA5o9"
URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

payload = {"model": "glm-5", "messages": [{"role": "user", "content": "你好"}]}
req = urllib.request.Request(
    URL,
    data=json.dumps(payload).encode(),
    headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
)
with urllib.request.urlopen(req, timeout=15) as resp:
    print(json.loads(resp.read())["choices"][0]["message"]["content"])
```

---

## OpenClaw 接入配置

### 配置文件位置（三处，必须全部更新）

| 文件 | 作用 |
|------|------|
| `~/.openclaw/openclaw.json` | 全局 provider + 默认模型 |
| `~/.openclaw/agents/taizi/agent/auth-profiles.json` | taizi agent 的 key |
| `~/.openclaw/agents/taizi/agent/models.json` | taizi agent 的 provider |

### 1. openclaw.json 改动

在 `auth.profiles` 添加：
```json
"zhipu:default": {
    "provider": "zhipu",
    "mode": "api_key"
}
```

在 `models.providers` 添加：
```json
"zhipu": {
    "baseUrl": "https://open.bigmodel.cn/api/paas/v4",
    "apiKey": "2508f4c4f5ba403f9de8ba80103a3fc0.1QyV5o68gKxjA5o9",
    "auth": "api-key",
    "api": "openai-completions",
    "headers": {},
    "authHeader": true,
    "models": [
        {
            "id": "glm-5",
            "name": "GLM-5",
            "api": "openai-completions",
            "reasoning": false,
            "input": ["text"],
            "cost": {"input": 0, "output": 0},
            "contextWindow": 128000,
            "maxTokens": 4096,
            "compat": {
                "supportsStore": false,
                "supportsDeveloperRole": false,
                "supportsReasoningEffort": false
            }
        }
    ]
}
```

`agents.defaults.model.primary` 改为：
```json
"zhipu/glm-5"
```

`agents.defaults.models` 添加：
```json
"zhipu/glm-5": { "alias": "glm5" }
```

### 2. auth-profiles.json 改动

在 `profiles` 添加：
```json
"zhipu:default": {
    "type": "api_key",
    "provider": "zhipu",
    "key": "2508f4c4f5ba403f9de8ba80103a3fc0.1QyV5o68gKxjA5o9"
}
```

### 3. models.json 改动

添加与 openclaw.json 相同的 `zhipu` provider 块。

---

## 注意事项

- GLM-5 不支持 `anthropic-messages` 格式，必须用 `openai-completions`
- openclaw 支持的 api 类型：`anthropic-messages` / `openai-completions` / `gemini` / `bedrock`
- 修改后需重启 openclaw-gateway：`systemctl --user restart openclaw-gateway`
- 如果出现空回复，检查 `supportsStore: false`（GLM 不支持 system prompt cache store）

---

## 回滚方法

```bash
# VPS 上执行
cp ~/.openclaw/openclaw.json.bak ~/.openclaw/openclaw.json
systemctl --user restart openclaw-gateway
```
