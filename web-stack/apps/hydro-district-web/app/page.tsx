"use client"

import { HydroComputePage, formatBytes, type PreviewSectionDef } from "@tlz/ui"

interface ZipFile {
  name: string
  size: number
}

interface ZipGroups {
  input: ZipFile[]
  static: ZipFile[]
  other: ZipFile[]
}

interface ZipPreview {
  fileCount?: number
  totalSize?: number
  groups?: ZipGroups
}

function FileList({ files }: { files: ZipFile[] }) {
  if (!files || files.length === 0) {
    return <div className="text-xs text-[#86868b]">（无）</div>
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-foreground/10 max-h-[320px] overflow-y-auto">
      <table className="min-w-full text-xs">
        <thead className="bg-foreground/5 sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left font-medium whitespace-nowrap">文件名</th>
            <th className="px-3 py-2 text-right font-medium whitespace-nowrap">大小</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.name} className="border-t border-foreground/5 hover:bg-foreground/[0.02]">
              <td className="px-3 py-1.5 whitespace-nowrap font-mono">{f.name}</td>
              <td className="px-3 py-1.5 whitespace-nowrap text-right text-[#86868b]">
                {formatBytes(f.size)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderPreview(preview: unknown): PreviewSectionDef[] {
  const p = (preview ?? {}) as ZipPreview
  const groups = p.groups ?? { input: [], static: [], other: [] }
  const sections: PreviewSectionDef[] = [
    {
      key: "input",
      label: `📥 input_*.txt（${groups.input.length}）`,
      content: <FileList files={groups.input} />,
      defaultOpen: true,
    },
    {
      key: "static",
      label: `📦 static_*.txt（${groups.static.length}）`,
      content: <FileList files={groups.static} />,
      defaultOpen: false,
    },
  ]
  if (groups.other.length > 0) {
    sections.push({
      key: "other",
      label: `🗂️ 其他文件（${groups.other.length}）`,
      content: <FileList files={groups.other} />,
      defaultOpen: false,
    })
  }
  return sections
}

export default function HomePage() {
  return (
    <HydroComputePage
      config={{
        title: "河区调度",
        subtitle: "浙东河区调度模型，水平衡与分水枢纽计算",
        badge: (
          <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/70">
            🗺️ · Next.js · hydro-district
          </span>
        ),
        uploadMode: "zip",
        resultKind: "zip",
        runLabel: "运行 河区调度",
        resultPrefix: "hydro-district_result",
        estimatedSeconds: 30,
        renderPreview,
      }}
    />
  )
}
