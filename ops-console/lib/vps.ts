import { exec as execCb } from "node:child_process"
import { promisify } from "node:util"

const exec = promisify(execCb)

export async function run(cmd: string, timeoutMs = 10000): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const { stdout, stderr } = await exec(cmd, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 })
    return { stdout, stderr, code: 0 }
  } catch (e: any) {
    return { stdout: e.stdout || "", stderr: e.stderr || String(e), code: e.code ?? 1 }
  }
}

export interface ServiceStatus {
  service: string
  status: "active" | "failed" | "inactive" | "unknown"
  memory?: string
  domain?: string
}

const TIANLI_HOSTS_CACHE: Record<string, string> = {}

async function discoverNginxHosts() {
  if (Object.keys(TIANLI_HOSTS_CACHE).length) return TIANLI_HOSTS_CACHE
  // grep server_name → port proxy_pass mapping
  const { stdout } = await run(
    "grep -RhD read -E '(server_name|proxy_pass)' /etc/nginx/sites-enabled/ 2>/dev/null || true"
  )
  let currentHost = ""
  for (const line of stdout.split("\n")) {
    const s = line.trim()
    const sn = s.match(/^server_name\s+(\S+?);/)
    if (sn) { currentHost = sn[1]; continue }
    const pp = s.match(/proxy_pass\s+http:\/\/127\.0\.0\.1:(\d+)/)
    if (pp && currentHost) TIANLI_HOSTS_CACHE[pp[1]] = currentHost
  }
  return TIANLI_HOSTS_CACHE
}

function portFromExec(exec: string): string | undefined {
  const argv = extractArgv(exec)
  const m =
    argv.match(/--server\.port[=\s]+(\d+)/) ||
    argv.match(/--port[=\s]+(\d+)/) ||
    argv.match(/:(\d+)\b/) ||
    argv.match(/\b(\d{4,5})\b/)
  return m?.[1]
}

// systemctl show ExecStart --value returns: "{ path=X ; argv[]=X Y Z ; ... }"
// Extract the argv[] portion for pattern matching.
function extractArgv(execStart: string): string {
  const m = execStart.match(/argv\[\]=([^;]+?)\s*;/)
  return (m?.[1] || execStart).trim()
}

// Whitelist: service must have argv/WorkingDirectory anchored in user-installed paths.
const USER_ROOT_DIRS = [/^\/opt\/\w/, /^\/var\/www\//]
const USER_EXEC_PATTERNS = [
  /\/opt\/\w/,
  /\/var\/www\//,
  /\/usr\/local\/bin\/streamlit\b/,
  /uvicorn\b/,
]

function isUserService(execStart: string, workingDir: string): boolean {
  const argv = extractArgv(execStart)
  if (argv && USER_EXEC_PATTERNS.some((p) => p.test(argv))) return true
  if (workingDir && USER_ROOT_DIRS.some((p) => p.test(workingDir))) return true
  return false
}

export async function listSystemdServices(): Promise<ServiceStatus[]> {
  const { stdout } = await run(
    "systemctl list-units --type=service --state=active,failed,inactive --no-legend --no-pager 2>/dev/null"
  )
  const hostMap = await discoverNginxHosts()
  const services: ServiceStatus[] = []
  for (const line of stdout.split("\n")) {
    const parts = line.trim().split(/\s+/)
    if (parts.length < 4) continue
    const [unit, , active] = parts
    if (!unit.endsWith(".service")) continue
    const name = unit.replace(/\.service$/, "")
    // Fetch ExecStart + MemoryCurrent + WorkingDirectory
    const props = await run(`systemctl show ${unit} -p MemoryCurrent,ExecStart,WorkingDirectory --value 2>/dev/null`)
    const lines = props.stdout.trim().split("\n")
    const execLine = lines.find((l) => l.startsWith("{")) || ""
    const memLine = lines.find((l) => /^\d+$/.test(l.trim())) || "0"
    const wdLine = lines.find((l) => l.startsWith("/") && !l.startsWith("{")) || ""
    if (!isUserService(execLine, wdLine)) continue
    const status = active === "active" ? "active" : active === "failed" ? "failed" : "inactive"
    const memNum = parseInt(memLine, 10)
    const memory = memNum > 0 ? formatBytes(memNum) : undefined
    const port = portFromExec(execLine)
    const domain = port ? hostMap[port] : undefined
    services.push({ service: name, status, memory, domain })
  }
  return services.sort((a, b) => (a.status === b.status ? a.service.localeCompare(b.service) : a.status === "active" ? -1 : 1))
}

export interface DockerStatus {
  name: string
  status: "running" | "exited" | "unknown"
  detail: string
}

export async function listDocker(): Promise<DockerStatus[]> {
  const { stdout } = await run(
    `docker ps -a --format '{{.Names}}\t{{.Status}}' 2>/dev/null`
  )
  return stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [name, status] = line.split("\t")
      return {
        name,
        status: status?.startsWith("Up") ? "running" : status?.startsWith("Exited") ? "exited" : "unknown",
        detail: status ?? "",
      } as DockerStatus
    })
}

export async function systemMetrics() {
  const disk = (await run("df -h / | awk 'NR==2 {print $5}'")).stdout.trim()
  const mem = (await run("free -h | awk '/^Mem:/ {print $3 \"/\" $2}'")).stdout.trim()
  const uptime = (await run("uptime -p")).stdout.trim()
  return { disk, mem, uptime }
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b}B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)}KB`
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(0)}MB`
  return `${(b / 1024 / 1024 / 1024).toFixed(1)}GB`
}
