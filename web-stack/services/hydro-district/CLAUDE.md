# hydro-district — 19 河区日供需调度平台

## Quick Reference

| 项目 | 路径/值 |
|------|---------|
| 入口 | `api.py` (FastAPI，`tlz-api@hydro-district.service` 拉起) |
| 前端 | `~/Dev/stations/web-stack/apps/hydro-district-web/` |
| API 端口 | 8616（站点端口 8516 + 100）|
| 核心逻辑 | `src/district/` — 河区调度，`src/common/` — 公共模块 |
| 示例数据 | `data/sample/` |
| 线上地址 | https://hydro-district.tianlizeng.cloud |
| VPS 部署路径 | `/var/www/web-stack/services/hydro-district` |

## 常用命令

```bash
cd ~/Dev/stations/web-stack/services/hydro-district

# 本地启动
uv run uvicorn api:app --host 127.0.0.1 --port 8616 --reload

# 依赖安装（uv 管理）
uv sync

# 推送并重启 VPS 服务（如有 systemd 服务）
cd ~/Dev/stations/web-stack && bash infra/deploy/deploy.sh hydro-district
```

## 项目结构

```
api.py                  # FastAPI 主入口（/api/health, /api/meta, /api/compute）
src/
  district/             # 各河区调度模型（19 个区参数化）
  common/               # 共享计算逻辑（供需平衡、水库/闸门）
data/
  sample/               # 样例输入数据（ZIP 格式批量导入）
```

## 核心功能说明

- **19 区独立参数**：每个河区有独立配置，`src/district/` 下按区组织
- **日调度循环**：按时间步逐日计算供需平衡，含水库蓄放、闸门操作记录
- **批量工作流**：支持 ZIP 打包多区数据导入，结果亦可批量导出
- **内置结果浏览器**：调度结果可在 Next.js 前端直接查看对比

## 凭证

本项目无需外部 API，不依赖 `~/.personal_env`。
VPS 相关凭证（SSH、Cloudflare）统一见 `~/.personal_env`（`CF_API_TOKEN`、`CF_ZONE_ID`）。
