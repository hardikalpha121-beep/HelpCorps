import { Request, Response } from 'express';
import * as womenSafetyService from './womenSafety.service.js';
import { AppError } from '../../utils/AppError.js';

// ── POST /women-safety/instant-help ─────────────────────────────────────
export async function instantHelp(req: Request, res: Response): Promise<void> {
  const userId = req.user?._id ? req.user._id.toString() : undefined;
  const alert = await womenSafetyService.triggerInstantHelp(
    userId,
    req.body,
  );

  // Socket.io broadcast will be handled separately via the io instance
  // The controller returns the alert; the route emits the socket event
  res.status(201).json({
    success: true,
    data: alert,
  });
}

// ── GET /women-safety/active-alerts ─────────────────────────────────────
export async function activeAlerts(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await womenSafetyService.getActiveAlerts(page, limit);

  res.status(200).json({
    success: true,
    data: result.alerts,
    pagination: result.pagination,
  });
}

// ── PATCH /women-safety/:id/respond ─────────────────────────────────────
export async function respond(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const alert = await womenSafetyService.respondToAlert(
    req.user._id.toString(),
    req.params.id as string,
  );

  res.status(200).json({
    success: true,
    data: alert,
  });
}

// ── PATCH /women-safety/:id/resolve ─────────────────────────────────────
export async function resolve(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const alert = await womenSafetyService.resolveAlert(
    req.user._id.toString(),
    req.params.id as string,
  );

  res.status(200).json({
    success: true,
    data: alert,
  });
}

// ── GET /women-safety/my-alerts ─────────────────────────────────────────
export async function myAlerts(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await womenSafetyService.getUserAlerts(
    req.user._id.toString(),
    page,
    limit,
  );

  res.status(200).json({
    success: true,
    data: result.alerts,
    pagination: result.pagination,
  });
}
