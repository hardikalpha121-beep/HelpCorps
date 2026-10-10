import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

/**
 * Central error handler — always the LAST middleware in the chain.
 * Converts all errors to the standard { success: false, error: { code, message, fields? } } shape.
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Default to 500 internal error
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let fields: Record<string, string[]> | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    fields = err.fields;
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
  } else if (err.name === 'CastError') {
    // Invalid MongoDB ObjectId
    statusCode = 400;
    code = 'INVALID_REQUEST';
    message = 'Invalid resource ID format';
  } else if ((err as any).code === 11000) {
    // MongoDB duplicate key
    statusCode = 409;
    code = 'CONFLICT';
    message = 'Resource already exists';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'TOKEN_INVALID';
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Access token expired';
  }

  // Log server errors (never log passwords, tokens, or PII)
  if (statusCode >= 500) {
    logger.error('Server error:', {
      code,
      message: err.message,
      stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }

  const errorResponse: Record<string, unknown> = { code, message };
  if (fields) {
    errorResponse.fields = fields;
  }

  // Include stack trace only in development
  if (env.NODE_ENV === 'development' && statusCode >= 500) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json({
    success: false,
    error: errorResponse,
  });
}
