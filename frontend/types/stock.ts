import type { Product } from "./product"

export type MovementType = "IN" | "OUT"

export interface StockMovement {
  id: number
  product_id: number
  product_name: string
  product_sku: string
  quantity: number
  movement_type: MovementType
  reason: string
  challan_id: number | null
  created_by: number
  created_by_name: string
  created_at: string
}

export interface StockMovementInput {
  product_id: number
  quantity: number
  movement_type: MovementType
  reason: string
}

export interface StockAdjustmentResult {
  movement: StockMovement
  updated_product: Product
}

export interface StockQuery {
  productId?: number
  movementType?: MovementType | ""
  page?: number
  limit?: number
}
