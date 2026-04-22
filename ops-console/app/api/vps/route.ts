import { NextResponse } from "next/server"
import { listSystemdServices, listDocker, systemMetrics } from "@/lib/vps"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const [services, docker, metrics] = await Promise.all([
      listSystemdServices(),
      listDocker(),
      systemMetrics(),
    ])
    return NextResponse.json({ services, docker, metrics })
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
