# 会话教训精华

> 蒸馏自 29 篇 session-retro（2026-03-23 ~ 2026-04-15），原文已归档至 `_archive/session-retros/`

---

## 1. 用户沟通与确认

**规则 1.1 — 长文档前先确认参数**
超过 100 行的文档（尤其金融/策略类），先列 5 个关键参数确认。
来源：carry trade 文档写了 300 行因一个币种参数全部作废（0406, 0406-4）

**规则 1.2 — 先回答问题再操作**
用户问"有哪些命令？"→ 先列清单，不要直接执行 /ship。
来源：0402-5 用户要求"answer then operate"

**规则 1.3 — 不改用户的数据假设**
HSBC spread 0.3%、BOXX 4.25% — 这些是用户的**假设**，不是需要纠正的错误数据。修改前必须明确问。
来源：0406, 0406-4, 0404-3 反复出现

**规则 1.4 — 复述指令后再执行**
用户说"本地不要 VPS"→ CC 仍然尝试 scp；用户说"先 MD 再 DOCX"→ CC 直接写 DOCX。需要复述确认。
来源：0404, 0404-2, 0413-3, 0414, 0414-2

**规则 1.5 — 先做功课再提问**
检查 memory、repo-map.json、现有 commands/skills，然后再问用户。
来源：0402-5 用户原话"你一点功课都没做"

---

## 2. 测试与验证

**规则 2.1 — 部署后必须自己验证**
push 后 = curl 关键路径 + 检查 nginx 日志 + 确认视觉效果。不要让用户当测试员。
来源：0406-6（Streamlit 端口冲突）, 0413（CSS hash 不匹配）, 0414/0414-2/0414-3（middleware 500, track switcher 坏）

**规则 2.2 — 数据操作后做 end-state 验证**
import 完成后：count(*) 对比预期、抽查几行、视觉检查。
来源：0404（行数没对）, 0404-2（options 价格取错 last vs mid）, 0410（stock count 差 500 股）

**规则 2.3 — 长任务中间要测试**
Phase 1 完成后测试，再做 Phase 2。改了一个文件的 CSS 要检查所有 13 个组件。
来源：0413-3, 0414, 0414-3

**规则 2.4 — 主题变更要走清单**
改背景色 → navbar/theme-color/footer/meta 全要改。先列出所有颜色系统组件，再动手。
来源：0414-3（改了 main background 但漏了 4 处）

---

## 3. 设计方法论

**规则 3.1 — 先看参考再迭代**
用户说"Apple 风格"→ 先去看 Apple 网站抄准确值，不要自己试 opacity/gradients 然后被用户骂。
Benchmark first, iterate second。
来源：0414, 0414-2, 0414-3

**规则 3.2 — 设计需要多轮确认**
不要在 isolation 里设计完再 surprise 用户。用 AskUserQuestion + 预览做布局/配色选择。
来源：0413-3, 0414, 0414-2

**规则 3.3 — README → Source → Comparison 框架**
评估开源项目：先读 README 理解定位 → 深入源码 → 对比需求 → 再决定是否引入。
来源：0412（Hermes 分析）

---

## 4. 数据处理

**规则 4.1 — "清空重建" > "增量合并"**
Fuzzy matching + deduplication + merging 都很脆弱。更好的方式：清表 → 全量插入 xlsx → 回填旧数据。
来源：0404-3（水库去重教训）

**规则 4.2 — 多源数据 WHERE 必须带区域**
同名水库/站点在不同县市 → UPDATE WHERE name=? 会命中错误行。任何多源合并都要 county/region 限定。
来源：0404-2, 0404-3

**规则 4.3 — 导入前先 dry-run + diff**
不只是显示 count，要显示实际的 name conflicts、将要覆盖的值。
来源：0404-2

**规则 4.4 — 复用 fuzzy matching 逻辑**
reservoir_query.py 和 import_reservoir.py 各自实现了不同的 fuzzy 逻辑 → 结果不一致。统一到一处。
来源：0404-2

---

## 5. 系统架构知识点

### 5.1 部署标准栈
systemd service + nginx reverse proxy + Cloudflare Origin Rules + deploy.sh。
已重复应用 5+ 次（0406-6, 0412, 0413, 0414 等），已工具化为 /deploy skill。

### 5.2 Next.js standalone 三大坑
- CSS hash 不匹配：standalone/ 和 static/ 来自不同 build → deploy.sh 需要原子操作
- Middleware URL：localhost:3000 vs 实际域名，http vs https → 本地开发隐藏问题
- cookies() 非 ASCII 崩溃 → 用客户端 JS 替代
来源：0413, 0413-3, 0414, 0414-2

### 5.3 npm vs brew
- npm：动态 addon 文件（.node），依赖 node_modules
- brew：静态编译二进制，独立运行
- 搜 standalone binary 里的 .node 文件是找不到的
来源：0410-2, 0412

### 5.4 Symlink-as-config 模式
~/.claude/skills/ → symlink to ~/Dev/tools/cc-configs/skills/
编辑 repo = 编辑配置，git 跟踪一切，多机同步。
来源：0402-4, 0402-5, 0405

### 5.5 Hook + async 防阻塞
SessionEnd hook 设为 async = 不阻塞用户退出。
来源：0402-2

---

## 6. 已毕业教训（技术事实，已内化不再需要）

| 教训 | 学会时间 | 验证 |
|------|----------|------|
| Git LFS cache ≠ git objects | 0402-3 | 后续无回归 |
| xlsx 是 source of truth | 0404-3 | 后续正确应用 |
| MCP 连接需 CLI 测试 | 0410-2 | 后续正确应用 |
| 金融数据需 end-state 验证 | 0406-2 | 0410 正确应用 |
| SQLite > PostgreSQL（单用户） | 0404 | 多项目采用 |
| SnapTrade > robin-stocks | 0406-2 | 已稳定使用 |
| systemd KillMode + ExecStop | 0410 | 已内化 |
| Datasette 需 SQLite ≥3.45 patch | 0404-3 | 一次性问题 |
| IBKR wire transfer 流程 | 0403 | 已完成 |
