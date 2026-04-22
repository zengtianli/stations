# hydro-capacity — 河流水库纳污能力计算器

## Quick Reference

| 项目 | 路径/值 |
|------|---------|
| 入口 | `api.py` (FastAPI，`tlz-api@hydro-capacity.service` 拉起) |
| 前端 | `~/Dev/web-stack/apps/hydro-capacity-web/` (React + @tlz/ui HydroComputePage) |
| 核心逻辑 | `src/capacity/` |
| 公共模块 | `src/common/` |
| Excel 模板 | `templates/纳污能力计算模板.xlsx` |
| 示例数据 | `data/sample/` |
| 线上地址 | https://hydro-capacity.tianlizeng.cloud |
| API 端口 | 8611（站点端口 8511 + 100） |

## 常用命令

```bash
cd ~/Dev/stations/web-stack/services/hydro-capacity

# 本地起 FastAPI
uv run uvicorn api:app --host 127.0.0.1 --port 8611

# 本地烟测（自动起停 + 健康检查 + /api/meta + 可选 /api/compute 验证）
bash ~/Dev/devtools/scripts/api-smoke.sh hydro-capacity
bash ~/Dev/devtools/scripts/api-smoke.sh hydro-capacity --compute
# 或用 slash command：/api-smoke hydro-capacity

# 依赖
uv sync

# 部署到 VPS
cd ~/Dev/stations/web-stack && bash infra/deploy/deploy.sh hydro-capacity
```

共享 API helper：`~/Dev/devtools/lib/hydro_api_helpers.py`（4 件套之一，供 api.py 引入）。

## 项目结构

```
api.py                  # FastAPI 主入口（/api/health, /api/meta, /api/compute）
src/
  capacity/             # 纳污能力计算核心算法
  common/               # 公共工具函数
templates/              # 用户上传用的 Excel 模板（.xlsx / .xlsm）
data/sample/            # 内置示例数据集
```

## 功能要点

- **多方案对比**：并排模拟多个污染排放场景
- **支流分段**：各支流段独立参数配置
- **月度计算**：按月流量数据处理季节性变化
- **Excel I/O**：上传参数表 → 下载计算结果

## 开发注意

- 修改计算逻辑只动 `src/capacity/`，不要在 `api.py` 里堆业务代码
- Excel 模板改动需同步更新 `templates/` 下两个文件（.xlsx 和 .xlsm）
- 无外部 API 依赖，不需要 `~/.personal_env` 凭证
