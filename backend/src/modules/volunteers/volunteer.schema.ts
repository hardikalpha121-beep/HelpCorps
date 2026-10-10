import { z } from 'zod';

// ── Register as volunteer ───────────────────────────────────────────────
export const registerVolunteerSchema = z.object({
  skills: z.array(z.string().min(1)).min(1, 'At least one skill is required'),
  availability: z.union([
    z.object({
      days: z
        .array(z.string().toLowerCase())
        .min(1, 'At least one available day is required')
        .default(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
      hours: z
        .union([
          z.object({
            start: z.string().default('08:00'),
            end: z.string().default('20:00'),
          }),
          z.array(z.string()).transform((arr) => ({
            start: arr[0] || '08:00',
            end: arr[1] || '20:00',
          })),
        ])
        .default({ start: '08:00', end: '20:00' }),
    }),
    z.array(z.any()).transform(() => ({
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      hours: { start: '08:00', end: '20:00' },
    })),
  ]),
  preferredCategories: z
    .array(z.enum(['disability', 'elderly', 'womenSafety', 'general']))
    .min(1)
    .default(['general']),
  location: z.object({
    longitude: z.coerce.number().min(-180).max(180),
    latitude: z.coerce.number().min(-90).max(90),
  }),
  address: z.string().optional().or(z.literal('')),
});

// ── Update volunteer profile ────────────────────────────────────────────
export const updateVolunteerSchema = z.object({
  skills: z.array(z.string().min(1)).min(1).optional(),
  availability: z
    .object({
      days: z.array(
        z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
      ).min(1),
      hours: z.object({
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/),
      }),
    })
    .optional(),
  preferredCategories: z
    .array(z.enum(['disability', 'elderly', 'womenSafety', 'general']))
    .optional(),
  location: z
    .object({
      longitude: z.number().min(-180).max(180),
      latitude: z.number().min(-90).max(90),
    })
    .optional(),
  address: z.string().min(5).max(200).optional(),
  activeStatus: z.enum(['online', 'offline', 'busy']).optional(),
});

// ── Nearby query ────────────────────────────────────────────────────────
export const nearbyQuerySchema = z.object({
  longitude: z.coerce.number().min(-180).max(180),
  latitude: z.coerce.number().min(-90).max(90),
  maxDistance: z.coerce.number().min(100).max(500000).optional().default(50000), // meters (default 50km)
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type RegisterVolunteerInput = z.infer<typeof registerVolunteerSchema>;
export type UpdateVolunteerInput = z.infer<typeof updateVolunteerSchema>;
export type NearbyQueryInput = z.infer<typeof nearbyQuerySchema>;
