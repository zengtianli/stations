# CLAUDE.md — playbooks 站点

## 定位

把 `~/Dev/Work/_playbooks/` 渲染成可浏览的静态站点，部署到 https://playbooks.tianlizeng.cloud（CF Access 保护）。

## 关键事实

- **事实源**：`~/Dev/Work/_playbooks/`（不是 `docs/`）
- **渲染器**：MkDocs + Material（pipx 装的，`~/.local/bin/mkdocs`）
- **部署流**：`bash deploy.sh`（sync → build → rsync）
- **子域名**：playbooks.tianlizeng.cloud
- **访问控制**：CF Access（邮箱列表）

## 常规动作

| 场景 | 命令 |
|------|------|
| 内容有改 | 改 `~/Dev/Work/_playbooks/`，然后 `bash deploy.sh` |
| 加新 playbook 文件 | 改 `~/Dev/Work/_playbooks/`，更新 mkdocs.yml `nav:` 节，`bash deploy.sh` |
| 本地预览 | `cd ~/Dev/tools/configs/playbooks && ~/.local/bin/mkdocs serve` |
| 部署后验证 | `curl -sI https://playbooks.tianlizeng.cloud` 应返回 302 |
| 加访问邮箱 | `/cf access add playbooks.tianlizeng.cloud --email X` |

## 注意

- 不要直接改 `docs/`（sync.sh 会覆盖）
- `docs/index.md` 是本地手写的首页（sync.sh 会保留它）
- site/ 是 build 产物，不进 git
