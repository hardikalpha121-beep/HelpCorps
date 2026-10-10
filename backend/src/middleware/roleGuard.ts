import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

/**
 * Role-based access control middleware factory.
 * Must be used AFTER requireAuth middleware.
 *
 * @param allowedRoles - Array of roles that can access this route
 */
export function roleGuard(...allowedRoles: Array<'user' | 'volunteer' | 'admin'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden(
        `This action requires one of: ${allowedRoles.join(', ')}`,
      );
    }

    next();
  };
}
