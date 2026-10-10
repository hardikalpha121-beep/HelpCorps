import { z } from 'zod';

// ── Register ────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  mobile: z.string().optional().or(z.literal('')),
  city: z.string().min(2).max(100).optional(),
  age: z.number().int().min(1).max(150).optional(),
  disabilityType: z.enum(['deaf', 'blind', 'handicapped', 'elderly', 'none']).optional(),
  location: z
    .object({
      longitude: z.number().min(-180).max(180),
      latitude: z.number().min(-90).max(90),
    })
    .optional(),
});

// ── Login ───────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
