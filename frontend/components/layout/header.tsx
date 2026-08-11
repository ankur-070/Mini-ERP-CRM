"use client"

import { useEffect, useRef, useState } from "react"
import { Menu, LogOut, ChevronDown } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { initials } from "@/lib/format"
import { RoleBadge } from "@/components/ui/badge"

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-md p-2 text-muted-foreground hover:bg-muted lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-md py-1.5 pl-1.5 pr-2 transition-colors hover:bg-muted"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {user ? initials(user.name) : "?"}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-medium text-foreground">{user?.name}</span>
            <span className="block text-xs text-muted-foreground">{user?.email}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-60 overflow-hidden rounded-lg border border-border bg-card shadow-lg"
          >
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              <div className="mt-2">{user ? <RoleBadge role={user.role} /> : null}</div>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={logout}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-muted"
            >
              <LogOut className="h-4 w-4 text-muted-foreground" />
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
