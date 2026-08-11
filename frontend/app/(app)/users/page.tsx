"use client"

import { useState } from "react"
import { ShieldCheck, UserPlus, Users, Key, Mail, User as UserIcon } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Field, Input, Select } from "@/components/ui/field"
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PermissionGuard } from "@/components/layout/permission-guard"
import { authApi } from "@/lib/api/auth"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/toast"
import { errorMessage } from "@/lib/error"
import { ROLES } from "@/types/auth"
import type { RegisterPayload, Role } from "@/types/auth"

export default function UsersPage() {
  return (
    <PermissionGuard permission="users.register">
      <UsersContent />
    </PermissionGuard>
  )
}

function UsersContent() {
  const { user } = useAuth()
  const toast = useToast()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>("Sales")

  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "Full name is required"
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Enter a valid email address"
    }
    if (!password || password.length < 6) {
      errs.password = "Password must be at least 6 characters"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const payload: RegisterPayload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      }
      const res = await authApi.register(payload)
      toast.success(`User account for ${res.data.name} (${res.data.role}) registered successfully!`)
      setName("")
      setEmail("")
      setPassword("")
      setRole("Sales")
      setErrors({})
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="User Management"
        description="Register and manage role-based staff accounts for Corevia Business Management System."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Registration Form Card - Primary Workspace (7 or 8 cols on desktop) */}
        <Card className="lg:col-span-7 xl:col-span-8">
          <CardHeader className="px-6 py-5">
            <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
              <UserPlus className="h-5 w-5 text-primary" /> Register New Staff Account
            </CardTitle>
          </CardHeader>
          <CardBody className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <Field label="Full Name" required error={errors.name}>
                {({ id, "aria-invalid": invalid }) => (
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={id}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        setErrors((p) => ({ ...p, name: "" }))
                      }}
                      placeholder="e.g. Ankur Sharma"
                      className="h-11 pl-10 text-sm sm:text-base"
                      aria-invalid={invalid}
                    />
                  </div>
                )}
              </Field>

              <Field label="Email Address" required error={errors.email}>
                {({ id, "aria-invalid": invalid }) => (
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={id}
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setErrors((p) => ({ ...p, email: "" }))
                      }}
                      placeholder="ankur@company.com"
                      className="h-11 pl-10 text-sm sm:text-base"
                      aria-invalid={invalid}
                    />
                  </div>
                )}
              </Field>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Password" required error={errors.password} hint="At least 6 characters">
                  {({ id, "aria-invalid": invalid }) => (
                    <div className="relative">
                      <Key className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id={id}
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setErrors((p) => ({ ...p, password: "" }))
                        }}
                        placeholder="••••••••"
                        className="h-11 pl-10 text-sm sm:text-base"
                        aria-invalid={invalid}
                      />
                    </div>
                  )}
                </Field>

                <Field label="Assigned Role" required>
                  {({ id }) => (
                    <Select
                      id={id}
                      value={role}
                      onChange={(e) => setRole(e.target.value as Role)}
                      className="h-11 text-sm sm:text-base"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              </div>

              <div className="pt-3 flex justify-end">
                <Button type="submit" size="md" className="h-11 px-6 text-sm font-semibold" loading={submitting}>
                  <UserPlus className="h-4 w-4 mr-1.5" /> Create User Account
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Current Active Account & Role Overview - Secondary Sidebar Cards (5 or 4 cols on desktop) */}
        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          <Card>
            <CardHeader className="px-6 py-4.5">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
                <ShieldCheck className="h-5 w-5 text-primary" /> Active Admin Session
              </CardTitle>
            </CardHeader>
            <CardBody className="p-6 space-y-4 text-sm">
              <div>
                <p className="font-semibold text-foreground text-base">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs font-medium text-muted-foreground">Current Role:</span>
                <Badge tone="primary">{user?.role}</Badge>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="px-6 py-4.5">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
                <Users className="h-5 w-5 text-muted-foreground" /> System Roles & Permissions
              </CardTitle>
            </CardHeader>
            <CardBody className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="border-b border-border pb-3">
                <span className="font-semibold text-foreground block mb-0.5">Admin:</span>
                <p className="text-muted-foreground text-xs leading-relaxed">Full read & write access across all modules, plus team member account registration.</p>
              </div>
              <div className="border-b border-border pb-3">
                <span className="font-semibold text-foreground block mb-0.5">Sales:</span>
                <p className="text-muted-foreground text-xs leading-relaxed">Manage CRM leads/accounts and create, confirm or cancel Sales Challans.</p>
              </div>
              <div className="border-b border-border pb-3">
                <span className="font-semibold text-foreground block mb-0.5">Warehouse:</span>
                <p className="text-muted-foreground text-xs leading-relaxed">Manage product catalog details and record Stock Movements (IN/OUT intake & dispatch).</p>
              </div>
              <div>
                <span className="font-semibold text-foreground block mb-0.5">Accounts:</span>
                <p className="text-muted-foreground text-xs leading-relaxed">Read-only auditing across Customers, Products, Stock Movements, and Sales Challans.</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
