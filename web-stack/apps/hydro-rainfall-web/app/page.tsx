"use client"

import { HydroComputePage } from "@tlz/ui"

interface PipelineStep {
  step: string
  label: string
  outputDir: string
  fileCount: number
  status: "completed" | "empty"
}

function renderPipeline(charts: unknown): React.ReactNode {
  const steps = (charts as { pipelineSteps?: PipelineStep[] } | null)?.pipelineSteps ?? []
  if (steps.length === 0) return null
  const done = steps.filter((s) => s.status === "completed").length
  const total = steps.length
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">流水线（6 步）</div>
        <div className="text-xs text-[#86868b]">
          {done} / {total} 完成 · 共 {steps.reduce((n, s) => n + s.fileCount, 0)} 个产物
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {steps.map((s, i) => {
          const ok = s.status === "completed"
          return (
            <div
              key={s.step}
              className={`rounded-lg border px-3 py-2.5 text-xs ${
                ok ? "border-emerald-200 bg-emerald-50/60" : "border-foreground/10 bg-foreground/[0.03]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                    ok ? "bg-emerald-500 text-white" : "bg-foreground/20 text-foreground/60"
                  }`}
                >
                  {ok ? "✓" : i + 1}
                </span>
                <span className="font-medium truncate">{s.label}</span>
              </div>
              <div className="mt-1.5 text-[10px] text-[#86868b] font-mono truncate">{s.outputDir}</div>
              <div className="mt-0.5 text-[11px] text-foreground/80">{s.fileCount} 个文件</div>
            </div>
          )
        })}
      </div>
      <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(done / total) * 100}%` }} />
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <HydroComputePage
      config={{
        title: "降雨径流计算",
        subtitle: "概湖灌溉需水量计算（降雨径流 ETL 管线）",
        badge: (
          <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/70">
            🌧️ · Next.js · hydro-rainfall
          </span>
        ),
        uploadMode: "zip",
        resultKind: "zip",
        runLabel: "运行 降雨径流计算",
        resultPrefix: "hydro-rainfall_result",
        estimatedSeconds: 5,
        renderCharts: renderPipeline,
      }}
    />
  )
}
