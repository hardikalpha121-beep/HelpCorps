import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/AppError.js';

/**
 * Zod validation middleware factory.
 * Validates req.body, req.query, and/or req.params against provided schemas.
 */
export function validate(schemas: {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
}) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: Record<string, string[]> = {};

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        for (const [key, msgs] of Object.entries(fieldErrors)) {
          errors[key] = (msgs as string[]) || ['Invalid value'];
        }
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        for (const [key, msgs] of Object.entries(fieldErrors)) {
          errors[`query.${key}`] = (msgs as string[]) || ['Invalid value'];
        }
      } else {
        try {
          Object.assign(req.query, result.data);
        } catch {
          Object.defineProperty(req, 'query', {
            value: result.data,
            writable: true,
            configurable: true,
          });
        }
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        for (const [key, msgs] of Object.entries(fieldErrors)) {
          errors[`params.${key}`] = (msgs as string[]) || ['Invalid value'];
        }
      } else {
        (req as any).params = result.data;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw AppError.validationError(errors);
    }

    next();
  };
}
