import { Response } from 'express';

export interface ApiResponsePayload<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class ApiResponse {
  static success<T>(res: Response, statusCode: number = 200, message: string, data?: T, meta?: any): Response {
    const payload: ApiResponsePayload<T> = {
      success: true,
      message,
      data,
      meta
    };
    return res.status(statusCode).json(payload);
  }

  static error(res: Response, statusCode: number = 500, message: string, errorCode: string = 'INTERNAL_ERROR', details?: any): Response {
    const payload: ApiResponsePayload = {
      success: false,
      error: {
        code: errorCode,
        message,
        details
      }
    };
    return res.status(statusCode).json(payload);
  }
}
