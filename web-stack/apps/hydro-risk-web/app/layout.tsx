import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SiteNav, SiteFooter } from "@tlz/ui/shared"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })

export const metadata: Metadata = {
  title: "风险图数据 · 曾田力",
  description: "水利计算工具 · 风险图数据",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-track="hydro" className={inter.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SiteNav currentKey="hydro" />
        <div className="pt-16">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
