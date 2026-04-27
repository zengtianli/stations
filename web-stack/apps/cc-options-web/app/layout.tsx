import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SiteNav, SiteFooter, SearchTrigger } from "@tlz/ui/shared"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })

export const metadata: Metadata = {
  metadataBase: new URL("https://cc-options.tianlizeng.cloud"),
  title: "QQQ CC Dashboard · 曾田力",
  description: "QQQ Covered Call 期权交易仪表盘",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-track="indie" className={inter.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SiteNav currentKey="cc-options" rightSlot={<SearchTrigger />} />
        <div className="pt-16">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
