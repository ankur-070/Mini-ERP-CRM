import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { ApiResponse } from '../utils/apiResponse';

export class ProductController {
  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.createProduct(req.body);
      return ApiResponse.success(res, 201, 'Product created successfully', product);
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await ProductService.updateProduct(id, req.body);
      return ApiResponse.success(res, 200, 'Product updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const category = req.query.category as string;
      const lowStock = req.query.lowStock === 'true';
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const result = await ProductService.getProducts({ search, category, lowStock, page, limit });
      return ApiResponse.success(res, 200, 'Products fetched successfully', result.products, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const product = await ProductService.getProductById(id);
      return ApiResponse.success(res, 200, 'Product details retrieved', product);
    } catch (error) {
      next(error);
    }
  }
}
