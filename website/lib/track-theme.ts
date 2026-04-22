/**
 * 方向主题色 — 全站共享
 * pageBg: 整页背景（极淡）
 * cardBg: 首页方向卡片背景（稍深）
 */

import type { Track } from './track'

export const TRACK_PAGE_BG: Record<Track, string> = {
  hydro:    'bg-[#E3F0FF]',
  ai:       'bg-[#F0E8FF]',
  devtools: 'bg-[#DFFBE9]',
  indie:    'bg-[#FFF3D6]',
}
