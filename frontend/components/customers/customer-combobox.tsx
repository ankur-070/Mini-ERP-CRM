"use client"

import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { Check, ChevronDown, Search } from "lucide-react"
import { Input } from "@/components/ui/field"
import { Spinner } from "@/components/ui/states"
import { customersApi } from "@/lib/api/customers"
import { useDebouncedValue } from "@/lib/hooks"
import { cn } from "@/lib/format"
import type { Customer } from "@/types/customer"

export function CustomerCombobox({
  value,
  onChange,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  placeholder = "Search customer by name or business…",
}: {
  value: Customer | null
  onChange: (customer: Customer | null) => void
  id?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const debounced = useDebouncedValue(search, 300)
  const wrapRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useSWR(
    open ? ["customer-combobox", debounced] : null,
    () => customersApi.list({ search: debounced, page: 1, limit: 10 }),
  )
  const customers = data?.data ?? []

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        id={id}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-left text-sm transition-colors focus:border-primary aria-[invalid=true]:border-danger",
          !value && "text-muted-foreground",
        )}
      >
        <span className="truncate">
          {value ? (
            <>
              {value.name} <span className="text-xs text-muted-foreground">({value.business_name})</span>
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open ? (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
          <div className="relative border-b border-border p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type customer name, business, mobile or email…"
              className="h-9 pl-9"
            />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {isLoading ? (
              <li className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                <Spinner /> Searching…
              </li>
            ) : customers.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">No customers found</li>
            ) : (
              customers.map((c) => {
                const selected = value?.id === c.id
                return (
                  <li key={c.id} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(c)
                        setOpen(false)
                        setSearch("")
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                        selected && "bg-accent",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">{c.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{c.business_name} • {c.mobile_number}</span>
                      </span>
                      {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
