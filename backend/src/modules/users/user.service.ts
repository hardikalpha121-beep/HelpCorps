import User from './user.model.js';
import { AppError } from '../../utils/AppError.js';
import type { UpdateUserInput } from './user.schema.js';

// ── Get current user ────────────────────────────────────────────────────
export async function getCurrentUser(userId: string) {
  const user = await User.findById(userId).populate('volunteerProfile');
  if (!user) {
    throw AppError.notFound('User');
  }
  return user;
}

// ── Update profile ──────────────────────────────────────────────────────
export async function updateUser(userId: string, input: UpdateUserInput) {
  const updateData: Record<string, unknown> = { ...input };

  // Convert location input to GeoJSON format
  if (input.location) {
    updateData.location = {
      type: 'Point',
      coordinates: [input.location.longitude, input.location.latitude],
    };
  }

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw AppError.notFound('User');
  }
  return user;
}

// ── Soft delete account ─────────────────────────────────────────────────
export async function deleteAccount(userId: string) {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      isDeleted: true,
      deletedAt: new Date(),
      refreshToken: undefined,
      refreshTokenFamily: undefined,
    },
    { new: true },
  );

  if (!user) {
    throw AppError.notFound('User');
  }
  return { message: 'Account deleted successfully' };
}

// ── GDPR data export ────────────────────────────────────────────────────
export async function exportUserData(userId: string) {
  const user = await User.findById(userId)
    .select('-refreshToken -refreshTokenFamily -password')
    .populate('volunteerProfile')
    .lean();

  if (!user) {
    throw AppError.notFound('User');
  }

  return {
    profile: user,
    exportedAt: new Date().toISOString(),
    format: 'JSON',
  };
}
