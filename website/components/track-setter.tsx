'use client'

import { useEffect } from 'react'
import { useTrack } from '@/components/track-provider'
import type { Track } from '@/lib/track'

/**
 * Sets the active track on mount (writes cookie + data-track attribute).
 * Does NOT trigger router.refresh().
 */
export function TrackSetter({ track }: { track: Track }) {
  const { setTrack } = useTrack()

  useEffect(() => {
    setTrack(track)
  }, [track, setTrack])

  return null
}
