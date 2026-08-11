export type Role = "Admin" | "Sales" | "Warehouse" | "Accounts"

export const ROLES: Role[] = ["Admin", "Sales", "Warehouse", "Accounts"]

export interface User {
  id: number
  name: string
  email: string
  role: Role
  created_at?: string
  updated_at?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResult {
  token: string
  user: User
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  role: Role
}
