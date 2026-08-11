"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Plus, Search, Users } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/field"
import { Card } from "@/components/ui/card"
import { TableContainer, Td, Th, Tr } from "@/components/ui/table"
import { Pagination } from "@/components/ui/pagination"
import { CustomerStatusBadge } from "@/components/ui/badge"
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states"
import { Dialog } from "@/components/ui/dialog"
import { CustomerForm } from "@/components/customers/customer-form"
import { PermissionGuard } from "@/components/layout/permission-guard"
import { customersApi } from "@/lib/api/customers"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/toast"
import { can } from "@/lib/permissions"
import { useDebouncedValue } from "@/lib/hooks"
import { errorMessage } from "@/lib/error"
import { formatDate } from "@/lib/format"
import { CUSTOMER_STATUSES, CUSTOMER_TYPES } from "@/types/customer"
import type { CustomerInput, CustomerStatus, CustomerType } from "@/types/customer"

const LIMIT = 10

export default function CustomersPage() {
  return (
    <PermissionGuard permission="customers.view">
      <CustomersContent />
    </PermissionGuard>
  )
}

function CustomersContent() {
  const { user } = useAuth()
  const toast = useToast()
  const canWrite = can(user?.role, "customers.write")

  const [search, setSearch] = useState("")
  const [type, setType] = useState<CustomerType | "">("")
  const [status, setStatus] = useState<CustomerStatus | "">("")
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search, 350)

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const query = useMemo(
    () => ({ search: debouncedSearch, type, status, page, limit: LIMIT }),
    [debouncedSearch, type, status, page],
  )

  const { data, error, isLoading, mutate } = useSWR(["customers", query], () => customersApi.list(query), {
    keepPreviousData: true,
  })

  const customers = data?.data ?? []
  const meta = data?.meta

  function resetToFirstPage<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(1)
    }
  }

  async function handleCreate(payload: CustomerInput) {
    setCreating(true)
    try {
      await customersApi.create(payload)
      toast.success("Customer created")
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
        title="Customers"
        description="Manage leads and accounts across your sales pipeline."
        action={
          canWrite ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New customer
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
              onChange={(e) => resetToFirstPage(setSearch)(e.target.value)}
              placeholder="Search name, business, mobile or email"
              className="pl-9"
              aria-label="Search customers"
            />
          </div>
          <Select
            value={type}
            onChange={(e) => resetToFirstPage(setType)(e.target.value as CustomerType | "")}
            className="sm:w-40"
            aria-label="Filter by type"
          >
            <option value="">All types</option>
            {CUSTOMER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(e) => resetToFirstPage(setStatus)(e.target.value as CustomerStatus | "")}
            className="sm:w-40"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {CUSTOMER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        {isLoading && !data ? (
          <LoadingState label="Loading customers…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description={
              search || type || status
                ? "Try adjusting your search or filters."
                : "Create your first customer to start building your pipeline."
            }
            action={
              canWrite && !search && !type && !status ? (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New customer
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <TableContainer>
              <thead>
                <tr>
                  <Th>Customer</Th>
                  <Th>Type</Th>
                  <Th>Contact</Th>
                  <Th>Status</Th>
                  <Th>Follow-up</Th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <Tr key={c.id} className="cursor-pointer">
                    <Td>
                      <Link href={`/customers/${c.id}`} className="block">
                        <span className="font-medium text-foreground hover:text-primary">{c.name}</span>
                        <span className="block text-xs text-muted-foreground">{c.business_name}</span>
                      </Link>
                    </Td>
                    <Td className="text-muted-foreground">{c.customer_type}</Td>
                    <Td>
                      <span className="block text-foreground">{c.mobile_number}</span>
                      <span className="block text-xs text-muted-foreground">{c.email}</span>
                    </Td>
                    <Td>
                      <CustomerStatusBadge status={c.status} />
                    </Td>
                    <Td className="text-muted-foreground">{formatDate(c.follow_up_date)}</Td>
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
        title="New customer"
        description="Add a lead or account to your CRM."
        size="lg"
      >
        <CustomerForm
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          submitting={creating}
          submitLabel="Create customer"
        />
      </Dialog>
    </div>
  )
}
