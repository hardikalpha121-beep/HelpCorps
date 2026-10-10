import { z } from 'zod';

// ── Instant help trigger ────────────────────────────────────────────────
export const instantHelpSchema = z.object({
  location: z.object({
    longitude: z.number().min(-180).max(180),
    latitude: z.number().min(-90).max(90),
  }),
  address: z.string().min(5).max(200).optional(),
  description: z.string().max(500).optional(),
});

// ── Resolve alert ───────────────────────────────────────────────────────
export const resolveAlertSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid alert ID'),
});

export type InstantHelpInput = z.infer<typeof instantHelpSchema>;
