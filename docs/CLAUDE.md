# 个人知识库

技术文档、架构设计、决策记录、讨论笔记的集中管理平台。

## Quick Reference

| 项目 | 路径 |
|------|------|
| 知识库首页 | `index.md` |
| 架构文档 | `architecture/` |
| 操作指南 | `guides/` |
| 技术笔记 | `knowledge/` |
| 项目文档 | `projects/` |
| 决策记录 | `decisions/` |
| 索引生成 | `update-index.sh` |

## 目录结构

```
docs/
├── index.md               # 知识库索引
├── update-index.sh        # 索引更新脚本
├── architecture/          # 架构设计
├── guides/                # 操作指南
├── knowledge/             # 技术笔记
│   ├── 架构设计/
│   ├── 技术选型/
│   ├── 问题解决/
│   └── 工作流程/
├── projects/              # 项目文档
├── decisions/             # ADR
├── discussions/           # 技术讨论
└── _archive/              # 归档
```

## 常用命令

```bash
cd ~/Dev/docs
./update-index.sh          # 重新生成索引
tree -L 2 knowledge/       # 查看知识库结构
```

## 文件命名

- 知识文章：`topic-name.md`
- 决策记录：`ADR-brief-title.md`
- 讨论笔记：`date-topic-name.md`
