import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service';
import { ApiResponse } from '../utils/apiResponse';

export class CustomerController {
  static async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await CustomerService.createCustomer(req.body);
      return ApiResponse.success(res, 201, 'Customer created successfully', customer);
    } catch (error) {
      next(error);
    }
  }

  static async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await CustomerService.updateCustomer(id, req.body);
      return ApiResponse.success(res, 200, 'Customer details updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  static async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const type = req.query.type as string;
      const status = req.query.status as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const result = await CustomerService.getCustomers({ search, type, status, page, limit });
      return ApiResponse.success(res, 200, 'Customers fetched successfully', result.customers, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const customer = await CustomerService.getCustomerById(id);
      return ApiResponse.success(res, 200, 'Customer data retrieved successfully', customer);
    } catch (error) {
      next(error);
    }
  }

  static async addFollowUpNote(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const { note, follow_up_date } = req.body;
      const userId = req.user!.id;

      const newNote = await CustomerService.addFollowUpNote(id, note, follow_up_date, userId);
      return ApiResponse.success(res, 201, 'Follow-up note added successfully', newNote);
    } catch (error) {
      next(error);
    }
  }
}
