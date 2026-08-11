"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { ArrowLeft, CheckCircle2, FileText, Printer, XCircle } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card"
import { TableContainer, Td, Th, Tr } from "@/components/ui/table"
import { ChallanStatusBadge } from "@/components/ui/badge"
import { ErrorState, LoadingState } from "@/components/ui/states"
import { PermissionGuard } from "@/components/layout/permission-guard"
import { challansApi } from "@/lib/api/challans"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/toast"
import { can } from "@/lib/permissions"
import { errorMessage } from "@/lib/error"
import { formatCurrency, formatDateTime } from "@/lib/format"

export default function ChallanDetailPage() {
  return (
    <PermissionGuard permission="challans.view">
      <ChallanDetailContent />
    </PermissionGuard>
  )
}

function ChallanDetailContent() {
  const params = useParams()
  const router = useRouter()
  const toast = useToast()
  const { user } = useAuth()

  const id = Number(params.id)
  const canConfirm = can(user?.role, "challans.confirm")
  const canCancel = can(user?.role, "challans.cancel")

  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const { data, error, isLoading, mutate } = useSWR(
    id ? `challan:${id}` : null,
    () => challansApi.get(id),
  )

  const challan = data?.data

  async function handleConfirm() {
    if (!confirm("Are you sure you want to confirm this sales challan? This will deduct current stock for all items included in this challan.")) {
      return
    }
    setConfirming(true)
    try {
      await challansApi.confirm(id)
      toast.success("Sales Challan confirmed. Stock deducted successfully.")
      mutate()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setConfirming(false)
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this sales challan?")) {
      return
    }
    setCancelling(true)
    try {
      await challansApi.cancel(id)
      toast.success("Sales Challan cancelled successfully.")
      mutate()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setCancelling(false)
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading sales challan details…" />
  }

  if (error || !challan) {
    return <ErrorState message={errorMessage(error) || "Challan not found"} onRetry={() => mutate()} />
  }

  const customer = challan.customer_snapshot

  return (
    <div className="w-full space-y-6">
      {/* Header with Nav back & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/challans")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-xl font-bold text-foreground">{challan.challan_number}</h1>
              <ChallanStatusBadge status={challan.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              Created on {formatDateTime(challan.created_at)} by {challan.created_by_name || `User #${challan.created_by}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print Challan
          </Button>

          {challan.status === "Draft" && canConfirm ? (
            <Button size="sm" onClick={handleConfirm} loading={confirming}>
              <CheckCircle2 className="h-4 w-4" /> Confirm Challan
            </Button>
          ) : null}

          {challan.status !== "Cancelled" && canCancel ? (
            <Button variant="outline" size="sm" onClick={handleCancel} loading={cancelling} className="text-danger border-danger/30 hover:bg-danger/10">
              <XCircle className="h-4 w-4" /> Cancel Challan
            </Button>
          ) : null}
        </div>
      </div>

      {/* Customer Snapshot & Challan Summary Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <div>
              <p className="font-semibold text-foreground">{customer?.name}</p>
              <p className="text-muted-foreground">{customer?.business_name}</p>
            </div>
            <div className="pt-1 text-xs space-y-1">
              <p className="text-foreground">
                <span className="text-muted-foreground">Mobile: </span>{customer?.mobile_number}
              </p>
              <p className="text-foreground">
                <span className="text-muted-foreground">Email: </span>{customer?.email}
              </p>
              {customer?.gst_number ? (
                <p className="text-foreground">
                  <span className="text-muted-foreground">GSTIN: </span><span className="font-mono">{customer.gst_number}</span>
                </p>
              ) : null}
              <p className="text-foreground pt-1">
                <span className="text-muted-foreground">Address: </span>{customer?.address}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Challan Overview</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Challan Number:</span>
              <span className="font-mono font-medium text-foreground">{challan.challan_number}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Status:</span>
              <ChallanStatusBadge status={challan.status} />
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Total Item Lines:</span>
              <span className="font-mono font-medium text-foreground">{challan.items.length}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Total Dispatched Quantity:</span>
              <span className="font-mono font-medium text-foreground">{challan.total_quantity} units</span>
            </div>
            <div className="flex justify-between pt-1 text-base font-semibold">
              <span className="text-foreground">Grand Total:</span>
              <span className="font-mono text-primary">{formatCurrency(challan.total_amount)}</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Dispatched Products Table */}
      <Card className="overflow-hidden p-0">
        <CardHeader className="border-b border-border px-5 py-4">
          <CardTitle>Dispatched Products</CardTitle>
        </CardHeader>
        <TableContainer>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Product Description</Th>
              <Th>SKU</Th>
              <Th className="text-right">Unit Price</Th>
              <Th className="text-right">Quantity</Th>
              <Th className="text-right">Line Total</Th>
            </tr>
          </thead>
          <tbody>
            {challan.items.map((item, idx) => (
              <Tr key={item.id}>
                <Td className="font-mono text-xs text-muted-foreground">{idx + 1}</Td>
                <Td className="font-medium text-foreground">{item.product_name}</Td>
                <Td className="font-mono text-xs text-muted-foreground">{item.product_sku}</Td>
                <Td className="text-right font-mono text-foreground">{formatCurrency(item.unit_price)}</Td>
                <Td className="text-right font-mono font-medium text-foreground">{item.quantity}</Td>
                <Td className="text-right font-mono font-semibold text-foreground">{formatCurrency(item.line_total)}</Td>
              </Tr>
            ))}
          </tbody>
        </TableContainer>
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-5 py-4 text-sm font-semibold">
          <span className="text-foreground">Total Dispatched Quantity: {challan.total_quantity}</span>
          <span className="text-foreground">
            Total Amount: <span className="font-mono text-lg text-primary">{formatCurrency(challan.total_amount)}</span>
          </span>
        </div>
      </Card>
    </div>
  )
}
