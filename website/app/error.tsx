'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 清理可能导致 ByteString 崩溃的非 ASCII cookie
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim()
      // 检测 cookie 名或值是否有非 ASCII 字符
      let hasNonAscii = false
      for (let i = 0; i < cookie.length; i++) {
        if (cookie.charCodeAt(i) > 127) {
          hasNonAscii = true
          break
        }
      }
      if (hasNonAscii) {
        // 删除这个 cookie
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      }
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">出了点问题</h1>
        <p className="text-muted-foreground">页面加载时发生错误，已自动清理可能的问题。</p>
        <button
          onClick={() => {
            // 强制刷新，不用缓存
            window.location.reload()
          }}
          className="px-6 py-2 bg-accent text-accent-foreground rounded-md hover:opacity-90 transition-opacity"
        >
          刷新页面
        </button>
      </div>
    </div>
  )
}
