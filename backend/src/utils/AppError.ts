/**
 * Custom application error class for consistent error responses.
 * Thrown in services/controllers, caught by errorHandler middleware.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly fields?: Record<string, string[]>;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    fields?: Record<string, string[]>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  // ── Factory methods for common errors ──
  static badRequest(message: string, fields?: Record<string, string[]>): AppError {
    return new AppError(400, 'INVALID_REQUEST', message, fields);
  }

  static validationError(fields: Record<string, string[]>): AppError {
    const firstFieldKey = Object.keys(fields)[0];
    const firstMsg = firstFieldKey && fields[firstFieldKey]?.[0];
    const message = firstMsg ? `${firstFieldKey}: ${firstMsg}` : 'Validation failed';
    return new AppError(400, 'VALIDATION_ERROR', message, fields);
  }

  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static tokenExpired(): AppError {
    return new AppError(401, 'TOKEN_EXPIRED', 'Access token expired');
  }

  static tokenInvalid(): AppError {
    return new AppError(401, 'TOKEN_INVALID', 'Invalid token');
  }

  static refreshTokenInvalid(): AppError {
    return new AppError(401, 'REFRESH_TOKEN_INVALID', 'Invalid or expired refresh token');
  }

  static forbidden(message = 'Insufficient permissions'): AppError {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(resource = 'Resource'): AppError {
    return new AppError(404, 'NOT_FOUND', `${resource} not found`);
  }

  static conflict(message: string): AppError {
    return new AppError(409, 'CONFLICT', message);
  }

  static rateLimited(): AppError {
    return new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests');
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(500, 'INTERNAL_ERROR', message);
  }
}
