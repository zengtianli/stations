# stations · 站群 Monorepo

`tianlizeng.cloud` 域下 13 个在线子域对应的源码，统一管理。

> 2026-04-22 从 12 个独立 github repo 合并为单 monorepo。历史保留在旧 repo 的 archived 状态（`zengtianli/web`, `zengtianli/cclog`, `zengtianli/cmds`, ...）。

## 子项目

| 目录 | 子域 | 技术栈 | 说明 |
|---|---|---|---|
| `website/` | tianlizeng.cloud | Next.js | 主站 + mega-navbar |
| `ops-console/` | dashboard.tianlizeng.cloud | Next.js | 运维面板 |
| `web-stack/` | *.tianlizeng.cloud (10 hydro-*) | Next.js + FastAPI | 水利站群 |
| `audiobook/` | audiobook.tianlizeng.cloud | Next.js | 有声书 |
| `cmds/` | cmds.tianlizeng.cloud | 静态站 | 命令速查 |
| `stack/` | stack.tianlizeng.cloud | 静态站 | 项目索引 |
| `logs/` | logs.tianlizeng.cloud | 静态站 | 工程日志 |
| `assets/` | assets.tianlizeng.cloud | 静态站 | 素材 |
| `playbooks/` | playbooks.tianlizeng.cloud | 静态站 | 工作手册 |
| `cclog/` | cclog.tianlizeng.cloud | FastAPI | CC 会话日志 |
| `dockit/` | dockit.tianlizeng.cloud | Next.js | 文档工具 |
| `cc-options/` | — | 本地（含金融 .env） | 不对外 |
| `docs/` | — | MD | 跨站归档/知识库 |

## 部署

每个子项目保留独立 `deploy.sh`（大多走 `~/Dev/devtools/lib/deploy-static-site.sh` 或 rsync 到 VPS）。Monorepo 合并后部署流程不变。

## 常用

```bash
/menus-audit        # 13 类漂移检测（pre-commit 自动跑）
/services-health    # 11 FastAPI 服务 live matrix
/warmup             # 进站群环境 snapshot
```

详见 `CLAUDE.md`。
