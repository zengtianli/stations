# CC Docs

Claude Code 命令 & 技能说明书 — 每条 slash command 独立详情页，marked.js 客户端渲染原 markdown。

## 在线访问

- https://cmds.tianlizeng.cloud（CF Access 保护）
- 本地预览：`/opt/homebrew/bin/python3 generate.py && open site/index.html`

## 数据源

直接扫 `~/Dev/tools/cc-configs/`（commands / skills / agents / rules）— 不维护独立 yaml。

新增 slash command / skill 后跑 `bash deploy.sh` 即可上线。

## 项目结构

```
generate.py        # 扫描 cc-configs → 生成 site/index.html + site/<cmd>.html
deploy.sh          # python3 generate.py + rsync + nginx reload
site-content.css   # SSOT 同步（/site-content-refresh）
site-navbar.html   # SSOT 同步（/navbar-refresh）
```

## 部署

```bash
bash deploy.sh
```

GitHub Actions 也会在 push 后自动部署到 https://cmds.tianlizeng.cloud。

## 漂移检测

`/menus-audit` 检测 `site-content.css` 和 `site-navbar.html` 是否跟 SSOT 模板同步。
