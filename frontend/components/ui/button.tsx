"use client"

import { forwardRef } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/format"

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger"
type Size = "sm" | "md" | "icon"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/60",
  secondary:
    "bg-muted text-foreground hover:bg-muted/70 disabled:opacity-60",
  outline:
    "border border-input bg-card text-foreground hover:bg-muted disabled:opacity-60",
  ghost: "text-foreground hover:bg-muted disabled:opacity-60",
  danger: "bg-danger text-danger-foreground hover:bg-danger/90 disabled:bg-danger/60",
}

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  icon: "h-9 w-9 justify-center",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  )
})
