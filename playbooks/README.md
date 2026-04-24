# playbooks — 工作方法论知识库站点

> 个人用：返工、回忆、新人上手先翻这里。
> 域名：https://playbooks.tianlizeng.cloud（CF Access 保护）

## 架构

```
~/Dev/tools/configs/playbooks/
├── mkdocs.yml               # MkDocs 配置（Material theme + 中文）
├── docs/                    # 站点源文件（从 ~/Dev/Work/_playbooks/ 同步过来）
│   ├── index.md             # 首页（手写，其他都是同步过来的）
│   ├── bids/
│   ├── eco-flow/
│   └── reclaim/
├── site/                    # mkdocs build 产物（.gitignore）
├── scripts/sync.sh          # ~/Dev/Work/_playbooks → docs/
├── deploy.sh                # 一键 sync + build + rsync
└── README.md
```

## 事实源

**写内容改 `~/Dev/Work/_playbooks/**/*.md`**，本项目只是渲染 + 部署。不要直接改 `docs/`。

## 更新流程

```bash
bash ~/Dev/tools/configs/playbooks/deploy.sh
```

三步：
1. `scripts/sync.sh` — 从 ~/Dev/Work/_playbooks/ rsync 到 docs/
2. `mkdocs build` — 生成 site/
3. `rsync site/ → VPS:/var/www/playbooks/`

## 新增 playbook 后

写完 MD 后可能需要更新 `mkdocs.yml` 的 `nav:` 节加一条。否则文件会被渲染但不在导航里。

## CF Access

- 保护邮箱：zengtianli1@gmail.com（默认）
- 如需加 emmeline_vasicek507@mail.com：`/cf access add playbooks.tianlizeng.cloud --email emmeline_vasicek507@mail.com`

## 首次部署记录

- 2026-04-18 通过 `/ship-site playbooks` 首次上线
- DNS + Origin Rule (8443) + Access 全部通过 cf_api.py 配置
- 验证：`curl -sI https://playbooks.tianlizeng.cloud` → 302 → cloudflareaccess.com ✓
