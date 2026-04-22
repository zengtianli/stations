import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { TrackProvider } from "@/components/track-provider"
import { Inter } from "next/font/google"
import { siteConfig, openGraph, twitter } from "@/lib/seo-config"
import type { Metadata } from "next"
import { GoogleAnalytics } from '@next/third-parties/google'
import { ScrollToTop } from "@/components/scroll-to-top"
import { ThemeColorMeta } from "@/components/theme-color"
import ServiceWorkerRegister from "@/components/sw-register"

import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap', // ⚡ 防止字体阻塞渲染
})


export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
  openGraph,
  twitter,
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: siteConfig.url,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Google Search Console 验证码
    google: "57QMT0cs1Wp51nZDwFjr5xHBB0XeFqd44328Ow4r2bw",
    // 百度站长平台验证码
    baidu: "codeva-YKWD5513P7",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="baidu-site-verification" content="codeva-YKWD5513P7" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "曾田力",
              jobTitle: "水利工程师",
              worksFor: {
                "@type": "Organization",
                name: "浙江省水利水电规划设计院",
              },
              alumniOf: {
                "@type": "EducationalOrganization",
                name: "浙江大学",
              },
              email: "zengtianli1@126.com",
              url: siteConfig.url,
              sameAs: [
                "https://www.linkedin.com/in/tianli-zeng-4068a7190/",
                "https://github.com/zengtianli",
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        {/* Skip to main content link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-accent-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          跳转到主要内容
        </a>
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" disableTransitionOnChange>
          <TrackProvider>
            <ThemeColorMeta />
            <main id="main-content" className="pt-16">{children}</main>
            <ScrollToTop />
            <ServiceWorkerRegister />
          </TrackProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId="G-0SLC09HKNF" />
      </body>
    </html>
  )
}
