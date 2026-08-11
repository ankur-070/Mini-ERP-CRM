import { apiClient } from "./client"
import type {
  StockAdjustmentResult,
  StockMovement,
  StockMovementInput,
  StockQuery,
} from "@/types/stock"

export const stockMovementsApi = {
  list: (query: StockQuery) =>
    apiClient.get<StockMovement[]>("/stock-movements", {
      productId: query.productId,
      movementType: query.movementType,
      page: query.page,
      limit: query.limit,
    }),

  create: (payload: StockMovementInput) =>
    apiClient.post<StockAdjustmentResult>("/stock-movements", payload),
}
