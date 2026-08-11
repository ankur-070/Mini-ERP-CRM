import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Response {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

  if (err instanceof ApiError) {
    return ApiResponse.error(
      res,
      err.statusCode,
      err.message,
      err.errorCode,
      err.details
    );
  }

  // Handle Postgres Duplicate Key Errors (23505)
  if (err && err.code === '23505') {
    return ApiResponse.error(
      res,
      409,
      `A resource with that unique key already exists (${err.detail || 'Duplicate key value'})`,
      'DUPLICATE_ENTRY',
      err.detail
    );
  }

  // Handle Syntax/JSON parse error
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    return ApiResponse.error(res, 400, 'Invalid JSON payload provided', 'INVALID_JSON');
  }

  return ApiResponse.error(
    res,
    500,
    err.message || 'Internal server error occurred',
    'INTERNAL_SERVER_ERROR'
  );
}
