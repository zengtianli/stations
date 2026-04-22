import { fetchJson, type FetchInit } from "./base"

export interface HydroPlugin {
  name: string
  title: string
  icon: string
  order: number
  description: string
  version: string
  dir_name: string
  url: string
  installed: boolean
}

export interface InstallPluginPayload {
  git_url: string
}

export interface MutationResult {
  ok: true
  message: string
}

export class HydroToolkitClient {
  constructor(private readonly baseUrl: string = "") {}

  listPlugins(init?: FetchInit): Promise<HydroPlugin[]> {
    return fetchJson<HydroPlugin[]>(this.baseUrl, "/api/plugins", init)
  }

  installPlugin(payload: InstallPluginPayload): Promise<MutationResult> {
    return fetchJson<MutationResult>(this.baseUrl, "/api/plugins/install", {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
    })
  }

  uninstallPlugin(dirName: string): Promise<MutationResult> {
    return fetchJson<MutationResult>(
      this.baseUrl,
      `/api/plugins/${encodeURIComponent(dirName)}`,
      { method: "DELETE" },
    )
  }

  updatePlugin(dirName: string): Promise<MutationResult> {
    return fetchJson<MutationResult>(
      this.baseUrl,
      `/api/plugins/${encodeURIComponent(dirName)}/update`,
      { method: "POST" },
    )
  }
}

export const hydroToolkit = new HydroToolkitClient(
  process.env.NEXT_PUBLIC_API_BASE_HYDRO_TOOLKIT ?? "",
)
