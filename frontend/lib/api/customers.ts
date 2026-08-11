import { apiClient } from "./client"
import type {
  AddNoteInput,
  Customer,
  CustomerDetail,
  CustomerInput,
  CustomerNote,
  CustomerQuery,
} from "@/types/customer"

export const customersApi = {
  list: (query: CustomerQuery) =>
    apiClient.get<Customer[]>("/customers", {
      search: query.search,
      type: query.type,
      status: query.status,
      page: query.page,
      limit: query.limit,
    }),

  get: (id: number) => apiClient.get<CustomerDetail>(`/customers/${id}`),

  create: (payload: CustomerInput) => apiClient.post<Customer>("/customers", payload),

  update: (id: number, payload: Partial<CustomerInput>) =>
    apiClient.put<Customer>(`/customers/${id}`, payload),

  addNote: (id: number, payload: AddNoteInput) =>
    apiClient.post<CustomerNote>(`/customers/${id}/notes`, payload),
}
