import { NextResponse } from 'next/server'
import { SERVICE_GROUPS } from '@/lib/services'

interface ServiceStatus {
  status: 'up' | 'down' | 'unknown'
  responseTime?: number
  checkedAt: string
}

let cache: { data: Record<string, ServiceStatus>; timestamp: number } | null = null
const CACHE_TTL = 60_000

async function checkPort(port: number): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`http://127.0.0.1:${port}/`, {
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timeout)
    return {
      status: 'up', // any response = service is running
      responseTime: Date.now() - start,
      checkedAt: new Date().toISOString(),
    }
  } catch {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      checkedAt: new Date().toISOString(),
    }
  }
}

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    })
  }

  const services = SERVICE_GROUPS.flatMap(g => g.services).filter(s => s.port)
  const results = await Promise.all(
    services.map(async (s) => {
      const status = await checkPort(s.port!)
      return [s.subdomain, status] as const
    })
  )

  const data: Record<string, ServiceStatus> = Object.fromEntries(results)
  cache = { data, timestamp: Date.now() }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, max-age=60' },
  })
}
