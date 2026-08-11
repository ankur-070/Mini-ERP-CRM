"use client"

import { use, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ArrowLeft, Building2, CalendarClock, Mail, MapPin, Pencil, Phone, Plus, StickyNote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field, Input, Textarea } from "@/components/ui/field"
import { CustomerStatusBadge } from "@/components/ui/badge"
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states"
import { Dialog } from "@/components/ui/dialog"
import { CustomerForm } from "@/components/customers/customer-form"
import { PermissionGuard } from "@/components/layout/permission-guard"
import { customersApi } from "@/lib/api/customers"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/toast"
import { can } from "@/lib/permissions"
import { errorMessage } from "@/lib/error"
import { formatDate, formatDateTime, initials } from "@/lib/format"
import type { AddNoteInput, CustomerInput } from "@/types/customer"

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <PermissionGuard permission="customers.view">
      <CustomerDetailContent id={Number(id)} />
    </PermissionGuard>
  )
}

function CustomerDetailContent({ id }: { id: number }) {
  const { user } = useAuth()
  const toast = useToast()
  const canWrite = can(user?.role, "customers.write")
  const canNote = can(user?.role, "customers.note")

  const { data, error, isLoading, mutate } = useSWR(
    Number.isFinite(id) ? ["customer", id] : null,
    () => customersApi.get(id),
  )

  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState("")
  const [followUp, setFollowUp] = useState("")
  const [addingNote, setAddingNote] = useState(false)

  const customer = data?.data

  async function handleUpdate(payload: CustomerInput) {
    setSaving(true)
    try {
      await customersApi.update(id, payload)
      toast.success("Customer updated")
      setEditOpen(false)
      mutate()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!note.trim()) return
    setAddingNote(true)
    try {
      const payload: AddNoteInput = { note: note.trim(), follow_up_date: followUp || null }
      await customersApi.addNote(id, payload)
      toast.success("Note added")
      setNote("")
      setFollowUp("")
      setNoteOpen(false)
      mutate()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setAddingNote(false)
    }
  }

  if (isLoading) return <LoadingState label="Loading customer…" />
  if (error) return <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />
  if (!customer) return <ErrorState message="Customer not found." />

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to customers
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
            {initials(customer.name)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground text-balance">{customer.name}</h1>
              <CustomerStatusBadge status={customer.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {customer.business_name} · {customer.customer_type}
            </p>
          </div>
        </div>
        {canWrite ? (
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-1">
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-foreground">Contact details</h2>
            <dl className="space-y-3 text-sm">
              <DetailRow icon={Phone} label="Mobile" value={customer.mobile_number} />
              <DetailRow icon={Mail} label="Email" value={customer.email} />
              <DetailRow icon={Building2} label="GST number" value={customer.gst_number || "—"} />
              <DetailRow icon={MapPin} label="Address" value={customer.address} />
              <DetailRow icon={CalendarClock} label="Follow-up" value={formatDate(customer.follow_up_date)} />
            </dl>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Notes &amp; activity</h2>
            {canNote ? (
              <Button size="sm" variant="outline" onClick={() => setNoteOpen(true)}>
                <Plus className="h-4 w-4" />
                Add note
              </Button>
            ) : null}
          </div>

          {customer.notes_history.length === 0 ? (
            <Card>
              <EmptyState
                icon={StickyNote}
                title="No notes yet"
                description={canNote ? "Log a call, meeting or follow-up to keep the timeline up to date." : undefined}
              />
            </Card>
          ) : (
            <ol className="relative space-y-4 border-l border-border pl-6">
              {customer.notes_history.map((n) => (
                <li key={n.id} className="relative">
                  <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
                  <Card className="p-4">
                    <p className="whitespace-pre-wrap text-sm text-foreground">{n.note}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{n.created_by_name}</span>
                      <span>{formatDateTime(n.created_at)}</span>
                      {n.follow_up_date ? (
                        <span className="inline-flex items-center gap-1 text-warning">
                          <CalendarClock className="h-3 w-3" />
                          Follow-up {formatDate(n.follow_up_date)}
                        </span>
                      ) : null}
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <Dialog
        open={editOpen}
        onClose={() => (saving ? null : setEditOpen(false))}
        title="Edit customer"
        size="lg"
      >
        <CustomerForm
          customer={customer}
          onSubmit={handleUpdate}
          onCancel={() => setEditOpen(false)}
          submitting={saving}
          submitLabel="Save changes"
        />
      </Dialog>

      <Dialog
        open={noteOpen}
        onClose={() => (addingNote ? null : setNoteOpen(false))}
        title="Add note"
        description="Record an interaction and optionally set a follow-up date."
        footer={
          <>
            <Button variant="outline" onClick={() => setNoteOpen(false)} disabled={addingNote}>
              Cancel
            </Button>
            <Button form="add-note-form" type="submit" loading={addingNote}>
              Add note
            </Button>
          </>
        }
      >
        <form id="add-note-form" onSubmit={handleAddNote} className="space-y-4">
          <Field label="Note" required>
            {(p) => (
              <Textarea
                {...p}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Called to discuss pricing…"
                autoFocus
              />
            )}
          </Field>
          <Field label="Follow-up date" hint="Optional">
            {(p) => <Input {...p} type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />}
          </Field>
        </form>
      </Dialog>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="break-words text-foreground">{value}</dd>
      </div>
    </div>
  )
}
