'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTrack } from '@/components/track-provider'
import type { Track } from '@/lib/track'

const THEME_COLORS: Record<Track, string> = {
  hydro:    '#E3F0FF',
  ai:       '#F0E8FF',
  devtools: '#DFFBE9',
  indie:    '#FFF3D6',
}

const DEFAULT_COLOR = '#f5f5f7'

/**
 * 动态设置浏览器地址栏颜色，跟方向主题色走
 * 首页用默认灰，其他页面用方向色（无方向时默认 hydro）
 */
export function ThemeColorMeta() {
  const { activeDirection } = useTrack()
  const pathname = usePathname()

  useEffect(() => {
    const isHomepage = pathname === '/'
    const color = isHomepage
      ? DEFAULT_COLOR
      : THEME_COLORS[activeDirection || 'hydro']

    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = color
  }, [activeDirection, pathname])

  return null
}
