"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ArrowLeftRight, Plus } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/field"
import { Card } from "@/components/ui/card"
import { TableContainer, Td, Th, Tr } from "@/components/ui/table"
import { Pagination } from "@/components/ui/pagination"
import { MovementBadge } from "@/components/ui/badge"
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states"
import { Dialog } from "@/components/ui/dialog"
import { StockForm } from "@/components/stock/stock-form"
import { PermissionGuard } from "@/components/layout/permission-guard"
import { ProductCombobox } from "@/components/products/product-combobox"
import { stockMovementsApi } from "@/lib/api/stockMovements"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/toast"
import { can } from "@/lib/permissions"
import { errorMessage } from "@/lib/error"
import { formatDateTime } from "@/lib/format"
import type { Product } from "@/types/product"
import type { MovementType, StockMovementInput } from "@/types/stock"

const LIMIT = 10

export default function StockMovementsPage() {
  return (
    <PermissionGuard permission="stock.view">
      <StockMovementsContent />
    </PermissionGuard>
  )
}

function StockMovementsContent() {
  const { user } = useAuth()
  const toast = useToast()
  const canWrite = can(user?.role, "stock.write")

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [movementType, setMovementType] = useState<MovementType | "">("")
  const [page, setPage] = useState(1)

  const [adjustOpen, setAdjustOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const query = useMemo(
    () => ({
      productId: selectedProduct?.id,
      movementType: movementType || undefined,
      page,
      limit: LIMIT,
    }),
    [selectedProduct, movementType, page],
  )

  const { data, error, isLoading, mutate } = useSWR(
    ["stock-movements", query],
    () => stockMovementsApi.list(query),
    { keepPreviousData: true },
  )

  const movements = data?.data ?? []
  const meta = data?.meta

  async function handleAdjustment(payload: StockMovementInput) {
    setSubmitting(true)
    try {
      await stockMovementsApi.create(payload)
      toast.success("Stock adjustment recorded successfully")
      setAdjustOpen(false)
      mutate()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Movements"
        description="Audit log of product intake, dispatch, and manual adjustments."
        action={
          canWrite ? (
            <Button onClick={() => setAdjustOpen(true)}>
              <Plus className="h-4 w-4" />
              New stock adjustment
            </Button>
          ) : null
        }
      />

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="flex-1 sm:max-w-xs">
            <ProductCombobox
              value={selectedProduct}
              onChange={(p) => {
                setSelectedProduct(p)
                setPage(1)
              }}
              placeholder="Filter by product…"
            />
          </div>

          {selectedProduct ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedProduct(null)
                setPage(1)
              }}
              className="h-10 text-xs"
            >
              Clear product filter
            </Button>
          ) : null}

          <Select
            value={movementType}
            onChange={(e) => {
              setMovementType(e.target.value as MovementType | "")
              setPage(1)
            }}
            className="sm:w-44"
            aria-label="Filter by movement type"
          >
            <option value="">All movement types</option>
            <option value="IN">IN (Stock Intake)</option>
            <option value="OUT">OUT (Dispatch)</option>
          </Select>
        </div>

        {isLoading && !data ? (
          <LoadingState label="Loading stock movements…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />
        ) : movements.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="No movements found"
            description={
              selectedProduct || movementType
                ? "Try adjusting your filters."
                : "Stock movements will appear here when inventory is adjusted or challans are processed."
            }
            action={
              canWrite && !selectedProduct && !movementType ? (
                <Button onClick={() => setAdjustOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New stock adjustment
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <TableContainer>
              <thead>
                <tr>
                  <Th>Date & Time</Th>
                  <Th>Product</Th>
                  <Th>Type</Th>
                  <Th className="text-right">Quantity</Th>
                  <Th>Reason / Ref</Th>
                  <Th>Recorded By</Th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <Tr key={m.id}>
                    <Td className="whitespace-nowrap text-xs text-muted-foreground font-mono">
                      {formatDateTime(m.created_at)}
                    </Td>
                    <Td>
                      <span className="font-medium text-foreground">{m.product_name}</span>
                      <span className="block font-mono text-xs text-muted-foreground">{m.product_sku}</span>
                    </Td>
                    <Td>
                      <MovementBadge type={m.movement_type} />
                    </Td>
                    <Td className="text-right font-mono font-semibold text-foreground">
                      {m.movement_type === "IN" ? `+${m.quantity}` : `-${m.quantity}`}
                    </Td>
                    <Td>
                      <span className="text-foreground">{m.reason}</span>
                      {m.challan_id ? (
                        <Link
                          href={`/challans/${m.challan_id}`}
                          className="ml-2 inline-flex items-center text-xs text-primary hover:underline"
                        >
                          (Challan #{m.challan_id})
                        </Link>
                      ) : null}
                    </Td>
                    <Td className="text-muted-foreground text-xs">{m.created_by_name || `User #${m.created_by}`}</Td>
                  </Tr>
                ))}
              </tbody>
            </TableContainer>
            {meta ? <Pagination meta={meta} onPageChange={setPage} /> : null}
          </>
        )}
      </Card>

      <Dialog
        open={adjustOpen}
        onClose={() => (submitting ? null : setAdjustOpen(false))}
        title="Record Manual Stock Adjustment"
        description="Manually adjust inventory for incoming stock, audits, or damage."
        size="lg"
      >
        <StockForm
          onSubmit={handleAdjustment}
          onCancel={() => setAdjustOpen(false)}
          submitting={submitting}
          initialProduct={selectedProduct}
        />
      </Dialog>
    </div>
  )
}
