import bcrypt from 'bcryptjs';

import User, { IUser } from '../users/user.model.js';
import { AppError } from '../../utils/AppError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateTokenFamily,
} from '../../utils/jwt.js';
import { logger } from '../../config/logger.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';

const BCRYPT_COST = 10;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// ── Register ────────────────────────────────────────────────────────────
export async function registerUser(input: RegisterInput) {
  // Check if email already exists
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(input.password, BCRYPT_COST);

  // Build location if provided
  const location = input.location
    ? {
        type: 'Point' as const,
        coordinates: [input.location.longitude, input.location.latitude] as [number, number],
      }
    : undefined;

  const user = await User.create({
    fullName: input.fullName,
    email: input.email.toLowerCase(),
    password: hashedPassword,
    mobile: input.mobile,
    city: input.city,
    age: input.age,
    disabilityType: input.disabilityType || 'none',
    location,
  });

  // Generate tokens
  const { accessToken, refreshToken } = await generateAndStoreTokens(user);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

// ── Login ───────────────────────────────────────────────────────────────
export async function loginUser(input: LoginInput) {
  // Fetch user with password field
  const user = await User.findOne({ email: input.email.toLowerCase() }).select(
    '+password +refreshToken +refreshTokenFamily +loginAttempts +lockUntil',
  );

  if (!user) {
    // Generic message — don't confirm whether email exists
    throw AppError.unauthorized('Invalid email or password');
  }

  // Check account lockout
  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingMs = user.lockUntil.getTime() - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);
    throw AppError.forbidden(
      `Account locked due to too many failed attempts. Try again in ${remainingMin} minutes.`,
    );
  }

  // Verify password
  if (!user.password) {
    throw AppError.unauthorized(
      'This account uses Google login. Please sign in with Google.',
    );
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);
  if (!isPasswordValid) {
    // Increment login attempts
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.loginAttempts = 0;
      logger.warn('Account locked due to failed login attempts', {
        userId: user._id.toString(),
      });
    }
    await user.save();
    throw AppError.unauthorized('Invalid email or password');
  }

  // Reset login attempts on successful login
  user.loginAttempts = 0;
  user.lockUntil = undefined;

  // Generate tokens
  const { accessToken, refreshToken } = await generateAndStoreTokens(user);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

// ── Refresh Token ───────────────────────────────────────────────────────
export async function refreshAccessToken(currentRefreshToken: string) {
  // Verify the refresh token JWT
  let payload;
  try {
    payload = verifyRefreshToken(currentRefreshToken);
  } catch {
    throw AppError.refreshTokenInvalid();
  }

  const user = await User.findById(payload.userId).select(
    '+refreshToken +refreshTokenFamily',
  );

  if (!user || user.isDeleted) {
    throw AppError.refreshTokenInvalid();
  }

  // Verify the stored hashed refresh token
  if (!user.refreshToken) {
    throw AppError.refreshTokenInvalid();
  }

  const isValid = await bcrypt.compare(currentRefreshToken, user.refreshToken);
  if (!isValid) {
    // Possible token reuse attack! Revoke all tokens for this user
    user.refreshToken = undefined;
    user.refreshTokenFamily = undefined;
    await user.save();
    logger.warn('Refresh token reuse detected — revoking all sessions', {
      userId: user._id.toString(),
    });
    throw AppError.refreshTokenInvalid();
  }

  // Check token family matches — breach detection
  if (user.refreshTokenFamily !== payload.family) {
    user.refreshToken = undefined;
    user.refreshTokenFamily = undefined;
    await user.save();
    logger.warn('Refresh token family mismatch — revoking all sessions', {
      userId: user._id.toString(),
    });
    throw AppError.refreshTokenInvalid();
  }

  // Rotate: issue new tokens
  const { accessToken, refreshToken } = await generateAndStoreTokens(user);

  return { accessToken, refreshToken };
}

// ── Logout ──────────────────────────────────────────────────────────────
export async function logoutUser(userId: string) {
  await User.findByIdAndUpdate(userId, {
    $unset: { refreshToken: 1, refreshTokenFamily: 1 },
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────
async function generateAndStoreTokens(user: IUser) {
  const family = generateTokenFamily();

  const accessToken = signAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  const refreshToken = signRefreshToken({
    userId: user._id.toString(),
    family,
  });

  // Hash refresh token before storing (bcrypt)
  const hashedRefreshToken = await bcrypt.hash(refreshToken, BCRYPT_COST);
  user.refreshToken = hashedRefreshToken;
  user.refreshTokenFamily = family;
  await user.save();

  return { accessToken, refreshToken };
}

function sanitizeUser(user: IUser) {
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    mobile: user.mobile,
    profilePhoto: user.profilePhoto,
    city: user.city,
    age: user.age,
    disabilityType: user.disabilityType,
    isVolunteer: user.isVolunteer,
    createdAt: user.createdAt,
  };
}
