"use client"

import { useState, useTransition } from "react"
import { cn } from "@/lib/utils"

type Kind = "hotkeys" | "raycast"

export function ShortcutToggle({
  id,
  kind,
  initialEnabled,
}: {
  id: string
  kind: Kind
  initialEnabled: boolean
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch("/api/hs-prefs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [kind]: { [id]: { enabled: next } } }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      } catch (e) {
        setEnabled(!next)
        setError(e instanceof Error ? e.message : "save failed")
      }
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={enabled}
      title={error ?? (enabled ? "已启用，点击禁用" : "已禁用，点击启用")}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        enabled ? "bg-emerald-500" : "bg-gray-300",
        pending && "opacity-60",
        error && "ring-1 ring-red-500",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
          enabled ? "translate-x-[18px]" : "translate-x-[2px]",
        )}
      />
    </button>
  )
}
