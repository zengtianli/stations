/**
 * Markdown 渲染组件
 * 支持 GFM / 代码高亮 / KaTeX 数学公式 / Mermaid 流程图
 */

"use client"

import { useEffect, useState, useRef, useId } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import { cn } from '@/lib/utils'
import 'highlight.js/styles/github-dark.css'
import 'katex/dist/katex.min.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

// Mermaid 客户端渲染（按需加载，避免 SSR）
function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const id = `mermaid-${useId().replace(/[:]/g, '')}`

  useEffect(() => {
    let cancelled = false
    const trimmed = code.trim()
    if (!trimmed || !ref.current) return
    ;(async () => {
      try {
        const mod = await import('mermaid')
        const mermaid = mod.default
        mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' })
        const { svg } = await mermaid.render(id, trimmed)
        if (!cancelled && ref.current) ref.current.innerHTML = svg
      } catch (e) {
        if (!cancelled && ref.current) {
          ref.current.innerHTML = `<pre class="text-red-500">Mermaid 渲染失败: ${(e as Error).message}</pre>`
        }
      }
    })()
    return () => { cancelled = true }
  }, [code, id])

  return <div ref={ref} className="my-6 flex justify-center overflow-x-auto" />
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        "markdown-content prose prose-slate dark:prose-invert max-w-none",
        "prose-headings:font-bold prose-headings:text-foreground",
        "prose-p:text-muted-foreground prose-p:leading-relaxed",
        "prose-a:text-primary hover:prose-a:text-primary/80",
        "prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded",
        "prose-pre:bg-muted prose-pre:border",
        "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground",
        "prose-table:text-sm prose-th:text-foreground prose-td:text-muted-foreground",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-sm sm:prose-base",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex, rehypeHighlight]}
        components={{
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const lang = match?.[1]

            if (lang === 'mermaid') {
              return <MermaidBlock code={String(children).replace(/\n$/, '')} />
            }

            if (inline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary" {...props}>
                  {children}
                </code>
              )
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },

          pre: ({ children }: any) => {
            // 如果 children 是 mermaid，已经被 code 替换了；其他正常 pre
            return (
              <pre className="bg-muted border rounded-lg p-4 overflow-x-auto">
                {children}
              </pre>
            )
          },

          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse border border-border rounded-lg">
                {children}
              </table>
            </div>
          ),

          th: ({ children }) => (
            <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">
              {children}
            </th>
          ),

          td: ({ children }) => (
            <td className="border border-border px-4 py-2">
              {children}
            </td>
          ),

          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-l-primary bg-muted/30 pl-4 py-2 my-4 italic">
              {children}
            </blockquote>
          ),

          a: ({ href, children }) => {
            const isExternal = href && /^https?:/.test(href)
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-primary hover:text-primary/80 underline underline-offset-4"
              >
                {children}
              </a>
            )
          },

          h1: ({ children }) => {
            const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '')
            return <h1 id={id} className="scroll-mt-20">{children}</h1>
          },
          h2: ({ children }) => {
            const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '')
            return <h2 id={id} className="scroll-mt-20">{children}</h2>
          },
          h3: ({ children }) => {
            const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '')
            return <h3 id={id} className="scroll-mt-20">{children}</h3>
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
