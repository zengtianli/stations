/**
 * Track 内容解析器
 * 将带 tracks overlay 的 metadata 解析为当前 track 的最终值
 */

import { type Track, DEFAULT_TRACK } from './track'

/**
 * 浅合并 track overlay 到 base metadata
 * 如果 metadata.tracks[track] 存在，其字段覆盖 base 字段
 */
export function resolveTrackContent<T extends Record<string, any>>(
  metadata: T,
  track: Track
): Omit<T, 'tracks'> {
  const { tracks, ...base } = metadata
  if (!tracks || track === DEFAULT_TRACK || !tracks[track]) {
    return base as Omit<T, 'tracks'>
  }
  return { ...base, ...tracks[track] } as Omit<T, 'tracks'>
}

/**
 * 按 track 指定的顺序重排数组（如技能分类）
 * order 中的项排在前面，剩余项保持原顺序追加
 */
export function resolveTrackArray<T extends { name: string }>(
  items: T[],
  order: string[] | undefined
): T[] {
  if (!order?.length) return items
  const map = new Map(items.map(i => [i.name, i]))
  const ordered = order.map(name => map.get(name)).filter(Boolean) as T[]
  const remaining = items.filter(i => !order.includes(i.name))
  return [...ordered, ...remaining]
}
