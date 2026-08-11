export type ChallanStatus = "Draft" | "Confirmed" | "Cancelled"

export const CHALLAN_STATUSES: ChallanStatus[] = ["Draft", "Confirmed", "Cancelled"]

export interface ChallanCustomerSnapshot {
  id: number
  name: string
  mobile_number: string
  email: string
  business_name: string
  gst_number: string | null
  address: string
}

export interface ChallanItem {
  id: number
  challan_id: number
  product_id: number
  product_name: string
  product_sku: string
  unit_price: string | number
  quantity: number
  line_total: string | number
}

export interface Challan {
  id: number
  challan_number: string
  customer_id: number
  customer_snapshot: ChallanCustomerSnapshot
  total_quantity: number
  total_amount: string | number
  status: ChallanStatus
  created_by: number
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface ChallanDetail extends Challan {
  items: ChallanItem[]
}

export interface CreateChallanItemInput {
  product_id: number
  quantity: number
}

export interface CreateChallanInput {
  customer_id: number
  status: "Draft" | "Confirmed"
  items: CreateChallanItemInput[]
}

export interface ChallanQuery {
  status?: ChallanStatus | ""
  customerId?: number
  search?: string
  page?: number
  limit?: number
}

/** Shape of a single item inside an INSUFFICIENT_STOCK error's details array. */
export interface InsufficientStockDetail {
  productId: number
  productName: string
  productSku: string
  requested: number
  available: number
}
