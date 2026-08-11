"use client"

import { useState } from "react"
import { Field, Input, Select, Textarea } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { CUSTOMER_STATUSES, CUSTOMER_TYPES } from "@/types/customer"
import type { CustomerDetail, CustomerInput } from "@/types/customer"
import { toDateInputValue } from "@/lib/format"

type FieldErrors = Partial<Record<keyof CustomerInput, string>>

function buildInitial(customer?: CustomerDetail | null): CustomerInput {
  return {
    name: customer?.name ?? "",
    mobile_number: customer?.mobile_number ?? "",
    email: customer?.email ?? "",
    business_name: customer?.business_name ?? "",
    gst_number: customer?.gst_number ?? "",
    customer_type: customer?.customer_type ?? "Retail",
    address: customer?.address ?? "",
    status: customer?.status ?? "Lead",
    follow_up_date: toDateInputValue(customer?.follow_up_date) || "",
  }
}

export function CustomerForm({
  customer,
  onSubmit,
  onCancel,
  submitLabel = "Save customer",
  submitting,
  serverErrors,
}: {
  customer?: CustomerDetail | null
  onSubmit: (payload: CustomerInput) => void
  onCancel: () => void
  submitLabel?: string
  submitting?: boolean
  serverErrors?: FieldErrors
}) {
  const [values, setValues] = useState<CustomerInput>(() => buildInitial(customer))
  const [errors, setErrors] = useState<FieldErrors>({})

  const merged = { ...errors, ...serverErrors }

  function set<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const next: FieldErrors = {}
    if (!values.name.trim()) next.name = "Name is required."
    if (!/^\d{10}$/.test(values.mobile_number.trim()))
      next.mobile_number = "Enter a valid 10-digit mobile number."
    if (!values.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next.email = "Enter a valid email address."
    if (!values.business_name.trim()) next.business_name = "Business name is required."
    if (!values.address.trim()) next.address = "Address is required."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      ...values,
      gst_number: values.gst_number?.trim() ? values.gst_number.trim() : null,
      follow_up_date: values.follow_up_date ? values.follow_up_date : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact name" required error={merged.name}>
          {(p) => (
            <Input {...p} value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="Ravi Kumar" />
          )}
        </Field>
        <Field label="Business name" required error={merged.business_name}>
          {(p) => (
            <Input
              {...p}
              value={values.business_name}
              onChange={(e) => set("business_name", e.target.value)}
              placeholder="Kumar Traders"
            />
          )}
        </Field>
        <Field label="Mobile number" required error={merged.mobile_number}>
          {(p) => (
            <Input
              {...p}
              inputMode="numeric"
              value={values.mobile_number}
              onChange={(e) => set("mobile_number", e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="9876543210"
            />
          )}
        </Field>
        <Field label="Email" required error={merged.email}>
          {(p) => (
            <Input
              {...p}
              type="email"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="ravi@example.com"
            />
          )}
        </Field>
        <Field label="Customer type" required error={merged.customer_type}>
          {(p) => (
            <Select {...p} value={values.customer_type} onChange={(e) => set("customer_type", e.target.value as CustomerInput["customer_type"])}>
              {CUSTOMER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Status" required error={merged.status}>
          {(p) => (
            <Select {...p} value={values.status} onChange={(e) => set("status", e.target.value as CustomerInput["status"])}>
              {CUSTOMER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="GST number" hint="Optional" error={merged.gst_number}>
          {(p) => (
            <Input
              {...p}
              value={values.gst_number ?? ""}
              onChange={(e) => set("gst_number", e.target.value.toUpperCase())}
              placeholder="22AAAAA0000A1Z5"
            />
          )}
        </Field>
        <Field label="Follow-up date" hint="Optional" error={merged.follow_up_date}>
          {(p) => (
            <Input
              {...p}
              type="date"
              value={values.follow_up_date ?? ""}
              onChange={(e) => set("follow_up_date", e.target.value)}
            />
          )}
        </Field>
      </div>
      <Field label="Address" required error={merged.address}>
        {(p) => (
          <Textarea
            {...p}
            value={values.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Shop no, street, city, state, pincode"
          />
        )}
      </Field>
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
