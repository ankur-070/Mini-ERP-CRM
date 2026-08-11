import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';

export type Role = 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';

export function authorizeRoles(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${req.user.role}' is not authorized to perform this action. Allowed roles: ${allowedRoles.join(', ')}`,
          'ROLE_NOT_AUTHORIZED'
        )
      );
    }

    next();
  };
}
