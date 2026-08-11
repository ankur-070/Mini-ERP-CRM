"use client"

import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { Check, ChevronDown, Search } from "lucide-react"
import { Input } from "@/components/ui/field"
import { Spinner } from "@/components/ui/states"
import { productsApi } from "@/lib/api/products"
import { useDebouncedValue } from "@/lib/hooks"
import { cn, formatNumber } from "@/lib/format"
import type { Product } from "@/types/product"

/**
 * Async, searchable product selector backed by the products list endpoint.
 * Emits the full Product so callers can show live stock and unit price.
 */
export function ProductCombobox({
  value,
  onChange,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  placeholder = "Search a product…",
}: {
  value: Product | null
  onChange: (product: Product | null) => void
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
    open ? ["product-combobox", debounced] : null,
    () => productsApi.list({ search: debounced, page: 1, limit: 8 }),
  )
  const products = data?.data ?? []

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
              {value.name} <span className="font-mono text-xs text-muted-foreground">({value.sku})</span>
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
              placeholder="Type to search…"
              className="h-9 pl-9"
            />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {isLoading ? (
              <li className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                <Spinner /> Searching…
              </li>
            ) : products.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">No products found</li>
            ) : (
              products.map((p) => {
                const selected = value?.id === p.id
                return (
                  <li key={p.id} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(p)
                        setOpen(false)
                        setSearch("")
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                        selected && "bg-accent",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">{p.name}</span>
                        <span className="block font-mono text-xs text-muted-foreground">{p.sku}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                        {formatNumber(p.current_stock)} in stock
                        {selected ? <Check className="h-4 w-4 text-primary" /> : null}
                      </span>
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
