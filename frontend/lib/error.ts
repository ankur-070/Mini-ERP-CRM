import { ApiClientError } from "@/lib/api/client"

/**
 * Turn any thrown value into a human-readable message. We preserve the
 * backend's error.message (never replace it with a generic string) and only
 * fall back for unexpected/non-API errors.
 */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiClientError) return err.message
  if (err instanceof Error) return err.message
  return "An unexpected error occurred."
}

export function errorCode(err: unknown): string | null {
  if (err instanceof ApiClientError) return err.code
  return null
}

/** Extract validation field details when the backend returns VALIDATION_ERROR. */
export function validationDetails(err: unknown): { field: string; message: string }[] {
  if (!(err instanceof ApiClientError)) return []
  const details = err.details
  if (!Array.isArray(details)) return []
  return details
    .map((d) => {
      if (d && typeof d === "object") {
        const rec = d as Record<string, unknown>
        const field = Array.isArray(rec.path) ? rec.path.join(".") : String(rec.field ?? rec.path ?? "")
        const message = String(rec.message ?? "")
        if (message) return { field, message }
      }
      return null
    })
    .filter((x): x is { field: string; message: string } => x !== null)
}
