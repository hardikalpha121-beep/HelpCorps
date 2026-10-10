import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import User from '../modules/users/user.model.js';

/**
 * JWT authentication middleware.
 * Verifies the access token from the Authorization header and attaches req.user.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw AppError.unauthorized('No access token provided');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw AppError.unauthorized('No access token provided');
  }

  try {
    const payload = verifyAccessToken(token);

    // Fetch user from DB to ensure they still exist and aren't deleted
    const user = await User.findOne({
      _id: payload.userId,
      isDeleted: false,
    }).select('_id fullName email role isVolunteer');

    if (!user) {
      throw AppError.unauthorized('User not found or account deleted');
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw AppError.forbidden('Account is temporarily locked. Please try again later.');
    }

    req.user = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVolunteer: user.isVolunteer,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) throw error;

    // JWT-specific errors
    if ((error as Error).name === 'TokenExpiredError') {
      throw AppError.tokenExpired();
    }
    throw AppError.tokenInvalid();
  }
}

/**
 * Optional authentication middleware: attaches req.user if a valid token is present,
 * but allows unauthenticated requests to proceed.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findOne({
      _id: payload.userId,
      isDeleted: false,
    }).select('_id fullName email role isVolunteer');

    if (user && (!user.lockUntil || user.lockUntil <= new Date())) {
      req.user = {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVolunteer: user.isVolunteer,
      };
    }
  } catch {
    // Proceed as unauthenticated
  }
  next();
}
