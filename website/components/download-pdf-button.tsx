"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { downloadConfig } from "@/lib/profile-config"

interface DownloadPDFButtonProps {
  filename?: string
}

export default function DownloadPDFButton({ filename = downloadConfig.filename }: DownloadPDFButtonProps) {
  const handleDownload = () => {
    // 创建下载链接
    const link = document.createElement('a')
    link.href = downloadConfig.fullPath
    link.download = `${filename}.pdf`
    link.click()
  }

  return (
    <Button size="sm" onClick={handleDownload}>
      <Download className="h-4 w-4 mr-2" />
      {downloadConfig.text}
    </Button>
  )
}
