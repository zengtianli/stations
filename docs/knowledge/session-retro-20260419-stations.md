# Session Retro · 2026-04-19 站群统一治理（6 轮 + mega menu 未做）

> 8 小时长会话 · `tianlizeng.cloud` 站群从「navbar 不齐 + 内容割裂 + 死站没合并」到「6 轮工具化治理 + 待做 mega menu」

## 主题

把 28 子域站群的「视觉/导航/内容」治理成 SSOT 模式，最终用 mega menu 实现汇丰式可重组的导航。

## 进程（6 轮已完成 + 1 轮未做）

| 轮 | 主题 | 关键产物 |
|---|---|---|
| R1 | yaml SSOT 落地 | `~/Dev/tools/configs/menus/`（navbar/sites/schema）+ `menus.py` 加载器 + `/menus-audit` |
| R2 | 部署 + PWA + 撤回 GHA | 主站 PWA manifest+sw.js；GHA 撤回（用户不会在 GitHub web 编辑）|
| R3 | /services 升级 + iPhone shortcuts + repo-dashboard 归档 | LocalCatalog 组件 + SHORTCUTS.md |
| R4 | navbar 视觉统一 | 主站 React navbar 两行（玻璃 + 内导航），与子站 byte-equal CSS |
| R5 | site-header SSOT + journal/changelog → logs 合并 | `/site-header-refresh` + logs.tianlizeng.cloud 上线 |
| R6 | site-content.css 站内主体玻璃化 + journal/changelog 立即归档 | `/site-content-refresh` + 4 站统一玻璃卡片 |
| **R7（未做）** | **mega menu 重构** | **navbar.yaml 改 mega 结构，参考汇丰** |

## 成果

- `~/Dev/tools/configs/menus/` — 4 个 yaml SSOT（navbar / sites/* / catalog / schema）
- `menus.py` — 加载器（render-navbar / build-site-content / render-site-header / build-website-navbar / build-catalog / audit）
- 4 个 slash skill — `/menus-audit` `/navbar-refresh` `/site-header-refresh` `/site-content-refresh`
- audit 8 类全绿
- 6 站视觉已统一（navbar + site-header + 玻璃卡片）
- 28 → 26 子域（journal + changelog 归档合并到 logs）

## 做对了什么

1. **SSOT yaml + render + audit + slash skill 4 件套**——可复用 4 次（navbar / site-header / site-content / catalog），证明这套模式 work
2. **byte-equal 验证**——render 出的产物与现有文件完全相同时才允许接入消费者
3. **分阶段执行**——每轮明确目标 + 验证清单，PROGRESS.md 可追溯
4. **engineering-mode 精神**——破坏性操作前 dry-run（如 navbar-refresh）
5. **写 PROGRESS.md / PLAN-roundN.md**——给自己留状态机

## 做错了什么 ⚠️

### 多次理解错用户的「网站结构不一样」

**第一次**（R4 之前）：用户截图发现 journal 黑块 → 我以为是 CSS 漂移，实际是 navbar 缺 Journal 链接 + JS 默认 active brand。

**第二次**（R6 之前）：用户说"网站结构不一样" → 我做了 site-content.css 玻璃卡片化。后来发现用户说的"不一样"还包括第二行 menubar 缺 5 项内导航。

**第三次**（R7 之前）：用户说"5 项 menubar 全站统一" → 我以为是简单加第二行。用户进一步说"看成 finder 文件夹"+ 给汇丰截图 → 真正的需求是 **mega menu 模块化 + 可重组**。

**根因**：截图发出来时**没仔细看**就猜，跑偏后用 6 轮做"接近但还不是"的统一。

**教训**：
1. 用户每次发截图都是关键证据，先**按图复述**再说"我理解的是 X，对吗"
2. 用户说"很多次"=我已经误解，**立刻停下用 AskUserQuestion 给 preview**
3. "成熟模式"是关键词——汇丰这种 mega menu 是 industry standard，不要重新发明

### 设计上的过度复杂

- 第二行 navbar 用 `tlz-nav--secondary` 自定义实现 → 应该一开始就 mega menu
- site-header 与 navbar 第二行职能重叠
- 6 个 yaml SSOT 给 4 个站用，每加一类要改 4 次

## 工程模式（值得带走）

✅ **保留**：SSOT yaml + render + audit + slash skill 4 件套（mega menu 也用这个）
✅ **保留**：每轮 PROGRESS.md + PLAN-roundN.md + 验证清单
✅ **保留**：byte-equal 验证 + dry-run + 6 站并行 deploy

❌ **避免**：先做后问、跑偏后继续做、不读截图

## 沟通模式

- 用户 80% 时间通过截图传达需求，20% 文字
- 用户骂"傻逼"= 我前面有明确证据但漏看
- 用户说"我们讨论下" = 给 preview + 推荐 + 让选，不是动手
- 用户说"按成熟网页做" = 别造轮子，照抄 industry standard pattern

## 待做 R7：mega menu

参考汇丰的 mega menu：顶部 5-6 个主分类，hover 展开 mega panel（多列 sections 显示子项）。

**用户决策**：
- ✅ 方案 1（全 mega menu，所有主分类都 hover 展开）
- ✅ 按成熟网页（汇丰式）做，不要造轮子
- ✅ 看成 finder 文件夹，可重构 / 重组（navbar.yaml 数据驱动）

详细设计 + 实施 → 见 `~/Dev/HANDOFF.md` 和 `~/Dev/tools/configs/menus/PLAN-round7.md`（待写）。
