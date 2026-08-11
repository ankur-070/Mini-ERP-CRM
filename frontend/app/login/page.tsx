"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Layers, AlertCircle, ArrowRight, Eye, EyeOff, Check } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { errorMessage } from "@/lib/error"
import { Button } from "@/components/ui/button"
import { Field, Input } from "@/components/ui/field"

export default function LoginPage() {
  const { status, login } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard")
  }, [status, router])

  function validate(): boolean {
    const next: typeof errors = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Please enter a valid email address."
    }
    if (!password || password.length < 6) {
      next.password = "Password must be at least 6 characters."
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!validate()) return
    setSubmitting(true)
    try {
      await login({ email: email.trim(), password })
      router.replace("/dashboard")
    } catch (err) {
      setFormError("Invalid email or password. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background lg:flex-row flex-col">
      {/* LEFT PANEL: Corevia Product & Brand Overview */}
      <div className="relative flex flex-col justify-between bg-sidebar p-8 sm:p-12 lg:w-[48%] lg:p-16 text-sidebar-foreground border-r border-sidebar-border overflow-hidden">
        {/* Subtle geometric grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#262d3a_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

        <div className="relative z-10">
          {/* Corevia Logo & Wordmark */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Layers className="h-5.5 w-5.5" />
            </div>
            <div>
              <span className="block text-xl font-bold text-white tracking-tight">Corevia</span>
              <span className="block text-xs font-medium text-sidebar-muted">Business Management System</span>
            </div>
          </div>
        </div>

        {/* Product Messaging */}
        <div className="relative z-10 my-auto py-12 max-w-md">
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-white tracking-tight">
            Manage your business in one place.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-sidebar-muted">
            Manage customers, products, inventory and sales from a single workspace.
          </p>

          <ul className="mt-8 space-y-3.5 text-sm text-sidebar-foreground">
            <li className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary shrink-0">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span>Real-time customer tracking and notes</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary shrink-0">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span>Product catalog & stock movement audit log</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary shrink-0">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span>Sales challan creation and stock deduction</span>
            </li>
          </ul>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 pt-6 border-t border-sidebar-border/60">
          <p className="text-xs text-sidebar-muted">
            Authorized personnel only. Access is restricted to team members.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL: Login Form */}
      <div className="flex flex-1 items-center justify-center bg-card p-8 sm:p-12 lg:p-16">
        <div className="w-full max-w-[420px] space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your credentials to access Corevia.
            </p>
          </div>

          {formError ? (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="Email address" required error={errors.email}>
              {(p) => (
                <Input
                  {...p}
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrors((prev) => ({ ...prev, email: undefined }))
                  }}
                  className="h-11 text-sm sm:text-base"
                />
              )}
            </Field>

            <Field label="Password" required error={errors.password}>
              {(p) => (
                <div className="relative">
                  <Input
                    {...p}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setErrors((prev) => ({ ...prev, password: undefined }))
                    }}
                    className="h-11 pr-10 text-sm sm:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4.5 w-4.5" />
                    ) : (
                      <Eye className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              )}
            </Field>

            <Button
              type="submit"
              size="md"
              className="h-11 w-full text-base font-semibold mt-2"
              loading={submitting}
            >
              Sign in <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
