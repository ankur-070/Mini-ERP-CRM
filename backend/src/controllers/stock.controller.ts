import { Request, Response, NextFunction } from 'express';
import { StockService } from '../services/stock.service';
import { ApiResponse } from '../utils/apiResponse';

export class StockController {
  static async getStockMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.query.productId ? parseInt(req.query.productId as string, 10) : undefined;
      const movementType = req.query.movementType as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const result = await StockService.getStockMovements({ productId, movementType, page, limit });
      return ApiResponse.success(res, 200, 'Stock movements retrieved successfully', result.movements, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async createManualAdjustment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await StockService.createManualAdjustment(req.body, userId);
      return ApiResponse.success(res, 201, 'Stock adjustment applied successfully', result);
    } catch (error) {
      next(error);
    }
  }
}
