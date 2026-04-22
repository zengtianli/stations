/**
 * Shared fetch primitives for @tlz/api-clients. All typed clients pass an
 * explicit base URL; in production Next.js apps that value is an empty string
 * so calls hit the same origin (reverse-proxied by Nginx to FastAPI). In
 * development it points at 127.0.0.1:<port>.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export type FetchInit = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null
}

function resolveUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//.test(path)) return path
  const trimmedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
  const trimmedPath = path.startsWith("/") ? path : `/${path}`
  return `${trimmedBase}${trimmedPath}`
}

export async function fetchJson<T>(
  baseUrl: string,
  path: string,
  init: FetchInit = {},
): Promise<T> {
  const { body, headers, ...rest } = init
  const finalHeaders = new Headers(headers)
  let finalBody: BodyInit | undefined

  if (body instanceof FormData || body instanceof Blob || typeof body === "string") {
    finalBody = body
  } else if (body && typeof body === "object") {
    if (!finalHeaders.has("content-type")) finalHeaders.set("content-type", "application/json")
    finalBody = JSON.stringify(body)
  }

  const res = await fetch(resolveUrl(baseUrl, path), {
    ...rest,
    headers: finalHeaders,
    body: finalBody ?? null,
  })

  const text = await res.text()
  const parsed = text ? safeJsonParse(text) : undefined

  if (!res.ok) {
    throw new ApiError(`${rest.method ?? "GET"} ${path} → ${res.status}`, res.status, parsed ?? text)
  }
  return parsed as T
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/** Minimal EventSource wrapper for Server-Sent-Events consumers. */
export function subscribeSSE<T>(
  baseUrl: string,
  path: string,
  onMessage: (data: T) => void,
  onError?: (err: Event) => void,
): () => void {
  if (typeof EventSource === "undefined") {
    throw new Error("subscribeSSE requires a browser EventSource environment")
  }
  const es = new EventSource(resolveUrl(baseUrl, path))
  es.onmessage = (ev) => {
    try {
      onMessage(JSON.parse(ev.data) as T)
    } catch {
      onMessage(ev.data as unknown as T)
    }
  }
  if (onError) es.onerror = onError
  return () => es.close()
}
