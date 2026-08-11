"use client"

import Link from "next/link"
import useSWR from "swr"
import {
  Users,
  Package,
  AlertTriangle,
  FileText,
  ArrowLeftRight,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { can } from "@/lib/permissions"
import { customersApi } from "@/lib/api/customers"
import { productsApi } from "@/lib/api/products"
import { challansApi } from "@/lib/api/challans"
import { stockMovementsApi } from "@/lib/api/stockMovements"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, MovementBadge, ChallanStatusBadge } from "@/components/ui/badge"
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states"

export default function DashboardPage() {
  const { user } = useAuth()

  const canCustomers = can(user?.role, "customers.view")
  const canProducts = can(user?.role, "products.view")
  const canStock = can(user?.role, "stock.view")
  const canChallans = can(user?.role, "challans.view")

  const customers = useSWR(canCustomers ? "dash:customers" : null, () =>
    customersApi.list({ page: 1, limit: 1 }),
  )
  const products = useSWR(canProducts ? "dash:products" : null, () =>
    productsApi.list({ page: 1, limit: 1 }),
  )
  const lowStock = useSWR(canProducts ? "dash:lowstock" : null, () =>
    productsApi.list({ page: 1, limit: 5, lowStock: true }),
  )
  const challans = useSWR(canChallans ? "dash:challans" : null, () =>
    challansApi.list({ page: 1, limit: 5 }),
  )
  const draftChallans = useSWR(canChallans ? "dash:challans:draft" : null, () =>
    challansApi.list({ page: 1, limit: 1, status: "Draft" }),
  )
  const confirmedChallans = useSWR(canChallans ? "dash:challans:confirmed" : null, () =>
    challansApi.list({ page: 1, limit: 1, status: "Confirmed" }),
  )
  const movements = useSWR(canStock ? "dash:movements" : null, () =>
    stockMovementsApi.list({ page: 1, limit: 6 }),
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] ?? ""}`}
        description="A snapshot of your operations, tailored to your role."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {canCustomers ? (
          <StatCard
            label="Total Customers"
            value={customers.data?.meta?.total ?? null}
            icon={Users}
            href="/customers"
            loading={customers.isLoading}
            error={!!customers.error}
            tone="primary"
          />
        ) : null}
        {canProducts ? (
          <StatCard
            label="Total Products"
            value={products.data?.meta?.total ?? null}
            icon={Package}
            href="/products"
            loading={products.isLoading}
            error={!!products.error}
            tone="primary"
          />
        ) : null}
        {canProducts ? (
          <StatCard
            label="Low-stock Products"
            value={lowStock.data?.meta?.total ?? null}
            icon={AlertTriangle}
            href="/products?lowStock=1"
            loading={lowStock.isLoading}
            error={!!lowStock.error}
            tone="warning"
            hint="At or below minimum alert level"
          />
        ) : null}
        {canChallans ? (
          <StatCard
            label="Total Challans"
            value={challans.data?.meta?.total ?? null}
            icon={FileText}
            href="/challans"
            loading={challans.isLoading}
            error={!!challans.error}
            tone="primary"
          />
        ) : null}
      </div>

      {canChallans ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Draft challans</p>
            <p className="mt-1 font-mono text-xl font-semibold text-foreground">
              {draftChallans.isLoading ? "…" : (draftChallans.data?.meta?.total ?? "—")}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Confirmed challans</p>
            <p className="mt-1 font-mono text-xl font-semibold text-foreground">
              {confirmedChallans.isLoading ? "…" : (confirmedChallans.data?.meta?.total ?? "—")}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total challans</p>
            <p className="mt-1 font-mono text-xl font-semibold text-foreground">
              {challans.isLoading ? "…" : (challans.data?.meta?.total ?? "—")}
            </p>
          </Card>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {canProducts ? (
          <Card>
            <CardHeader>
              <CardTitle>Low-stock products</CardTitle>
              <Link
                href="/products?lowStock=1"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              {lowStock.isLoading ? (
                <LoadingState />
              ) : lowStock.error ? (
                <ErrorState message="Could not load low-stock products." onRetry={() => lowStock.mutate()} />
              ) : (lowStock.data?.data.length ?? 0) === 0 ? (
                <EmptyState title="All stocked up" description="No products are below their minimum alert level." icon={Package} />
              ) : (
                <ul className="divide-y divide-border">
                  {lowStock.data!.data.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <Link href={`/products/${p.id}`} className="block truncate text-sm font-medium text-foreground hover:text-primary">
                          {p.name}
                        </Link>
                        <p className="truncate font-mono text-xs text-muted-foreground">{p.sku}</p>
                      </div>
                      <Badge tone="danger">
                        {p.current_stock} / {p.min_stock_alert}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        ) : null}

        {canStock ? (
          <Card>
            <CardHeader>
              <CardTitle>Recent stock movements</CardTitle>
              <Link
                href="/stock-movements"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              {movements.isLoading ? (
                <LoadingState />
              ) : movements.error ? (
                <ErrorState message="Could not load stock movements." onRetry={() => movements.mutate()} />
              ) : (movements.data?.data.length ?? 0) === 0 ? (
                <EmptyState title="No movements yet" description="Stock intake and dispatch will appear here." icon={ArrowLeftRight} />
              ) : (
                <ul className="divide-y divide-border">
                  {movements.data!.data.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{m.product_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{formatDateTime(m.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-foreground">{m.quantity}</span>
                        <MovementBadge type={m.movement_type} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        ) : null}

        {canChallans ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent sales challans</CardTitle>
              <Link
                href="/challans"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              {challans.isLoading ? (
                <LoadingState />
              ) : challans.error ? (
                <ErrorState message="Could not load challans." onRetry={() => challans.mutate()} />
              ) : (challans.data?.data.length ?? 0) === 0 ? (
                <EmptyState title="No challans yet" description="Created sales challans will appear here." icon={FileText} />
              ) : (
                <ul className="divide-y divide-border">
                  {challans.data!.data.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/challans/${c.id}`}
                        className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-mono text-sm font-medium text-foreground">{c.challan_number}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {c.customer_snapshot?.business_name || c.customer_snapshot?.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="hidden font-mono text-sm text-foreground sm:inline">
                            {formatCurrency(c.total_amount)}
                          </span>
                          <ChallanStatusBadge status={c.status} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
