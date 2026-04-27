import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SiteNav, SiteFooter, SearchTrigger } from "@tlz/ui/shared"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })

export const metadata: Metadata = {
  metadataBase: new URL("https://audiobook.tianlizeng.cloud"),
  title: "Audiobook · 曾田力",
  description: "Markdown 转有声书 · 逐句高亮同步播放",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-track="devtools" className={inter.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SiteNav rightSlot={<SearchTrigger />} />
        {/* Offset for fixed SiteNav */}
        <div className="pt-16">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  )
}
