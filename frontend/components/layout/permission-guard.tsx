"use client"

import { ShieldAlert } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { can, type Permission } from "@/lib/permissions"

/** Renders children only when the current user holds `permission`, else a 403 screen. */
export function PermissionGuard({
  permission,
  children,
}: {
  permission: Permission
  children: React.ReactNode
}) {
  const { user } = useAuth()

  if (!can(user?.role, permission)) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
          <ShieldAlert className="h-7 w-7 text-danger" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">Access denied</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Your role ({user?.role}) does not have permission to view this page. Contact an
          administrator if you believe this is a mistake.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
