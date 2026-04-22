'use client'

import { useEffect } from 'react'
import { useTrack } from '@/components/track-provider'

/**
 * Clears the active track on mount (deletes cookie, resets direction).
 * Used on homepage to reset direction state.
 */
export function TrackClearer() {
  const { clearTrack } = useTrack()

  useEffect(() => {
    clearTrack()
  }, [clearTrack])

  return null
}
