import { Request, Response } from 'express';
import * as kindnessService from './kindnessPoints.service.js';
import { AppError } from '../../utils/AppError.js';

// ── GET /kindness/my-points ─────────────────────────────────────────────
export async function getMyPoints(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const points = await kindnessService.getMyPoints(req.user._id.toString());

  res.status(200).json({
    success: true,
    data: points,
  });
}

// ── GET /kindness/history ───────────────────────────────────────────────
export async function getHistory(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await kindnessService.getPointsHistory(
    req.user._id.toString(),
    page,
    limit,
  );

  res.status(200).json({
    success: true,
    data: result.transactions,
    pagination: result.pagination,
  });
}

// ── GET /kindness/leaderboard ───────────────────────────────────────────
export async function getLeaderboard(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await kindnessService.getLeaderboard(page, limit);

  res.status(200).json({
    success: true,
    data: result.leaderboard,
    pagination: result.pagination,
  });
}
