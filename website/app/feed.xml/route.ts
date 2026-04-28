/**
 * RSS 2.0 feed - 全部 blog（local + 跨仓）最新 50 篇
 *
 * force-static: 在 build 时生成，避免在 VPS 运行时跨仓读 ~/Dev/content（不存在）。
 */

import { getAllBlogPosts } from '@/lib/content'

export const dynamic = 'force-static'

const SITE_URL = 'https://tianlizeng.cloud'
const SITE_TITLE = '曾田力的技术博客'
const SITE_DESC = '水利工程 / AI 工程 / 投资 / 学习笔记'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const all = await getAllBlogPosts()
  const posts = all.slice(0, 50)
  const now = new Date().toUTCString()

  const items = posts
    .map((p) => {
      const url = `${SITE_URL}/blog/${p.slug}`
      const pubDate = new Date(p.date).toUTCString()
      const cat = p.category ? `\n      <category>${escapeXml(p.category)}</category>` : ''
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(p.excerpt)}</description>${cat}
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}/blog</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
