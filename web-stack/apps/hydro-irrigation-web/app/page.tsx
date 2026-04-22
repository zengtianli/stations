"use client"

import { HydroComputePage, formatBytes, type PreviewSectionDef } from "@tlz/ui"

interface ZipFileEntry {
  name: string
  size: number
}

interface ZipPreview {
  fileCount: number
  totalSize: number
  groups?: {
    input: ZipFileEntry[]
    static: ZipFileEntry[]
    other: ZipFileEntry[]
  }
}

function FileTable({ files }: { files: ZipFileEntry[] }) {
  if (!files.length) {
    return <div className="text-xs text-[#86868b]">（无文件）</div>
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-foreground/10 max-h-[320px] overflow-y-auto">
      <table className="min-w-full text-xs">
        <thead className="bg-foreground/5 sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left font-medium">文件名</th>
            <th className="px-3 py-2 text-right font-medium">大小</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.name} className="border-t border-foreground/5">
              <td className="px-3 py-1.5 font-mono">{f.name}</td>
              <td className="px-3 py-1.5 text-right text-[#86868b]">{formatBytes(f.size)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderPreview(preview: unknown): PreviewSectionDef[] {
  const p = preview as ZipPreview | null
  if (!p || !p.groups) return []
  const groups = p.groups
  const sections: PreviewSectionDef[] = []
  const order: Array<{ key: keyof typeof groups; label: string }> = [
    { key: "input", label: "输入文件 input_*" },
    { key: "static", label: "静态参数 static_*" },
    { key: "other", label: "其他文件" },
  ]
  for (const { key, label } of order) {
    const files = groups[key] ?? []
    if (!files.length) continue
    sections.push({
      key,
      label: `${label}（${files.length}）`,
      content: <FileTable files={files} />,
      defaultOpen: sections.length === 0,
    })
  }
  return sections
}

export default function HomePage() {
  return (
    <HydroComputePage
      config={{
        title: "灌溉需水",
        subtitle: "水稻+旱地灌溉需水量水平衡计算",
        badge: (
          <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/70">
            🌾 · Next.js · hydro-irrigation
          </span>
        ),
        uploadMode: "zip",
        resultKind: "zip",
        runLabel: "运行 灌溉需水",
        resultPrefix: "hydro-irrigation_result",
        estimatedSeconds: 3,
        paramFields: [
          {
            name: "calc_mode",
            label: "计算模式",
            kind: "tabs",
            options: ["both", "crop", "irrigation"],
            default: "both",
          },
        ],
        renderPreview,
      }}
    />
  )
}
