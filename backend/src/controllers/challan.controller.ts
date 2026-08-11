import { Request, Response, NextFunction } from 'express';
import { ChallanService } from '../services/challan.service';
import { ApiResponse } from '../utils/apiResponse';

export class ChallanController {
  static async createChallan(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const challan = await ChallanService.createChallan(req.body, userId);
      return ApiResponse.success(res, 201, 'Sales Challan created successfully', challan);
    } catch (error) {
      next(error);
    }
  }

  static async confirmChallan(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user!.id;
      const confirmedChallan = await ChallanService.confirmChallan(id, userId);
      return ApiResponse.success(res, 200, 'Sales Challan confirmed successfully. Stock deducted and movement logged.', confirmedChallan);
    } catch (error) {
      next(error);
    }
  }

  static async cancelChallan(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user!.id;
      const cancelledChallan = await ChallanService.cancelChallan(id, userId);
      return ApiResponse.success(res, 200, 'Sales Challan cancelled successfully', cancelledChallan);
    } catch (error) {
      next(error);
    }
  }

  static async getChallans(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string;
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string, 10) : undefined;
      const search = req.query.search as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const result = await ChallanService.getChallans({ status, customerId, search, page, limit });
      return ApiResponse.success(res, 200, 'Sales Challans retrieved successfully', result.challans, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getChallanById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const challan = await ChallanService.getChallanById(id);
      return ApiResponse.success(res, 200, 'Sales Challan detail retrieved successfully', challan);
    } catch (error) {
      next(error);
    }
  }
}
