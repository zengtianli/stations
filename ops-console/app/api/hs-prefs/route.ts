import { NextResponse } from "next/server"
import { promises as fs } from "node:fs"
import path from "node:path"

export const dynamic = "force-dynamic"

const PREFS_PATH = path.join(process.cwd(), "data/hs_prefs.json")

async function readPrefs() {
  try {
    const raw = await fs.readFile(PREFS_PATH, "utf-8")
    return JSON.parse(raw)
  } catch {
    return { version: "1.0", updated_at: "", hotkeys: {}, raycast: {} }
  }
}

export async function GET() {
  return NextResponse.json(await readPrefs())
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 })
  }

  const current = await readPrefs()
  const next = {
    version: "1.0",
    updated_at: new Date().toISOString(),
    hotkeys: { ...current.hotkeys, ...(body.hotkeys || {}) },
    raycast: { ...current.raycast, ...(body.raycast || {}) },
  }

  await fs.mkdir(path.dirname(PREFS_PATH), { recursive: true })
  await fs.writeFile(PREFS_PATH, JSON.stringify(next, null, 2), "utf-8")
  return NextResponse.json({ ok: true, prefs: next })
}
