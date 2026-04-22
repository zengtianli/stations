"use client"

import { useState } from "react"
import { Check, Copy, RefreshCw, Terminal } from "lucide-react"

const CMD = "bash ~/Dev/stations/cc-options/daily_update.sh"
const ALIAS = "alias cc-refresh='bash ~/Dev/stations/cc-options/daily_update.sh'"

export function RefreshButton() {
  const [open, setOpen] = useState(false)
  const [copiedCmd, setCopiedCmd] = useState(false)
  const [copiedAlias, setCopiedAlias] = useState(false)

  async function copy(text: string, which: "cmd" | "alias") {
    try {
      await navigator.clipboard.writeText(text)
      if (which === "cmd") {
        setCopiedCmd(true)
        setTimeout(() => setCopiedCmd(false), 2000)
      } else {
        setCopiedAlias(true)
        setTimeout(() => setCopiedAlias(false), 2000)
      }
    } catch {
      // ignore; clipboard blocked
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 px-3 py-1 text-xs font-medium text-foreground/70 transition"
        title="手动更新持仓数据"
      >
        <RefreshCw className="w-3 h-3" />
        刷新数据
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-background rounded-xl shadow-2xl p-6 max-w-lg w-[90%] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4" />
              <h3 className="font-semibold text-base">更新持仓数据</h3>
            </div>

            <p className="text-sm text-foreground/70 mb-4 leading-relaxed">
              打开终端运行这条命令（~60s，SnapTrade 拉快照 + 流水 + 重建 NLV 曲线 + rsync 到 VPS）：
            </p>

            <div className="bg-foreground/5 rounded-lg p-3 mb-3 flex items-start justify-between gap-3">
              <code className="flex-1 font-mono text-xs break-all">{CMD}</code>
              <button
                type="button"
                onClick={() => copy(CMD, "cmd")}
                className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-background hover:bg-foreground/10 text-xs border border-foreground/10"
              >
                {copiedCmd ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedCmd ? "已复制" : "复制"}
              </button>
            </div>

            <div className="text-xs text-[#86868b] mb-4 space-y-2">
              <p>想要更短的命令？加个 alias 到 <code className="bg-foreground/10 rounded px-1 font-mono">~/.zshrc</code>：</p>
              <div className="bg-foreground/5 rounded-lg p-2.5 flex items-start justify-between gap-2">
                <code className="flex-1 font-mono text-[11px] break-all">{ALIAS}</code>
                <button
                  type="button"
                  onClick={() => copy(ALIAS, "alias")}
                  className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-background hover:bg-foreground/10 text-[11px] border border-foreground/10"
                >
                  {copiedAlias ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedAlias ? "已复制" : "复制"}
                </button>
              </div>
              <p><code className="bg-foreground/10 rounded px-1 font-mono">source ~/.zshrc</code> 后，以后在任何地方打 <code className="bg-foreground/10 rounded px-1 font-mono">cc-refresh</code> 就行。</p>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900 mb-4">
              <div className="font-medium mb-1">自动更新机制</div>
              <div className="text-blue-800/80 leading-relaxed">
                本地 LaunchAgent 每天 <b>17:00</b>（美东收盘后）自动跑一次。手动只在想立即看新数据时用。
                <br />
                跑完 60s 后按 <kbd className="bg-white border border-blue-200 rounded px-1 font-mono text-[10px]">⌘R</kbd> 刷新本页即可看到新数字。
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-foreground/10 hover:bg-foreground/5 py-1.5 px-4 text-sm"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
