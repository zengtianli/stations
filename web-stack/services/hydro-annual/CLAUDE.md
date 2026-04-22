# hydro-annual — 浙江省水资源年报查询与导出工具

## Quick Reference

| 项目 | 路径/值 |
|------|---------|
| 入口 | `api.py` (FastAPI，`tlz-api@hydro-annual.service` 拉起) |
| 前端 | `~/Dev/stations/web-stack/apps/hydro-annual-web/` |
| API 端口 | 8614（站点端口 8514 + 100）|
| 数据目录 | `data/` + `src/annual/` |
| 公共模块 | `src/common/` |
| 线上地址 | https://hydro-annual.tianlizeng.cloud |

## 常用命令

```bash
cd ~/Dev/stations/web-stack/services/hydro-annual

# 本地启动
uv run uvicorn api:app --host 127.0.0.1 --port 8614 --reload

# 依赖安装
uv sync --all-packages
```

## 项目结构

```
api.py              # FastAPI 主入口（/api/health, /api/meta, /api/compute），页面逻辑
src/
  annual/           # 年报数据解析与查询逻辑
  common/           # 通用工具函数
data/
  sample/           # 内置数据集（无需上传）
```

## 核心功能

- 覆盖 2019–2024 年浙江省水资源年报数据（内置，无需上传）
- 按城市（地级市）、类别筛选，支持导出 Excel / CSV
- 无外部 API 依赖，数据纯本地

## 部署说明

VPS 上运行于 `/var/www/web-stack/services/hydro-annual`，通过 Nginx 反代到 FastAPI 端口 (8614)，域名 `hydro-annual.tianlizeng.cloud` 走 Cloudflare。修改后同步到 VPS：

```bash
cd ~/Dev/stations/web-stack
bash infra/deploy/deploy.sh hydro-annual
