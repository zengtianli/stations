# hydro-efficiency — 工业园区水效评估（AHP+CRITIC+TOPSIS）

## Quick Reference

| 项目 | 路径/值 |
|------|---------|
| 入口 | `api.py` (FastAPI，`tlz-api@hydro-efficiency.service` 拉起) |
| 前端 | `~/Dev/stations/web-stack/apps/hydro-efficiency-web/` |
| API 端口 | 8613（站点端口 8513 + 100）|
| 核心逻辑 | `src/efficiency/` |
| 公共模块 | `src/common/` |
| 线上地址 | https://hydro-efficiency.tianlizeng.cloud |
| 本地端口 | 8613（FastAPI） |

## 常用命令

```bash
cd ~/Dev/stations/web-stack/services/hydro-efficiency

# 本地运行
uv run uvicorn api:app --host 127.0.0.1 --port 8613 --reload

# 指定端口
uv run uvicorn api:app --host 127.0.0.1 --port 8613 --reload --server.port 8502

# 安装依赖
uv sync --all-packages
```

## 项目结构

```
api.py              # FastAPI 入口（/api/health, /api/meta, /api/compute）
src/
  efficiency/       # AHP/CRITIC 权重计算、TOPSIS 排名核心算法
  common/           # 数据加载、Excel 模板导出等公共工具
```

## 核心功能

| 功能 | 说明 |
|------|------|
| AHP + CRITIC 组合赋权 | α 参数调节主观/客观权重比例 |
| 3 级评估体系 | 园区 → 管网 → 企业逐级评估 |
| TOPSIS 排名 | 企业综合得分与等级分类 |
| 样本数据内置 | 无需上传文件即可体验 |
| Excel 模板导出 | 下载空白模板填入自有数据 |

## 开发注意

- 无外部 API，无需读取 `~/.personal_env`
- 算法参数（α 权重比）在 Next.js 前端交互调节，无硬编码配置文件
- 修改算法逻辑只需改 `src/efficiency/`，不用动 `app.py` 路由层
- 部署到 VPS 参考 `~/Dev/vps-scripts/CLAUDE.md`，服务注册为 systemd unit
