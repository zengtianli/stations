import { NextResponse } from "next/server"
import { promises as fs } from "node:fs"
import path from "node:path"

const DATA_CANDIDATES = [
  path.join(process.cwd(), "data/hs_config.json"),
  "/opt/ops-console/data/hs_config.json",
  path.join(process.env.HOME || "", "Dev/ops-console/data/hs_config.json"),
]

export async function GET() {
  for (const p of DATA_CANDIDATES) {
    try {
      const data = await fs.readFile(p, "utf-8")
      return NextResponse.json({ source: p, ...JSON.parse(data) })
    } catch {}
  }
  return NextResponse.json({ error: "hs_config.json not found", tried: DATA_CANDIDATES }, { status: 404 })
}
