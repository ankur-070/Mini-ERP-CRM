import type { Role } from "@/types/auth"

/**
 * Frontend mirror of the backend role matrix. This governs UX only — the
 * backend remains the real security boundary. Actions a user cannot perform
 * are hidden/disabled rather than relied upon for security.
 */
export type Permission =
  | "users.register"
  | "customers.view"
  | "customers.write"
  | "customers.note"
  | "products.view"
  | "products.write"
  | "stock.view"
  | "stock.write"
  | "challans.view"
  | "challans.write"
  | "challans.confirm"
  | "challans.cancel"

const MATRIX: Record<Permission, Role[]> = {
  "users.register": ["Admin"],

  "customers.view": ["Admin", "Sales", "Accounts"],
  "customers.write": ["Admin", "Sales"],
  "customers.note": ["Admin", "Sales"],

  "products.view": ["Admin", "Sales", "Warehouse", "Accounts"],
  "products.write": ["Admin", "Warehouse"],

  "stock.view": ["Admin", "Warehouse", "Accounts"],
  "stock.write": ["Admin", "Warehouse"],

  "challans.view": ["Admin", "Sales", "Warehouse", "Accounts"],
  "challans.write": ["Admin", "Sales"],
  "challans.confirm": ["Admin", "Sales"],
  "challans.cancel": ["Admin", "Sales"],
}

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false
  return MATRIX[permission].includes(role)
}

/** Whether the role can see at least one action within a navigable module. */
export function canViewModule(role: Role | undefined | null, permission: Permission): boolean {
  return can(role, permission)
}
