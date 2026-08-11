"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Field, Select } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { CustomerCombobox } from "@/components/customers/customer-combobox"
import { ProductCombobox } from "@/components/products/product-combobox"
import { formatCurrency, formatNumber } from "@/lib/format"
import type { Customer } from "@/types/customer"
import type { Product } from "@/types/product"
import type { CreateChallanInput } from "@/types/challan"

interface FormItem {
  key: string
  product: Product | null
  quantity: string
}

interface ChallanFormProps {
  onSubmit: (payload: CreateChallanInput) => Promise<void>
  onCancel: () => void
  submitting?: boolean
}

export function ChallanForm({ onSubmit, onCancel, submitting = false }: ChallanFormProps) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [status, setStatus] = useState<"Draft" | "Confirmed">("Draft")
  const [items, setItems] = useState<FormItem[]>([
    { key: "item-0", product: null, quantity: "1" },
  ])
  const [errors, setErrors] = useState<{ customer?: string; items?: string }>({})

  function addItem() {
    setItems((prev) => [
      ...prev,
      { key: `item-${Date.now()}-${prev.length}`, product: null, quantity: "1" },
    ])
    setErrors((prev) => ({ ...prev, items: undefined }))
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateItemProduct(index: number, p: Product | null) {
    setItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], product: p }
      return next
    })
    setErrors((prev) => ({ ...prev, items: undefined }))
  }

  function updateItemQuantity(index: number, q: string) {
    setItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], quantity: q }
      return next
    })
    setErrors((prev) => ({ ...prev, items: undefined }))
  }

  // Calculate Totals
  const totals = items.reduce(
    (acc, item) => {
      const qty = parseInt(item.quantity, 10) || 0
      const price = item.product ? Number(item.product.unit_price) : 0
      acc.quantity += qty
      acc.amount += qty * price
      return acc
    },
    { quantity: 0, amount: 0 },
  )

  function validate() {
    const errs: { customer?: string; items?: string } = {}
    if (!customer) {
      errs.customer = "Please select a customer for this sales challan"
    }

    if (items.length === 0) {
      errs.items = "At least one product item is required"
    } else {
      const hasInvalidItem = items.some((item) => {
        const qty = parseInt(item.quantity, 10)
        return !item.product || isNaN(qty) || qty <= 0
      })
      if (hasInvalidItem) {
        errs.items = "All item rows must have a product selected and quantity > 0"
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const payload: CreateChallanInput = {
      customer_id: customer!.id,
      status,
      items: items.map((item) => ({
        product_id: item.product!.id,
        quantity: parseInt(item.quantity, 10),
      })),
    }

    await onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Field label="Customer" required error={errors.customer}>
            {({ id, "aria-invalid": invalid }) => (
              <CustomerCombobox
                id={id}
                value={customer}
                onChange={(c) => {
                  setCustomer(c)
                  setErrors((prev) => ({ ...prev, customer: undefined }))
                }}
                aria-invalid={invalid}
              />
            )}
          </Field>
        </div>

        <Field label="Initial Status" required>
          {({ id }) => (
            <Select
              id={id}
              value={status}
              onChange={(e) => setStatus(e.target.value as "Draft" | "Confirmed")}
            >
              <option value="Draft">Draft (Hold)</option>
              <option value="Confirmed">Confirmed (Deduct Stock)</option>
            </Select>
          )}
        </Field>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Challan Items</h4>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-3.5 w-3.5" /> Add Product
          </Button>
        </div>

        {errors.items ? <p className="text-xs text-danger">{errors.items}</p> : null}

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {items.map((item, index) => {
            const qty = parseInt(item.quantity, 10) || 0
            const price = item.product ? Number(item.product.unit_price) : 0
            const lineTotal = qty * price

            return (
              <div
                key={item.key}
                className="grid grid-cols-12 gap-2 items-center rounded-lg border border-border bg-card p-3"
              >
                <div className="col-span-12 sm:col-span-6">
                  <ProductCombobox
                    value={item.product}
                    onChange={(p) => updateItemProduct(index, p)}
                    placeholder="Select product…"
                  />
                </div>

                <div className="col-span-5 sm:col-span-2">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItemQuantity(index, e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-card px-2.5 text-sm text-foreground text-center font-mono focus:border-primary"
                    placeholder="Qty"
                  />
                </div>

                <div className="col-span-5 sm:col-span-3 text-right">
                  <span className="block text-xs text-muted-foreground font-mono">
                    {item.product ? formatCurrency(price) : "₹0.00"} × {qty}
                  </span>
                  <span className="block font-mono text-sm font-semibold text-foreground">
                    {formatCurrency(lineTotal)}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                    className="p-1.5 text-muted-foreground hover:text-danger disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Challan Totals Footer */}
        <div className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-3 text-sm">
          <span className="font-medium text-foreground">
            Total Items: <span className="font-mono font-semibold">{formatNumber(totals.quantity)}</span>
          </span>
          <span className="font-semibold text-foreground">
            Grand Total: <span className="font-mono text-base text-primary">{formatCurrency(totals.amount)}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {status === "Confirmed" ? "Create & Confirm Challan" : "Create Draft Challan"}
        </Button>
      </div>
    </form>
  )
}
