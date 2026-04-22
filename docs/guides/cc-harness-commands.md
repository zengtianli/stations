# Claude Code Commands 完整手册

所有 commands 定义在 `~/Dev/cc-harness/commands/`，通过 symlink 加载到 `~/.claude/commands/`。

在 Claude Code 中输入 `/命令名 [参数]` 调用。每个 command 封装了一套可重复的工作流。

---

## 交付与部署（Ship & Deploy）

| 命令 | 用法 | 说明 |
|------|------|------|
| `/ship` | `/ship`、`/ship all`、`/ship dockit hydro-risk` | 提交 + 推送一个或多个 repo。自动生成 conventional commit 消息。`all` 模式从 `repo-map.json` 发现所有有变更的 repo。 |
| `/deploy` | `/deploy`、`/deploy --backend-only` | 部署当前项目到 VPS。检测 `deploy.sh`，需要时先 build 前端，部署后 curl 验证。 |
| `/pull` | `/pull`、`/pull all`、`/pull dockit learn` | 批量 `git pull --ff-only`，支持单个或多个 repo。 |
| `/dashboard` | `/dashboard`、`/dashboard --scan-only` | 用 LLM 分析 Claude Code 会话，然后部署 dashboard 应用。`--scan-only` 只扫描不部署，`--force` 忽略缓存。 |
| `/scan` | `/scan` | 扫描 Claude Code 会话，LLM 分析任务状态，生成 `tasks.json`。 |

## Repo 管理（Repo Management）

| 命令 | 用法 | 说明 |
|------|------|------|
| `/groom` | `/groom`、`/groom hydro-risk learn`、`/groom --check` | 完整 repo 维护流水线：pull → audit → fix → review → push。编排原子命令。 |
| `/audit` | `/audit`、`/audit hydro-risk` | 基于 `repo-standards.json` 审计 repo 完整性——检查文件和 GitHub metadata。 |
| `/promote` | `/promote`、`/promote all --check` | 轻量 GitHub metadata 审计：description、topics、homepage、截图。是 `/groom` 的子集，专注公开可见性。 |
| `/repo-map` | `/repo-map scan`、`/repo-map sync`、`/repo-map show` | 管理 GitHub ↔ 本地路径注册表（`repo-map.json`）。`scan` 扫描磁盘发现 repo，`sync` 同步到下游消费者，`show` 打印表格。 |
| `/auggie-map` | `/auggie-map hydro-risk` | 为大型项目生成二进制文件地图（`_files.md`），推到 GitHub 供 Auggie 索引那些不在 git 中的文件。 |

## 基础设施（Infrastructure）

| 命令 | 用法 | 说明 |
|------|------|------|
| `/vps-status` | `/vps-status`、`/vps-status nginx` | SSH 到 VPS，展示运行中的服务、端口、磁盘、内存、Docker 容器。指定服务名会额外显示最近日志。 |
| `/cf-dns` | `/cf-dns list`、`/cf-dns add status`、`/cf-dns delete old-sub` | 通过 API 管理 Cloudflare DNS 记录。`add` 一步创建 A 记录 + Origin Rule。 |
| `/fix-printer` | `/fix-printer` | 办公室 Canon iR C3322L 打印机诊断修复——网络检测、VPN 绕过、CUPS 配置、队列清理。 |

## 文档处理（Document Processing）

| 命令 | 用法 | 说明 |
|------|------|------|
| `/md2word` | `/md2word path/to/file.md` | 完整 MD/DOCX → Word 流水线：套模板样式 → 文本修复（标点、单位）→ 图名居中。4 步自动化。 |
| `/review-docx` | `/review-docx path/to/report.docx` | 审阅 Word 文档：提取文本，分析禁用词/错误标点/缺失引用，写入修订批注到文件中。 |
| `/review-deep` | `/review-deep path/to/report.docx` | 4 维度 LLM 深度审阅（完整性/结构性/立场措辞/数据一致性），输出 Word 批注。 |
| `/gen-report` | `/gen-report 县名` | 基于参考报告逐章生成新县市报告——提取 → 数据准备 → LLM 逐章 → 合并。 |

## 水利项目工具（Hydro Project Tools）

| 命令 | 用法 | 说明 |
|------|------|------|
| `/build-hydro` | `/build-hydro capacity`、`/build-hydro all` | 构建 hydro 桌面应用的 Tauri 安装包。报告产物路径和大小。 |
| `/migrate-hydro` | `/migrate-hydro capacity` | 将 hydro Streamlit 应用的计算逻辑移植到对应 Tauri 桌面应用。读 Python → 写 Rust + React。 |
| `/prep-basic-info` | `/prep-basic-info 县名` | 基础信息数据准备：网搜 + 下载 + LLM 提取 → `01-06.md` 文件。 |
| `/prep-ecoflow-calc` | `/prep-ecoflow-calc 县名` | 生态流量计算（Tennant 法 + QP 法，Python 替代 CurveFitting）。 |
| `/prep-engineering` | `/prep-engineering 县名` | 工程排查数据准备：筛选 → 合并 → MD 提取 → 简化 → 排查表。 |

## 脚手架（Scaffolding）

| 命令 | 用法 | 说明 |
|------|------|------|
| `/harness` | `/harness`、`/harness ~/Dev/new-project`、`/harness --check` | 检测项目类型（streamlit/cli/scripts/docs/……）和成熟度（seed/growing/established/mature），生成或升级 Claude Code 配置：CLAUDE.md、README、.gitignore、hooks、rules。随项目成长——阶段变化后重新运行即可升级配置。 |

## 会话与工作流（Session & Workflow）

| 命令 | 用法 | 说明 |
|------|------|------|
| `/recap` | `/recap` | 会话结束复盘：回顾对话、提取经验、更新 memory/skills/commands/CLAUDE.md，生成 `session-retro-{date}.md`。 |
| `/context` | `/context monitor`、`/context health` | 监控 Claude Code 会话健康——token 消耗、工具调用分布、上下文膨胀检测、快照保存/恢复。 |
| `/tidy` | `/tidy`、`/tidy ~/Work/project/docs` | 深度清理目录：发现垃圾文件、版本链、散乱文件。按目录分组输出表格，确认后才执行。 |
| `/health` | `/health`、`/health --llm` | 文件卫生 + Git 状态检查。发现问题可调用 `/tidy` 清理。 |

---

## Skills 技能一览

Skills 是自动触发的上下文注入，定义在 `~/Dev/cc-harness/skills/`。Claude Code 检测到匹配场景时自动加载，无需手动调用。

### 全局技能

| 技能 | 触发场景 | 提供的知识 |
|------|---------|-----------|
| **context** | 在 ZDWP 水利公司项目中工作 | 集团架构、县市列表、数据字段规范、交付标准 |
| **structure** | 整理文件、创建新项目 | 目录命名规则、文件分类规则、自动整理逻辑 |
| **plan-first** | 批量操作、破坏性动作 | 强制"先写方案再操作"纪律——展示表格，等待审批 |
| **quarto** | 将 DOCX 转换为 Quarto 项目 | Quarto 编译工作流、模板结构、图表处理 |
| **frontend** | 做 UI 开发时 | 信息密度、紧凑布局、可操作数据、Streamlit 约定 |

### 项目专用技能

| 技能 | 绑定项目 | 提供的知识 |
|------|---------|-----------|
| **risk-map** | ~/Work/risk-map | 洪水风险图数据处理、QGIS 空间工作流、Excel 模板填充 |
| **eco-flow** | ~/Work/eco-flow | 生态流量计算（Tennant 法）、水库筛选、保障方案 |
| **zdys** | ~/Work/zdys | 浙东引水运行态势、调度模型、灌溉需水计算 |
| **water-src** | ~/Work/water-src | 饮用水水源地安全保障评估方法 |
| **water-quality** | （独立） | 千岛湖引水分质供水管理 |
| **resources** | risk-map, eco-flow, zdys, water-src | 共享资源目录：水库数据、GIS 底图、行政边界、水资源年报、行业规范 |

### 工具技能

| 技能 | 触发场景 | 提供的知识 |
|------|---------|-----------|
| **harness** | 检查/同步技能配置 | 技能分发注册表、跨项目同步逻辑 |
| **repo-manage** | 管理 GitHub repo | 审计/截图/推广 SOP |
| **restart** | 终端重启后恢复会话 | 会话恢复指令 |

---

## Agents 一览

Agents 定义在 `~/Dev/cc-harness/agents/`，用于复杂多步任务的专用自治工作者。

| Agent | 用途 |
|-------|------|
| **bid-chapter-writer** | 按公司模板和格式标准编写标书章节 |
| **project-content-checker** | 按需求清单审计项目交付物完整性 |
