# stack

项目架构说明书 — 所有 `~/Dev/` 项目的顶层地图，CF Access 保护。

## 架构

`projects.yaml` → `generate.py` → `site/index.html` → rsync → VPS → Nginx → CF Access

## 常用命令

```bash
# 生成站点
/opt/homebrew/bin/python3 generate.py

# 部署
bash deploy.sh

# 本地预览
open site/index.html
```

## 文件

- `projects.yaml` — 项目清单（编辑这里）
- `generate.py` — 静态 HTML 生成器
- `deploy.sh` — 部署到 VPS
- `site/` — 生成产物

## 添加/更新项目

1. 改 `projects.yaml`（8 分组 + 项目字段）
2. `bash deploy.sh`
3. 访问 stack.tianlizeng.cloud 验证

## 字段约定

- **status**: `active` / `likely-stale` / `archive-candidate`（UI 显示不同颜色）
- **stack**: 技术栈 tag 数组
- **notes**: 人工备注（自评、踩坑、状态说明）

**domain / port 已废**：SSOT 是 `~/Dev/stations/website/lib/services.ts`。卡片渲染时 `generate.py` 按 `name` 反查 services.ts，自动派生 domain + port。改了就改 services.ts。
