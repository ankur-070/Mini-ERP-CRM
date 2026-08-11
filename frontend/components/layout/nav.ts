import {
  LayoutDashboard,
  Users,
  Package,
  ArrowLeftRight,
  FileText,
  UserCog,
} from "lucide-react"
import type { Permission } from "@/lib/permissions"

export interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  /** Permission required to see this nav entry. */
  permission: Permission
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "products.view" },
  { label: "Customers", href: "/customers", icon: Users, permission: "customers.view" },
  { label: "Products", href: "/products", icon: Package, permission: "products.view" },
  { label: "Stock Movements", href: "/stock-movements", icon: ArrowLeftRight, permission: "stock.view" },
  { label: "Sales Challans", href: "/challans", icon: FileText, permission: "challans.view" },
  { label: "User Management", href: "/users", icon: UserCog, permission: "users.register" },
]
