# Retro · 2026-04-25 · 终端 mail 抑制 + cron/launchd 漂移修复

**关键数字**：本次任务漏了 **0 个** skill（这类 ops 修复无对口 skill），但**两次**触发并行连锁 cancel。

## 用户投诉的真痛点

> ```
> ⏺ Bash(mkdir -p ~/Dev/stations/docs/health && ls -d ~/Dev/stations/docs/health)
>   ⎿  Cancelled: parallel tool call Bash(cat /dev/null > /var/mail/$USER && ls -l…) errored
> ```
> 这些了，明白我的意思吗，我同意后操作

用户已经 ExitPlanMode 批准了，我执行时**两次**让无关命令被一个失败拖死 → 连续浪费两轮。这才是要复盘的事，不是流程编排。

## 核心编排

```
用户口令「为什么登陆有 you have mail」
  ↓
【侦察】     并行 Bash × 5（read-only）   ← ✅ 这步对了
             cron / launchd / hushlogin / mail spool / 路径核对
  ↓
【规划】     Plan mode + AskUserQuestion × 2 + ExitPlanMode    ← ✅ 这步对了
             plan 文件: ~/.claude/plans/mac-mail-scalable-crane.md
  ↓
【执行】     Bash × 4 并行 ← ❌ 错了两次
             把 zsh noclobber 风险命令塞进并行 batch → 整批 cancel × 2
  ↓
【验证】     Bash × 1 汇总   ← ✅ 这步对了
```

## Phase · 执行（错误发生处）

### 触发时机
ExitPlanMode 后批量执行计划里的命令。

### 本次怎么做的（错的）
把以下 4 个命令同 message 并行：
```
1. touch ~/.hushlogin && : > /var/mail/$USER     ← 失败：zsh noclobber 拒 `: >`
2. launchctl unload + rm plist                    ← 被 cancel
3. mkdir -p stations/docs/health                  ← 被 cancel
4. crontab -l > /tmp/crontab.bak                  ← 被 cancel
```

第二次重试，把 `: >` 改成 `cat /dev/null >` —— **依然是 noclobber 触发**（`>` 才是关键，不是命令前缀）。又一整批 cancel。

第三次才用 `>|` 修对。

### 正确姿势
**两条互补规则**：

**规则 A · 风险隔离**：并行 batch 里如果有一条命令"可能失败"（first-time 操作 / 涉及外部状态 / 跨平台行为差异），**单独放一个 message**先验证它工作，再并行剩下的。

**规则 B · zsh noclobber 是默认状态**：本机 zsh 开了 `noclobber`（已确认）。覆写已存在文件用：
```bash
>| /var/mail/$USER          # zsh 强制 clobber
truncate -s 0 /var/mail/$USER   # 跨 shell 通用
python3 -c "open('/var/mail/tianli','w').close()"   # 终极兜底
```
**绝对不要**用：`: > file` / `cat /dev/null > file` / `echo -n > file` —— 全部被 noclobber 拒。

### 下次记得
- 写空文件 / 覆写现有文件 → 第一反应 `>|` 而不是 `>`
- 并行 batch 之前问自己：「这批里有没有一条第一次跑、可能 zsh/macOS 行为差异？」有 → 它单飞，不要拖累其他

## Phase · 侦察（做对了的部分）

### 用什么
并行 Bash × 5（全部 read-only：crontab / launchctl / ls / cat / grep）

### 为什么对
read-only 命令几乎不会失败（除了路径不存在，且失败影响小）。这种 batch 是并行优势最大的场景，没有连锁 cancel 风险。

### 下次记得
read-only 侦察 = 大胆并行；写操作 = 风险评估后才并行。

## Phase · 规划（做对了的部分）

### 用什么
- `EnterPlanMode`（用户已开 plan mode）
- `AskUserQuestion` × 1 个 message 问 2 个决策（weekly-scan 处理 + cron 输出策略）
- `ExitPlanMode`

### 为什么对
ops 类破坏性操作（删 LaunchAgent / 改 crontab）必须先拿到用户决策。一个 AskUserQuestion 同 message 塞 2 个独立问题，不分两轮。

### 下次记得
多个独立决策 → 一个 AskUserQuestion 多 question，不要串行问。

## 通用 Playbook · 任何"批量 ops 操作"抄这个

```
1. 并行 read-only 侦察（cron / launchd / 路径 / 配置）
2. EnterPlanMode + 写 plan 文件
3. AskUserQuestion 一次问完所有独立决策
4. ExitPlanMode
5. 执行：分两批
   5a. 高风险 / 不确定行为命令 单独跑（先验证一条）
   5b. 验证通过后剩余命令并行
6. 单独 message 跑汇总验证
```

**关键**：第 5 步分两批，不要图省事一把梭。

## 本次漏了什么 skill

**0 个**。这是纯 macOS ops 修复（cron / launchd / hushlogin），无对口 skill。这类任务保留手工 bash 是合理的，但**手工 bash 也要遵守 noclobber + 风险隔离**两条规则。

如果未来这类任务多起来，可考虑沉淀一个 `/launchd-audit` skill（扫所有 com.tianli.* plist 路径有效性 + 输出报告）。本次跳过，标记为 **🚧 未来候选 skill**。

## 一句话总结

> 用户已经批准了计划，执行就该顺。两次连锁 cancel 是因为我**没把"可能失败"的命令独立隔离** + **不知道 zsh noclobber 是默认状态**。下次第一反应：覆写文件用 `>|`，风险命令单飞。
