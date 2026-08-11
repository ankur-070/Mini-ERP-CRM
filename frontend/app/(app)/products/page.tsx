"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { AlertTriangle, Package, Pencil, Plus, Search } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/field"
import { Card } from "@/components/ui/card"
import { TableContainer, Td, Th, Tr } from "@/components/ui/table"
import { Pagination } from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states"
import { Dialog } from "@/components/ui/dialog"
import { ProductForm } from "@/components/products/product-form"
import { PermissionGuard } from "@/components/layout/permission-guard"
import { productsApi } from "@/lib/api/products"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/toast"
import { can } from "@/lib/permissions"
import { useDebouncedValue } from "@/lib/hooks"
import { errorMessage } from "@/lib/error"
import { formatCurrency, formatNumber } from "@/lib/format"
import type { Product, ProductInput } from "@/types/product"

const LIMIT = 10

export default function ProductsPage() {
  return (
    <PermissionGuard permission="products.view">
      <ProductsContent />
    </PermissionGuard>
  )
}

function ProductsContent() {
  const { user } = useAuth()
  const toast = useToast()
  const canWrite = can(user?.role, "products.write")

  const [search, setSearch] = useState("")
  const [lowStock, setLowStock] = useState(false)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search, 350)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  const query = useMemo(
    () => ({ search: debouncedSearch, lowStock, page, limit: LIMIT }),
    [debouncedSearch, lowStock, page],
  )

  const { data, error, isLoading, mutate } = useSWR(["products", query], () => productsApi.list(query), {
    keepPreviousData: true,
  })

  const products = data?.data ?? []
  const meta = data?.meta

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setFormOpen(true)
  }

  async function handleSubmit(payload: ProductInput) {
    setSaving(true)
    try {
      if (editing) {
        const { current_stock, ...rest } = payload
        await productsApi.update(editing.id, rest)
        toast.success("Product updated")
      } else {
        await productsApi.create(payload)
        toast.success("Product created")
      }
      setFormOpen(false)
      mutate()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        description="Your catalog and live inventory levels."
        action={
          canWrite ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New product
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
              placeholder="Search name, SKU or category"
              className="pl-9"
              aria-label="Search products"
            />
          </div>
          <Button
            variant={lowStock ? "primary" : "outline"}
            onClick={() => {
              setLowStock((v) => !v)
              setPage(1)
            }}
            aria-pressed={lowStock}
          >
            <AlertTriangle className="h-4 w-4" />
            Low stock only
          </Button>
        </div>

        {isLoading && !data ? (
          <LoadingState label="Loading products…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description={search || lowStock ? "Try adjusting your search or filter." : "Add your first product to build the catalog."}
            action={
              canWrite && !search && !lowStock ? (
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  New product
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <TableContainer>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>Category</Th>
                  <Th className="text-right">Unit price</Th>
                  <Th className="text-right">In stock</Th>
                  <Th>Location</Th>
                  {canWrite ? <Th className="text-right">Actions</Th> : null}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const low = p.is_low_stock ?? p.current_stock <= p.min_stock_alert
                  return (
                    <Tr key={p.id}>
                      <Td>
                        <span className="font-medium text-foreground">{p.name}</span>
                        <span className="block font-mono text-xs text-muted-foreground">{p.sku}</span>
                      </Td>
                      <Td className="text-muted-foreground">{p.category}</Td>
                      <Td className="text-right tabular-nums">{formatCurrency(p.unit_price)}</Td>
                      <Td className="text-right">
                        <span className="inline-flex items-center gap-2">
                          <span className="tabular-nums text-foreground">{formatNumber(p.current_stock)}</span>
                          {low ? (
                            <Badge tone="danger">
                              <AlertTriangle className="h-3 w-3" />
                              Low
                            </Badge>
                          ) : null}
                        </span>
                      </Td>
                      <Td className="text-muted-foreground">{p.location}</Td>
                      {canWrite ? (
                        <Td className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                        </Td>
                      ) : null}
                    </Tr>
                  )
                })}
              </tbody>
            </TableContainer>
            {meta ? <Pagination meta={meta} onPageChange={setPage} /> : null}
          </>
        )}
      </Card>

      <Dialog
        open={formOpen}
        onClose={() => (saving ? null : setFormOpen(false))}
        title={editing ? "Edit product" : "New product"}
        size="lg"
      >
        <ProductForm
          product={editing}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          submitting={saving}
          submitLabel={editing ? "Save changes" : "Create product"}
        />
      </Dialog>
    </div>
  )
}
