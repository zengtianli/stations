"use client"

import { HydroComputePage } from "@tlz/ui"

export default function HomePage() {
  return (
    <HydroComputePage
      config={{
        title: "地理编码",
        subtitle: "经纬度/地址互转与企业搜索（高德 API）",
        badge: (
          <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/70">
            📍 · Next.js · hydro-geocode
          </span>
        ),
        uploadMode: "xlsx",
        resultKind: "xlsx",
        runLabel: "运行 地理编码",
        resultPrefix: "hydro-geocode_result",
        estimatedSeconds: 10,
        paramFields: [
          { name: "convert_wgs84", label: "WGS-84 → GCJ-02", kind: "checkbox", default: true },
          { name: "rate_limit_seconds", label: "逐行间隔", kind: "slider", min: 0, max: 1, step: 0.05, default: 0.3 },
          { name: "max_rows", label: "最大行数（留空全跑）", kind: "number", placeholder: "例如 10" },
        ],
      }}
    />
  )
}
