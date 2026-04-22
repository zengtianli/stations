# cmds

CC 命令 & 技能说明书站点：`cmds.tianlizeng.cloud`。

## 数据源

直接扫描 `~/Dev/tools/cc-configs/`：
- `commands/*.md` — active slash commands
- `commands/archive/*.md` — 归档命令（独立功能无替代）
- `skills/*/SKILL.md` — 全局 skills
- `domain-skills/*/SKILL.md` — 水利项目 skills

**不维护独立数据文件**，直接把各 .md 作为 source of truth。

## 架构

```
~/Dev/cmds/
├── generate.py      # 扫 cc-configs → site/*.html
├── deploy.sh        # rsync 到 VPS
└── site/            # 生成产物
    ├── index.html   # 列表页（卡片 + 类别分组 + 搜索）
    ├── <name>.html  # 每条命令/技能的详情页
    └── styles.css
```

## 常用命令

```bash
python3 generate.py       # 重新生成
bash deploy.sh            # 一键部署到 cmds.tianlizeng.cloud
```

## 部署

- VPS: `/var/www/cmds/`
- Nginx: `/etc/nginx/sites-enabled/cmds.tianlizeng.cloud`
- CF Access: zengtianli1@gmail.com（自动沿用现有 policy 邮箱）

## 更新流程

改了任何 command/skill 的 .md 后：
```bash
cd ~/Dev/cmds && bash deploy.sh
```
或直接 `/deploy`（有 deploy.sh 就触发）。

## 详情页结构

每个命令/技能一个 HTML：
- header：`/name` + description + argument-hint + category
- 面包屑 [CC Docs / 分类 / 当前项]
- 主体：原 .md 用 marked.js 客户端渲染
- 交叉链接：编排命令（composed_of）点击跳对应详情页
- 底部链接：`_how-to-create.html`（如何建类似命令）
