"use client"

import { useState } from "react"
import { Field, Input, Select, Textarea } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { ProductCombobox } from "@/components/products/product-combobox"
import type { Product } from "@/types/product"
import type { MovementType, StockMovementInput } from "@/types/stock"

interface StockFormProps {
  onSubmit: (payload: StockMovementInput) => Promise<void>
  onCancel: () => void
  submitting?: boolean
  initialProduct?: Product | null
}

export function StockForm({
  onSubmit,
  onCancel,
  submitting = false,
  initialProduct = null,
}: StockFormProps) {
  const [product, setProduct] = useState<Product | null>(initialProduct)
  const [movementType, setMovementType] = useState<MovementType>("IN")
  const [quantity, setQuantity] = useState<string>("1")
  const [reason, setReason] = useState<string>("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!product) {
      errs.product = "Please select a product"
    }

    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty <= 0) {
      errs.quantity = "Quantity must be a positive integer"
    } else if (product && movementType === "OUT" && qty > product.current_stock) {
      errs.quantity = `Insufficient stock. Current stock is ${product.current_stock}`
    }

    if (!reason.trim()) {
      errs.reason = "Reason for stock movement is required"
    } else if (reason.trim().length < 3) {
      errs.reason = "Reason must be at least 3 characters"
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const qty = parseInt(quantity, 10)
    await onSubmit({
      product_id: product!.id,
      movement_type: movementType,
      quantity: qty,
      reason: reason.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Product" required error={errors.product}>
        {({ id, "aria-invalid": invalid }) => (
          <ProductCombobox
            id={id}
            value={product}
            onChange={(p) => {
              setProduct(p)
              setErrors((prev) => ({ ...prev, product: "", quantity: "" }))
            }}
            aria-invalid={invalid}
          />
        )}
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Movement Type" required>
          {({ id }) => (
            <Select
              id={id}
              value={movementType}
              onChange={(e) => {
                setMovementType(e.target.value as MovementType)
                setErrors((prev) => ({ ...prev, quantity: "" }))
              }}
            >
              <option value="IN">Stock IN (Receive / Increase)</option>
              <option value="OUT">Stock OUT (Dispatch / Decrease)</option>
            </Select>
          )}
        </Field>

        <Field
          label="Quantity"
          required
          error={errors.quantity}
          hint={product ? `Available: ${product.current_stock}` : undefined}
        >
          {({ id, "aria-invalid": invalid, "aria-describedby": desc }) => (
            <Input
              id={id}
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value)
                setErrors((prev) => ({ ...prev, quantity: "" }))
              }}
              aria-invalid={invalid}
              aria-describedby={desc}
              placeholder="e.g. 10"
            />
          )}
        </Field>
      </div>

      <Field
        label="Reason for Adjustment"
        required
        error={errors.reason}
        hint="e.g. Supplier delivery, Inventory audit correction, Damaged stock"
      >
        {({ id, "aria-invalid": invalid, "aria-describedby": desc }) => (
          <Textarea
            id={id}
            rows={2}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setErrors((prev) => ({ ...prev, reason: "" }))
            }}
            aria-invalid={invalid}
            aria-describedby={desc}
            placeholder="Explain why this stock is being adjusted…"
          />
        )}
      </Field>

      <div className="flex items-center justify-end gap-3 pt-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Record Stock Adjustment
        </Button>
      </div>
    </form>
  )
}
