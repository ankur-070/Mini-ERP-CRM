"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { LoadingState } from "@/components/ui/states"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login")
  }, [status, router])

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState label="Preparing your workspace…" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMenu={() => setMobileOpen(true)} />
        <main className="flex-1 w-full px-6 py-6 sm:px-8 lg:px-8">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
