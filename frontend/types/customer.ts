export type CustomerType = "Retail" | "Wholesale" | "Distributor"
export type CustomerStatus = "Lead" | "Active" | "Inactive"

export const CUSTOMER_TYPES: CustomerType[] = ["Retail", "Wholesale", "Distributor"]
export const CUSTOMER_STATUSES: CustomerStatus[] = ["Lead", "Active", "Inactive"]

export interface Customer {
  id: number
  name: string
  mobile_number: string
  email: string
  business_name: string
  gst_number: string | null
  customer_type: CustomerType
  address: string
  status: CustomerStatus
  follow_up_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CustomerNote {
  id: number
  customer_id: number
  note: string
  follow_up_date: string | null
  created_by: number
  created_by_name: string
  created_at: string
}

export interface CustomerDetail extends Customer {
  notes_history: CustomerNote[]
}

export interface CustomerInput {
  name: string
  mobile_number: string
  email: string
  business_name: string
  gst_number?: string | null
  customer_type: CustomerType
  address: string
  status: CustomerStatus
  follow_up_date?: string | null
  notes?: string | null
}

export interface AddNoteInput {
  note: string
  follow_up_date?: string | null
}

export interface CustomerQuery {
  search?: string
  type?: CustomerType | ""
  status?: CustomerStatus | ""
  page?: number
  limit?: number
}
