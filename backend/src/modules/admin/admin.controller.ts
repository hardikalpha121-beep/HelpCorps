import { Request, Response } from 'express';
import * as adminService from './admin.service.js';

// ── GET /admin/volunteers ───────────────────────────────────────────────
export async function getVolunteers(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await adminService.getAllVolunteers(page, limit);

  res.status(200).json({
    success: true,
    data: result.volunteers,
    pagination: result.pagination,
  });
}

// ── GET /admin/kindness-scores ──────────────────────────────────────────
export async function getKindnessScores(_req: Request, res: Response): Promise<void> {
  const result = await adminService.getKindnessOverview();

  res.status(200).json({
    success: true,
    data: result,
  });
}

// ── GET /admin/dashboard-stats ──────────────────────────────────────────
export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  const stats = await adminService.getDashboardStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
}

// ── PATCH /admin/volunteers/:id ─────────────────────────────────────────
export async function updateVolunteer(req: Request, res: Response): Promise<void> {
  const volunteer = await adminService.updateVolunteerStatus(
    req.params.id as string,
    req.body,
  );

  res.status(200).json({
    success: true,
    data: volunteer,
  });
}
