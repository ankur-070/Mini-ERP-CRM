"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { FileText, Plus, Search } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/field"
import { Card } from "@/components/ui/card"
import { TableContainer, Td, Th, Tr } from "@/components/ui/table"
import { Pagination } from "@/components/ui/pagination"
import { ChallanStatusBadge } from "@/components/ui/badge"
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states"
import { Dialog } from "@/components/ui/dialog"
import { ChallanForm } from "@/components/challans/challan-form"
import { PermissionGuard } from "@/components/layout/permission-guard"
import { challansApi } from "@/lib/api/challans"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/toast"
import { can } from "@/lib/permissions"
import { useDebouncedValue } from "@/lib/hooks"
import { errorMessage } from "@/lib/error"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { CHALLAN_STATUSES } from "@/types/challan"
import type { ChallanStatus, CreateChallanInput } from "@/types/challan"

const LIMIT = 10

export default function ChallansPage() {
  return (
    <PermissionGuard permission="challans.view">
      <ChallansContent />
    </PermissionGuard>
  )
}

function ChallansContent() {
  const { user } = useAuth()
  const toast = useToast()
  const canWrite = can(user?.role, "challans.write")

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<ChallanStatus | "">("")
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search, 350)

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const query = useMemo(
    () => ({ search: debouncedSearch, status: status || undefined, page, limit: LIMIT }),
    [debouncedSearch, status, page],
  )

  const { data, error, isLoading, mutate } = useSWR(
    ["challans", query],
    () => challansApi.list(query),
    { keepPreviousData: true },
  )

  const challans = data?.data ?? []
  const meta = data?.meta

  async function handleCreate(payload: CreateChallanInput) {
    setCreating(true)
    try {
      const created = await challansApi.create(payload)
      toast.success(
        payload.status === "Confirmed"
          ? `Challan ${created.data.challan_number} created and confirmed`
          : `Challan ${created.data.challan_number} created as Draft`,
      )
      setCreateOpen(false)
      mutate()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sales Challans"
        description="Dispatch documentation and stock deduction vouchers for customer orders."
        action={
          canWrite ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New sales challan
            </Button>
          ) : null
        }
      />

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by challan number or customer name…"
              className="pl-9"
              aria-label="Search challans"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ChallanStatus | "")
              setPage(1)
            }}
            className="sm:w-44"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {CHALLAN_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        {isLoading && !data ? (
          <LoadingState label="Loading sales challans…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />
        ) : challans.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No sales challans found"
            description={
              search || status
                ? "Try adjusting your search or filters."
                : "Create your first sales challan to manage order dispatch."
            }
            action={
              canWrite && !search && !status ? (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New sales challan
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <TableContainer>
              <thead>
                <tr>
                  <Th>Challan #</Th>
                  <Th>Customer</Th>
                  <Th className="text-right">Qty</Th>
                  <Th className="text-right">Total Amount</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {challans.map((c) => (
                  <Tr key={c.id} className="cursor-pointer">
                    <Td>
                      <Link href={`/challans/${c.id}`} className="font-mono font-medium text-foreground hover:text-primary">
                        {c.challan_number}
                      </Link>
                    </Td>
                    <Td>
                      <Link href={`/challans/${c.id}`} className="block">
                        <span className="font-medium text-foreground hover:text-primary">
                          {c.customer_snapshot?.business_name || c.customer_snapshot?.name || `Customer #${c.customer_id}`}
                        </span>
                        <span className="block text-xs text-muted-foreground">{c.customer_snapshot?.name}</span>
                      </Link>
                    </Td>
                    <Td className="text-right font-mono text-foreground">{c.total_quantity}</Td>
                    <Td className="text-right font-mono font-semibold text-foreground">
                      {formatCurrency(c.total_amount)}
                    </Td>
                    <Td>
                      <ChallanStatusBadge status={c.status} />
                    </Td>
                    <Td className="whitespace-nowrap text-xs text-muted-foreground font-mono">
                      {formatDateTime(c.created_at)}
                    </Td>
                    <Td className="text-right">
                      <Link href={`/challans/${c.id}`}>
                        <Button variant="outline" size="sm">
                          View details
                        </Button>
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </TableContainer>
            {meta ? <Pagination meta={meta} onPageChange={setPage} /> : null}
          </>
        )}
      </Card>

      <Dialog
        open={createOpen}
        onClose={() => (creating ? null : setCreateOpen(false))}
        title="New Sales Challan"
        description="Issue a delivery challan to dispatch items to a customer."
        size="lg"
      >
        <ChallanForm
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          submitting={creating}
        />
      </Dialog>
    </div>
  )
}
