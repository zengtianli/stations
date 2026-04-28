import type { Metadata } from "next"
import { Inter } from "next/font/google"
import SharedNavbar from "@/components/shared-navbar"
import SiteHeader from "@/components/site-header"
import SectionNav from "@/components/section-nav"
import SiteFooter from "@/components/site-footer"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  metadataBase: new URL("https://dashboard.tianlizeng.cloud"),
  title: "Dashboard · 曾田力",
  description: "VPS / Auggie / Hammerspoon 运维控制台",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="font-sans min-h-screen pt-16 flex flex-col">
        <SharedNavbar />
        <SiteHeader />
        <SectionNav />
        <main className="max-w-5xl mx-auto px-6 py-6 md:px-8 flex-1 w-full">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
