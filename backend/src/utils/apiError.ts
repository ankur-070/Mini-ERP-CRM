export class ApiError extends Error {
  public statusCode: number;
  public errorCode?: string;
  public details?: any;

  constructor(statusCode: number, message: string, errorCode?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode || 'INTERNAL_ERROR';
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errorCode: string = 'BAD_REQUEST', details?: any): ApiError {
    return new ApiError(400, message, errorCode, details);
  }

  static unauthorized(message: string = 'Unauthorized access', errorCode: string = 'UNAUTHORIZED'): ApiError {
    return new ApiError(401, message, errorCode);
  }

  static forbidden(message: string = 'Permission denied', errorCode: string = 'FORBIDDEN'): ApiError {
    return new ApiError(403, message, errorCode);
  }

  static notFound(message: string = 'Resource not found', errorCode: string = 'NOT_FOUND'): ApiError {
    return new ApiError(404, message, errorCode);
  }

  static conflict(message: string, errorCode: string = 'CONFLICT'): ApiError {
    return new ApiError(409, message, errorCode);
  }

  static internal(message: string = 'Internal server error', errorCode: string = 'INTERNAL_ERROR'): ApiError {
    return new ApiError(500, message, errorCode);
  }
}
