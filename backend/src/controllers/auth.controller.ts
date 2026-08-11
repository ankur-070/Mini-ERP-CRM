import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/apiResponse';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      return ApiResponse.success(res, 200, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  }

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role } = req.body;
      const newUser = await AuthService.register(name, email, password, role);
      return ApiResponse.success(res, 201, 'User account registered successfully', newUser);
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const user = await AuthService.getUserProfile(userId);
      return ApiResponse.success(res, 200, 'User profile retrieved', user);
    } catch (error) {
      next(error);
    }
  }
}
