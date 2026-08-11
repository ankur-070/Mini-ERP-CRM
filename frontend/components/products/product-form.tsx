"use client"

import { useState } from "react"
import { Field, Input } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import type { Product, ProductInput } from "@/types/product"

type FieldErrors = Partial<Record<keyof ProductInput, string>>

function buildInitial(product?: Product | null) {
  return {
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    category: product?.category ?? "",
    unit_price: product ? String(product.unit_price) : "",
    current_stock: product ? String(product.current_stock) : "0",
    min_stock_alert: product ? String(product.min_stock_alert) : "0",
    location: product?.location ?? "",
  }
}

export function ProductForm({
  product,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save product",
}: {
  product?: Product | null
  onSubmit: (payload: ProductInput) => void
  onCancel: () => void
  submitting?: boolean
  submitLabel?: string
}) {
  const isEdit = Boolean(product)
  const [values, setValues] = useState(() => buildInitial(product))
  const [errors, setErrors] = useState<FieldErrors>({})

  function set(key: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const next: FieldErrors = {}
    if (!values.name.trim()) next.name = "Name is required."
    if (!values.sku.trim()) next.sku = "SKU is required."
    if (!values.category.trim()) next.category = "Category is required."
    if (!values.location.trim()) next.location = "Location is required."
    const price = Number(values.unit_price)
    if (values.unit_price === "" || Number.isNaN(price) || price < 0) next.unit_price = "Enter a valid price."
    const min = Number(values.min_stock_alert)
    if (!Number.isInteger(min) || min < 0) next.min_stock_alert = "Enter a whole number ≥ 0."
    if (!isEdit) {
      const stock = Number(values.current_stock)
      if (!Number.isInteger(stock) || stock < 0) next.current_stock = "Enter a whole number ≥ 0."
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      name: values.name.trim(),
      sku: values.sku.trim(),
      category: values.category.trim(),
      unit_price: Number(values.unit_price),
      current_stock: Number(values.current_stock),
      min_stock_alert: Number(values.min_stock_alert),
      location: values.location.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product name" required error={errors.name}>
          {(p) => <Input {...p} value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="Copper wire 2.5mm" />}
        </Field>
        <Field label="SKU" required error={errors.sku}>
          {(p) => (
            <Input
              {...p}
              value={values.sku}
              onChange={(e) => set("sku", e.target.value.toUpperCase())}
              placeholder="CW-25"
            />
          )}
        </Field>
        <Field label="Category" required error={errors.category}>
          {(p) => <Input {...p} value={values.category} onChange={(e) => set("category", e.target.value)} placeholder="Cables" />}
        </Field>
        <Field label="Location" required error={errors.location}>
          {(p) => <Input {...p} value={values.location} onChange={(e) => set("location", e.target.value)} placeholder="Rack A-3" />}
        </Field>
        <Field label="Unit price (₹)" required error={errors.unit_price}>
          {(p) => (
            <Input
              {...p}
              inputMode="decimal"
              value={values.unit_price}
              onChange={(e) => set("unit_price", e.target.value)}
              placeholder="120.00"
            />
          )}
        </Field>
        <Field
          label="Opening stock"
          required={!isEdit}
          hint={isEdit ? "Adjust stock via Stock Movements" : "Units in hand now"}
          error={errors.current_stock}
        >
          {(p) => (
            <Input
              {...p}
              inputMode="numeric"
              value={values.current_stock}
              onChange={(e) => set("current_stock", e.target.value)}
              disabled={isEdit}
            />
          )}
        </Field>
        <Field label="Low-stock alert" required hint="Warn when stock falls to this level" error={errors.min_stock_alert}>
          {(p) => (
            <Input
              {...p}
              inputMode="numeric"
              value={values.min_stock_alert}
              onChange={(e) => set("min_stock_alert", e.target.value)}
            />
          )}
        </Field>
      </div>
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
