import { apiClient } from "./client"
import type { Challan, ChallanDetail, ChallanQuery, CreateChallanInput } from "@/types/challan"

export const challansApi = {
  list: (query: ChallanQuery) =>
    apiClient.get<Challan[]>("/challans", {
      status: query.status,
      customerId: query.customerId,
      search: query.search,
      page: query.page,
      limit: query.limit,
    }),

  get: (id: number) => apiClient.get<ChallanDetail>(`/challans/${id}`),

  create: (payload: CreateChallanInput) => apiClient.post<ChallanDetail>("/challans", payload),

  confirm: (id: number) => apiClient.post<ChallanDetail>(`/challans/${id}/confirm`),

  cancel: (id: number) => apiClient.post<Challan>(`/challans/${id}/cancel`),
}
