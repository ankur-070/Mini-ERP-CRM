"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/format"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/states"

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  loading,
  error,
  tone = "primary",
  hint,
}: {
  label: string
  value: number | string | null
  icon: React.ComponentType<{ className?: string }>
  href?: string
  loading?: boolean
  error?: boolean
  tone?: "primary" | "success" | "warning" | "danger"
  hint?: string
}) {
  const toneClasses: Record<string, string> = {
    primary: "bg-accent text-accent-foreground",
    success: "bg-success/12 text-success",
    warning: "bg-warning/12 text-warning",
    danger: "bg-danger/12 text-danger",
  }

  const body = (
    <Card className="h-full p-5 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-md", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        {href ? <ArrowUpRight className="h-4 w-4 text-muted-foreground" /> : null}
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-1 min-h-9">
          {loading ? (
            <Spinner className="mt-2 text-muted-foreground" />
          ) : error ? (
            <p className="text-sm text-muted-foreground">Unavailable</p>
          ) : (
            <p className="font-mono text-2xl font-semibold text-foreground">{value ?? "—"}</p>
          )}
        </div>
        {hint && !loading && !error ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </Card>
  )

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  )
}
