"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Boxes, X } from "lucide-react"
import { cn } from "@/lib/format"
import { useAuth } from "@/lib/auth-context"
import { can } from "@/lib/permissions"
import { NAV_ITEMS } from "./nav"

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { user } = useAuth()

  const items = NAV_ITEMS.filter((item) => can(user?.role, item.permission))

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-active text-sidebar-active-foreground">
          <Boxes className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Corevia</p>
          <p className="text-xs text-sidebar-muted">Business Management</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-active text-sidebar-active-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white",
                  )}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs text-sidebar-muted">
          Signed in as <span className="font-medium text-sidebar-foreground">{user?.role}</span>
        </p>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
      <div className="fixed inset-y-0 left-0 w-64">
        <SidebarContent />
      </div>
    </aside>
  )
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-foreground/50" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-4 z-10 rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-accent hover:text-white"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent onNavigate={onClose} />
      </div>
    </div>
  )
}
