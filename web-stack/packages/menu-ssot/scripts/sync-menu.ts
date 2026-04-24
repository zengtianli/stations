#!/usr/bin/env tsx
/**
 * Mirror ~/Dev/stations/website/lib/shared-navbar.generated.ts into
 * ~/Dev/stations/web-stack/packages/menu-ssot/src/generated.ts.
 *
 * Keeps `/menus-audit` and `/navbar-refresh` workflows intact — this script is
 * purely a *consumer* of the existing Python SSOT renderer, never a competing
 * generator.
 */
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const HOME = homedir()
const MENUS_TOOL = resolve(HOME, "Dev/devtools/lib/tools/menus.py")
// website may live at stations/website (promoted) or ~/Dev/stations/website (incubation).
const WEBSITE_GENERATED_CANDIDATES = [
  resolve(HOME, "Dev/stations/website/lib/shared-navbar.generated.ts"),
  resolve(HOME, "Dev/website/lib/shared-navbar.generated.ts"),
]
const WEBSITE_GENERATED =
  WEBSITE_GENERATED_CANDIDATES.find(existsSync) ?? WEBSITE_GENERATED_CANDIDATES[0]

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(HERE, "../src/generated.ts")

function run(cmd: string, args: string[]): { code: number; stdout: string; stderr: string } {
  const res = spawnSync(cmd, args, { encoding: "utf8" })
  return { code: res.status ?? -1, stdout: res.stdout ?? "", stderr: res.stderr ?? "" }
}

function main(): number {
  if (!existsSync(MENUS_TOOL)) {
    console.error(`[menu-ssot] ERROR: ${MENUS_TOOL} not found`)
    return 1
  }

  // Force website generator to refresh its own copy (idempotent if yaml unchanged).
  const build = run("python3", [MENUS_TOOL, "build-website-navbar", "-w"])
  if (build.code !== 0) {
    console.error(`[menu-ssot] build-website-navbar failed:\n${build.stderr || build.stdout}`)
    return 1
  }

  if (!existsSync(WEBSITE_GENERATED)) {
    console.error(`[menu-ssot] Expected file missing after build: ${WEBSITE_GENERATED}`)
    return 1
  }

  const contents = readFileSync(WEBSITE_GENERATED, "utf8")
  const header = `// Mirrored from ${WEBSITE_GENERATED.replace(HOME, "~")} via @tlz/menu-ssot sync-menu.\n`
  writeFileSync(OUT, header + contents, "utf8")
  console.log(`[menu-ssot] Wrote ${OUT} (${contents.length} bytes)`)
  return 0
}

process.exit(main())
