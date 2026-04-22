"use client"

import { HydroComputePage } from "@tlz/ui"

export default function HomePage() {
  return (
    <HydroComputePage
      config={{
        title: "纳污能力计算",
        subtitle: "河道/水库纳污能力计算，支持支流分段和多方案",
        badge: (
          <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/70">
            🌊 · Next.js · hydro-capacity
          </span>
        ),
        uploadMode: "xlsx",
        resultKind: "xlsx",
        runLabel: "运行 纳污能力计算",
        resultPrefix: "hydro-capacity_result",
        estimatedSeconds: 50,
      }}
    />
  )
}
