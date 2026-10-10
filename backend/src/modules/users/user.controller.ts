import { Request, Response } from 'express';
import * as userService from './user.service.js';
import { AppError } from '../../utils/AppError.js';

// ── GET /users/me ───────────────────────────────────────────────────────
export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const user = await userService.getCurrentUser(req.user._id.toString());

  res.status(200).json({
    success: true,
    data: user,
  });
}

// ── PATCH /users/me ─────────────────────────────────────────────────────
export async function updateMe(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const user = await userService.updateUser(req.user._id.toString(), req.body);

  res.status(200).json({
    success: true,
    data: user,
  });
}

// ── DELETE /users/me ────────────────────────────────────────────────────
export async function deleteMe(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const result = await userService.deleteAccount(req.user._id.toString());

  res.status(200).json({
    success: true,
    data: result,
  });
}

// ── GET /users/me/export ────────────────────────────────────────────────
export async function exportData(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const data = await userService.exportUserData(req.user._id.toString());

  res.status(200).json({
    success: true,
    data,
  });
}
