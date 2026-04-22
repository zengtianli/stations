import { NextResponse } from 'next/server'
import { SERVICE_GROUPS } from '@/lib/services'

interface ServiceMetadata {
  name?: string
  title?: string
  icon?: string
  description?: string
  version?: string
  service_id?: string
  service_type?: string
  port?: number
  compute_endpoint?: string | null
  input_formats?: string[]
  output_formats?: string[]
  deployed_at?: number
}

interface ServiceReport {
  subdomain: string
  public_port: number
  api_port: number
  http_status: number | null
  response_ms: number | null
  metadata: ServiceMetadata | null
  error: string | null
}

// Port convention: FastAPI = Streamlit era port + 100 (see web-stack/CLAUDE.md)
const API_PORT_OFFSET = 100
const AUDIOBOOK_SUBDOMAIN = 'audiobook'
const TIMEOUT_MS = 2000
const CACHE_TTL_MS = 30_000

let cache: { data: unknown; timestamp: number } | null = null

function apiPort(subdomain: string, port: number): number {
  return subdomain === AUDIOBOOK_SUBDOMAIN ? port : port + API_PORT_OFFSET
}

async function probe(subdomain: string, publicPort: number): Promise<ServiceReport> {
  const port = apiPort(subdomain, publicPort)
  const start = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/metadata`, {
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timer)
    const body = (await res.json()) as ServiceMetadata
    return {
      subdomain,
      public_port: publicPort,
      api_port: port,
      http_status: res.status,
      response_ms: Date.now() - start,
      metadata: body,
      error: null,
    }
  } catch (e) {
    clearTimeout(timer)
    return {
      subdomain,
      public_port: publicPort,
      api_port: port,
      http_status: null,
      response_ms: Date.now() - start,
      metadata: null,
      error: (e as Error).message,
    }
  }
}

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cache.data, {
      headers: { 'Cache-Control': 'public, max-age=30' },
    })
  }

  const scanStart = Date.now()
  const services = SERVICE_GROUPS.flatMap(g => g.services).filter(s => s.port)
  const reports = await Promise.all(
    services.map(s => probe(s.subdomain, s.port!))
  )
  const summary = {
    total: reports.length,
    healthy: reports.filter(r => r.http_status === 200).length,
    slow: reports.filter(r => r.response_ms !== null && r.response_ms > 1000 && r.http_status === 200).length,
    down: reports.filter(r => r.http_status !== 200).length,
  }
  const payload = {
    timestamp: new Date().toISOString(),
    scan_duration_ms: Date.now() - scanStart,
    summary,
    services: reports,
  }
  cache = { data: payload, timestamp: Date.now() }
  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, max-age=30' },
  })
}
