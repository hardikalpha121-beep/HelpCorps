import { z } from 'zod';

// ── Update profile ──────────────────────────────────────────────────────
export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  mobile: z.string().min(10).optional(),
  city: z.string().min(2).max(100).optional(),
  age: z.number().int().min(1).max(150).optional(),
  profilePhoto: z.string().url().optional(),
  disabilityType: z.enum(['deaf', 'blind', 'handicapped', 'elderly', 'none']).optional(),
  location: z
    .object({
      longitude: z.number().min(-180).max(180),
      latitude: z.number().min(-90).max(90),
    })
    .optional(),
});

// ── Delete account ──────────────────────────────────────────────────────
export const deleteAccountSchema = z.object({
  confirmText: z.literal('DELETE MY ACCOUNT', {
    message: 'You must type "DELETE MY ACCOUNT" to confirm',
  }),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
