import { cn } from "@/lib/format"

type Tone = "neutral" | "primary" | "success" | "warning" | "danger"

const tones: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-accent text-accent-foreground",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  danger: "bg-danger/12 text-danger",
}

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ---- Domain-specific status badges ---- */

export function CustomerStatusBadge({ status }: { status: string }) {
  const tone: Tone = status === "Active" ? "success" : status === "Lead" ? "warning" : "neutral"
  return <Badge tone={tone}>{status}</Badge>
}

export function ChallanStatusBadge({ status }: { status: string }) {
  const tone: Tone = status === "Confirmed" ? "success" : status === "Draft" ? "primary" : "danger"
  return <Badge tone={tone}>{status}</Badge>
}

export function MovementBadge({ type }: { type: string }) {
  return <Badge tone={type === "IN" ? "success" : "warning"}>{type}</Badge>
}

export function RoleBadge({ role }: { role: string }) {
  return <Badge tone="primary">{role}</Badge>
}
