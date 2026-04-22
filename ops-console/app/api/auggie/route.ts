import { NextResponse } from "next/server"
import { promises as fs } from "node:fs"
import path from "node:path"

const DATA_CANDIDATES = [
  path.join(process.cwd(), "data/auggie-scan.json"),
  "/opt/ops-console/data/auggie-scan.json",
  path.join(process.env.HOME || "", "Dev/labs/auggie-dashboard/data/scan.json"),
]

export async function GET() {
  for (const p of DATA_CANDIDATES) {
    try {
      const repos = JSON.parse(await fs.readFile(p, "utf-8"))
      return NextResponse.json({ source: p, repos })
    } catch {}
  }
  return NextResponse.json({ error: "scan.json not found", tried: DATA_CANDIDATES }, { status: 404 })
}
