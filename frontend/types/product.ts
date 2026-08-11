export interface Product {
  id: number
  name: string
  sku: string
  category: string
  unit_price: string | number
  current_stock: number
  min_stock_alert: number
  location: string
  is_low_stock?: boolean
  created_at: string
  updated_at: string
}

export interface ProductInput {
  name: string
  sku: string
  category: string
  unit_price: number
  current_stock: number
  min_stock_alert: number
  location: string
}

export interface ProductQuery {
  search?: string
  category?: string
  lowStock?: boolean
  page?: number
  limit?: number
}
