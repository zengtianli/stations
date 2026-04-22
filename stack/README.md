# Stack

`~/Dev/` 项目架构说明书 — 顶层项目地图。CF Access 保护。

## 在线访问

- https://stack.tianlizeng.cloud（CF Access 保护）
- 本地预览：`/opt/homebrew/bin/python3 generate.py && open site/index.html`

## 数据源

`projects.yaml` — 8 分组 × 多项目，每条记录：

| 字段 | 说明 |
|---|---|
| `name` | 显示名 |
| `path` | 本地路径（`~` 展开） |
| `purpose` | 一句话功能 |
| `type` | web-app / desktop-app / cli / library / static-site / docs / config |
| `stack` | 技术栈 tags |
| `domain` / `port` | 部署信息（可空） |
| `status` | active / likely-stale / archive-candidate / archived |
| `notes` | 人工备注（自评 / 踩坑） |

CC 命令 & 技能组由 `generate.py` 扫描 `~/Dev/tools/cc-configs/` 自动注入，不在 yaml 编辑。

## 添加 / 更新项目

1. 改 `projects.yaml`
2. `python3 generate.py`（重生成 site/index.html）
3. `bash deploy.sh`
4. 访问 stack.tianlizeng.cloud 验证

## 部署

```bash
bash deploy.sh   # source vps_config.sh + rsync + nginx reload
```

GitHub Actions 也会在 push 后自动部署。

## 详细文档

`CLAUDE.md` 含字段约定 + 状态色码。
