# hydro-reservoir — 梯级水库水电调度优化器

## Quick Reference

| 项目 | 路径/值 |
|------|---------|
| 入口 | `api.py` (FastAPI，`tlz-api@hydro-reservoir.service` 拉起) |
| 前端 | `~/Dev/stations/web-stack/apps/hydro-reservoir-web/` |
| API 端口 | 8612（站点端口 8512 + 100）|
| 核心逻辑 | `src/reservoir/` |
| 公共工具 | `src/common/` |
| 样例数据 | `data/sample/` |
| 线上 URL | https://hydro-reservoir.tianlizeng.cloud |

## 常用命令

```bash
cd ~/Dev/stations/web-stack/services/hydro-reservoir

# 本地启动
uv run uvicorn api:app --host 127.0.0.1 --port 8612 --reload

# 安装依赖
uv sync --all-packages

```

## 项目结构

```
api.py               # FastAPI 主入口（/api/health, /api/meta, /api/compute）
src/
  reservoir/         # 梯级调度核心算法
  common/            # 公共工具函数
data/sample/         # 样例 Excel 输入文件
docs/screenshots/    # 演示截图
```

## 功能说明

- **输入**：上传 Excel 工作簿（水库参数 + 入库流量）
- **调度**：支持日/旬/月三种时间步长的梯级联合优化
- **输出**：Plotly 交互图表（水位、流量、出力）+ 结果 Excel 下载
- **调试**：Parameter Preview 功能可在运行前检查水库参数

## 部署

走 `~/Dev/stations/web-stack/infra/deploy/deploy.sh hydro-reservoir`：

```bash
cd ~/Dev/stations/web-stack
bash infra/deploy/deploy.sh hydro-reservoir
```
