/**
 * 服务端 track 读取
 * 只从 URL searchParams 读取，不读 cookies（避免 Next.js ByteString 崩溃）
 * Cookie 持久化由客户端 TrackProvider 处理
 */

import { DEFAULT_TRACK, isValidTrack, type Track } from './track'

export async function getServerTrack(
  searchParams?: Record<string, string | string[] | undefined>
): Promise<Track> {
  const fromQuery = searchParams?.track
  if (typeof fromQuery === 'string' && isValidTrack(fromQuery)) return fromQuery
  return DEFAULT_TRACK
}
