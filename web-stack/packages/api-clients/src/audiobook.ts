import { fetchJson, subscribeSSE, type FetchInit } from "./base"

export type BookStatus = "queued" | "generating" | "done" | "error"

export interface ChapterMeta {
  index: number
  title: string
  status: "pending" | "generating" | "done" | "error"
  duration: number
  sentence_count: number
}

/** Matches `GET /api/books` shelf summary shape (see audiobook/app/routes/books.py). */
export interface BookSummary {
  id: string
  title: string
  voice: string
  status: BookStatus
  chapters: number
  duration: number
  created_at: string
}

/** Matches `GET /api/books/{id}` detail (BookMeta). */
export interface BookDetail {
  id: string
  title: string
  voice: string
  status: BookStatus
  chapters: ChapterMeta[]
  total_duration: number
  created_at: string
  error?: string | null
}

export interface Voice {
  id: string
  label: string
}

export interface VoiceCatalog {
  voices: Record<string, Voice>
  default: string
}

export interface CreateBookResult {
  id: string
  title: string
  chapters: number
}

export interface CreateBookPayload {
  voice?: string
  source_type: "file" | "text" | "url"
  /** Raw file upload (Blob), or inline markdown text, or URL string. */
  source: Blob | string
  file_name?: string
}

export class AudiobookClient {
  constructor(private readonly baseUrl: string = "") {}

  listBooks(init?: FetchInit): Promise<BookSummary[]> {
    return fetchJson<BookSummary[]>(this.baseUrl, "/api/books", init)
  }

  getBook(id: string, init?: FetchInit): Promise<BookDetail> {
    return fetchJson<BookDetail>(this.baseUrl, `/api/books/${encodeURIComponent(id)}`, init)
  }

  listVoices(init?: FetchInit): Promise<VoiceCatalog> {
    return fetchJson<VoiceCatalog>(this.baseUrl, "/api/voices", init)
  }

  async createBook(payload: CreateBookPayload): Promise<CreateBookResult> {
    const form = new FormData()
    if (payload.voice) form.set("voice", payload.voice)
    if (payload.source_type === "file") {
      if (!(payload.source instanceof Blob)) {
        throw new Error("createBook: source_type=file requires a Blob source")
      }
      form.set("file", payload.source, payload.file_name ?? "book.md")
    } else if (payload.source_type === "text") {
      if (typeof payload.source !== "string") {
        throw new Error("createBook: source_type=text requires a string source")
      }
      form.set("text", payload.source)
    } else {
      if (typeof payload.source !== "string") {
        throw new Error("createBook: source_type=url requires a string source")
      }
      form.set("url", payload.source)
    }
    return fetchJson<CreateBookResult>(this.baseUrl, "/api/books", {
      method: "POST",
      body: form,
    })
  }

  deleteBook(id: string, adminPassword: string): Promise<{ ok: true }> {
    return fetchJson<{ ok: true }>(this.baseUrl, `/api/books/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "X-Admin-Password": adminPassword },
    })
  }

  audioUrl(bookId: string, chapter: number): string {
    return `${this.baseUrl}/api/books/${encodeURIComponent(bookId)}/audio/${chapter}`
  }

  syncUrl(bookId: string, chapter: number): string {
    return `${this.baseUrl}/api/books/${encodeURIComponent(bookId)}/sync/${chapter}`
  }

  /** SSE stream of BookDetail snapshots until status ∈ {done, error}. */
  subscribeProgress(
    bookId: string,
    onEvent: (ev: BookDetail) => void,
    onError?: (e: Event) => void,
  ): () => void {
    return subscribeSSE<BookDetail>(
      this.baseUrl,
      `/api/books/${encodeURIComponent(bookId)}/progress`,
      onEvent,
      onError,
    )
  }
}

export const audiobook = new AudiobookClient(
  process.env.NEXT_PUBLIC_API_BASE_AUDIOBOOK ?? "",
)
