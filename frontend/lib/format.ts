export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ")
}

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
})

export function formatCurrency(value: string | number | null | undefined): string {
  const num = typeof value === "string" ? Number.parseFloat(value) : value
  if (num === null || num === undefined || Number.isNaN(num)) return "—"
  return INR.format(num)
}

export function formatNumber(value: string | number | null | undefined): string {
  const num = typeof value === "string" ? Number.parseFloat(value) : value
  if (num === null || num === undefined || Number.isNaN(num)) return "—"
  return new Intl.NumberFormat("en-IN").format(num)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Convert an ISO datetime to a value usable by <input type="date">. */
export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}
