import { Request, Response } from 'express';
import * as volunteerService from './volunteer.service.js';
import { AppError } from '../../utils/AppError.js';

// ── POST /volunteers/register ───────────────────────────────────────────
export async function register(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const volunteer = await volunteerService.registerVolunteer(
    req.user._id.toString(),
    req.body,
  );

  res.status(201).json({
    success: true,
    data: volunteer,
  });
}

// ── GET /volunteers/nearby ──────────────────────────────────────────────
export async function getNearby(req: Request, res: Response): Promise<void> {
  const { longitude, latitude, maxDistance, page, limit } = req.query as any;

  const result = await volunteerService.findNearbyVolunteers(
    Number(longitude),
    Number(latitude),
    Number(maxDistance) || 5000,
    Number(page) || 1,
    Number(limit) || 20,
  );

  res.status(200).json({
    success: true,
    data: result.volunteers,
    pagination: result.pagination,
  });
}

// ── GET /volunteers/:id ─────────────────────────────────────────────────
export async function getById(req: Request, res: Response): Promise<void> {
  const volunteer = await volunteerService.getVolunteerById(req.params.id as string);

  res.status(200).json({
    success: true,
    data: volunteer,
  });
}

// ── PATCH /volunteers/:id ───────────────────────────────────────────────
export async function update(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const volunteer = await volunteerService.updateVolunteer(
    req.user._id.toString(),
    req.params.id as string,
    req.body,
  );

  res.status(200).json({
    success: true,
    data: volunteer,
  });
}

// ── GET /volunteers ─────────────────────────────────────────────────────
export async function list(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await volunteerService.listVolunteers(page, limit);

  res.status(200).json({
    success: true,
    data: result.volunteers,
    pagination: result.pagination,
  });
}

// ── GET /volunteers/me ──────────────────────────────────────────────────
export async function getMyProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const volunteer = await volunteerService.getVolunteerByUserId(
    req.user._id.toString(),
  );

  res.status(200).json({
    success: true,
    data: volunteer,
  });
}
