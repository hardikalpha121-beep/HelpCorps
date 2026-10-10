import { Request, Response } from 'express';
import * as authService from './auth.service.js';
import { env } from '../../config/env.js';

// Cookie options for refresh token
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ── POST /auth/register ─────────────────────────────────────────────────
export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.registerUser(req.body);

  // Set refresh token in HttpOnly cookie
  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  res.status(201).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
}

// ── POST /auth/login ────────────────────────────────────────────────────
export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.loginUser(req.body);

  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
}

// ── POST /auth/refresh ──────────────────────────────────────────────────
export async function refresh(req: Request, res: Response): Promise<void> {
  const currentRefreshToken = req.cookies?.refreshToken;
  if (!currentRefreshToken) {
    res.status(401).json({
      success: false,
      error: { code: 'REFRESH_TOKEN_INVALID', message: 'No refresh token provided' },
    });
    return;
  }

  const result = await authService.refreshAccessToken(currentRefreshToken);

  // Set new rotated refresh token
  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  res.status(200).json({
    success: true,
    data: { accessToken: result.accessToken },
  });
}

// ── POST /auth/logout ───────────────────────────────────────────────────
export async function logout(req: Request, res: Response): Promise<void> {
  if (req.user) {
    await authService.logoutUser(req.user._id.toString());
  }

  // Clear the refresh cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
  });

  res.status(200).json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
}
