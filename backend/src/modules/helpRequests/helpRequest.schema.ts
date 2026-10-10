import { z } from 'zod';

// ── Create help request ─────────────────────────────────────────────────
export const createHelpRequestSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().optional(),
  serviceType: z.string().optional().default('General Assistance'),
  description: z.string().min(2, 'Description must be at least 2 characters').max(2000),
  location: z
    .object({
      longitude: z.number().min(-180).max(180),
      latitude: z.number().min(-90).max(90),
    })
    .optional(),
  address: z.string().optional().or(z.literal('')),
  numberOfVolunteersNeeded: z.number().int().min(1).max(10).default(1),
});

// ── List query ──────────────────────────────────────────────────────────
export const listHelpRequestsSchema = z.object({
  category: z.string().optional(),
  subCategory: z.string().optional(),
  status: z.enum(['pending', 'accepted', 'inProgress', 'completed', 'cancelled']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

// ── Rate completed request ──────────────────────────────────────────────
export const rateHelpRequestSchema = z.object({
  rating: z.number().int().min(1).max(5),
  ratingComment: z.string().max(500).optional(),
});

// ── MongoDB ObjectId param ──────────────────────────────────────────────
export const objectIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resource ID'),
});

export type CreateHelpRequestInput = z.infer<typeof createHelpRequestSchema>;
export type ListHelpRequestsInput = z.infer<typeof listHelpRequestsSchema>;
export type RateHelpRequestInput = z.infer<typeof rateHelpRequestSchema>;
