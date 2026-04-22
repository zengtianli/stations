# hydro-toolkit — 水利工具集 Host Shell

## Quick Reference

| 项目 | 路径/值 |
|------|---------|
| 入口 | `api.py` (FastAPI，`tlz-api@hydro-toolkit.service` 拉起) |
| 前端 | `~/Dev/web-stack/apps/hydro-toolkit-web/` (React + @tlz/ui) |
| 插件目录 | `plugins/` (各 `hydro-xxx/` 子目录) |
| 插件注册 | `plugins.json` + 每个插件的 `plugin.yaml` |
| 插件加载 | `core/plugin_loader.py` |
| 生产 URL | https://hydro.tianlizeng.cloud |
| 部署路径 | VPS `/var/www/hydro-toolkit/` |
| API 端口 | 8610（站点端口 8510 + 100） |

## 常用命令

```bash
cd /Users/tianli/Dev/hydro-toolkit

# 本地起 FastAPI
uv run uvicorn api:app --host 127.0.0.1 --port 8610

# 本地烟测（自动起停 + 健康检查 + /api/plugins 验证）
bash ~/Dev/devtools/scripts/api-smoke.sh hydro-toolkit
# 或用 slash command：/api-smoke hydro-toolkit

# 添加新插件（git clone 到 plugins/）
git clone https://github.com/zengtianli/hydro-capacity plugins/hydro-capacity

# 查看已注册插件
cat plugins.json
```

共享 API helper：`~/Dev/devtools/lib/hydro_api_helpers.py`（4 件套之一，供 api.py 引入）。

## 项目结构

```
hydro-toolkit/
├── api.py              # FastAPI 入口，暴露 /api/plugins 等端点
├── plugins.json        # 插件注册列表
├── core/
│   ├── plugin_loader.py   # 读取 plugin.yaml，动态加载插件
│   ├── plugin_manager.py  # 插件生命周期管理
│   ├── home.py            # 首页渲染
│   └── manage.py          # 插件 CRUD 操作
└── plugins/
    └── hydro-xxx/      # 每个插件独立 Git 仓库
        ├── plugin.yaml # 插件元数据（name/entry/description）
        └── api.py      # 插件 FastAPI 入口
```

## 插件开发规范

新插件必须包含 `plugin.yaml`（供 plugin_loader 发现）：

```yaml
name: hydro-xxx
entry: api.py
description: 工具描述
```

插件放入 `plugins/` 后自动被 Portal 发现，无需修改 host 代码。

## 凭证

Geocoding 插件用高德 API Key，存于 `~/.personal_env`（`AMAP_API_KEY`），直接读取，不要问用户。

## 已有插件

| 插件 | 子域名 |
|------|--------|
| hydro-capacity | hydro-capacity.tianlizeng.cloud |
| hydro-reservoir | hydro-reservoir.tianlizeng.cloud |
| hydro-efficiency | hydro-efficiency.tianlizeng.cloud |
| hydro-annual | hydro-annual.tianlizeng.cloud |
| hydro-irrigation | hydro-irrigation.tianlizeng.cloud |
| hydro-district | hydro-district.tianlizeng.cloud |
| hydro-geocode | hydro-geocode.tianlizeng.cloud |
| hydro-rainfall | hydro-rainfall.tianlizeng.cloud |
| hydro-risk | hydro-risk.tianlizeng.cloud |
