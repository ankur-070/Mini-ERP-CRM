import { apiClient } from "./client"
import type { Product, ProductInput, ProductQuery } from "@/types/product"

export const productsApi = {
  list: (query: ProductQuery) =>
    apiClient.get<Product[]>("/products", {
      search: query.search,
      category: query.category,
      lowStock: query.lowStock ? "true" : undefined,
      page: query.page,
      limit: query.limit,
    }),

  get: (id: number) => apiClient.get<Product>(`/products/${id}`),

  create: (payload: ProductInput) => apiClient.post<Product>("/products", payload),

  update: (id: number, payload: Partial<ProductInput>) =>
    apiClient.put<Product>(`/products/${id}`, payload),
}
