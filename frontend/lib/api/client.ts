import type { ApiEnvelope, ApiMeta } from "@/types/api"

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api/v1"

const TOKEN_KEY = "fundsroom_token"
const USER_KEY = "fundsroom_user"

/**
 * Frontend representation of a backend error. Carries the backend's
 * error.code / error.message / error.details so screens can show precise,
 * human-readable feedback instead of a generic message.
 */
export class ApiClientError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = "ApiClientError"
    this.status = status
    this.code = code
    this.details = details
  }
}

/* ------------------------------------------------------------------ */
/* Session token storage (browser only)                               */
/* ------------------------------------------------------------------ */

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function getStoredUser<T = unknown>(): T | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function setStoredUser(user: unknown): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}

/**
 * Fired when the API returns 401. The auth provider listens for this to
 * clear the session and redirect to /login without every caller needing
 * to handle it.
 */
export const UNAUTHORIZED_EVENT = "fundsroom:unauthorized"

function emitUnauthorized() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
}

/* ------------------------------------------------------------------ */
/* Core request helper                                                */
/* ------------------------------------------------------------------ */

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  /** Skip attaching the Authorization header (e.g. login). */
  auth?: boolean
  signal?: AbortSignal
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function request<T>(
  path: string,
  { method = "GET", body, query, auth = true, signal }: RequestOptions = {},
): Promise<{ data: T; meta?: ApiMeta; message: string }> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers["Content-Type"] = "application/json"

  if (auth) {
    const token = getToken()
    if (token) headers["Authorization"] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch {
    // Network / CORS / server-down failures never produce a JSON envelope.
    throw new ApiClientError(
      0,
      "NETWORK_ERROR",
      "Unable to reach the server. Check that the backend is running and reachable.",
    )
  }

  // 204 or empty bodies
  const text = await res.text()
  let payload: ApiEnvelope<T> | null = null
  if (text) {
    try {
      payload = JSON.parse(text) as ApiEnvelope<T>
    } catch {
      payload = null
    }
  }

  if (!res.ok || !payload || payload.success === false) {
    if (res.status === 401) {
      clearSession()
      emitUnauthorized()
    }

    if (payload && payload.success === false) {
      throw new ApiClientError(
        res.status,
        payload.error.code,
        payload.error.message,
        payload.error.details,
      )
    }

    throw new ApiClientError(
      res.status,
      "UNEXPECTED_ERROR",
      `Request failed with status ${res.status}.`,
    )
  }

  return { data: payload.data, meta: payload.meta, message: payload.message }
}

export const apiClient = {
  get: <T>(path: string, query?: RequestOptions["query"], opts?: Omit<RequestOptions, "method" | "query" | "body">) =>
    request<T>(path, { ...opts, method: "GET", query }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "POST", body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, "method">) =>
    request<T>(path, { ...opts, method: "DELETE" }),
}
