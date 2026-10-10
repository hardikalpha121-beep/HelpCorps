import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Types } from 'mongoose';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'volunteer' | 'admin';
}

export interface RefreshTokenPayload {
  userId: string;
  family: string; // Token family for breach detection
}

/**
 * Sign a short-lived access token (15 min default).
 */
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    subject: payload.userId,
  });
}

/**
 * Sign a long-lived refresh token (7 days default).
 * Includes a "family" ID for rotation and breach detection.
 */
export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    subject: payload.userId,
  });
}

/**
 * Verify and decode an access token.
 * Throws on expiry or invalid signature.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

/**
 * Verify and decode a refresh token.
 * Throws on expiry or invalid signature.
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

/**
 * Generate a random token family ID for refresh token rotation.
 */
export function generateTokenFamily(): string {
  return new Types.ObjectId().toHexString();
}
