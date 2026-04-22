"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import type { RangeKey } from "../types"

type RangeCtx = {
  rangeKey: RangeKey
  setRangeKey: (k: RangeKey) => void
  startDate: string
}

const Ctx = createContext<RangeCtx | null>(null)

function computeStartDate(key: RangeKey): string {
  const now = new Date()
  if (key === "YTD") return `${now.getUTCFullYear()}-01-01`
  const days = key === "1M" ? 30 : key === "3M" ? 90 : key === "6M" ? 180 : 365
  const d = new Date(now.getTime() - days * 86400000)
  return d.toISOString().slice(0, 10)
}

export function RangeProvider({ children, initial = "YTD" }: { children: ReactNode; initial?: RangeKey }) {
  const [rangeKey, setRangeKey] = useState<RangeKey>(initial)
  const value = useMemo<RangeCtx>(
    () => ({ rangeKey, setRangeKey, startDate: computeStartDate(rangeKey) }),
    [rangeKey],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useRange(): RangeCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error("useRange must be used inside <RangeProvider>")
  return v
}
