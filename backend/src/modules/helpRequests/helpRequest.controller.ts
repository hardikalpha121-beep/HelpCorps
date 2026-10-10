import { Request, Response } from 'express';
import * as helpRequestService from './helpRequest.service.js';
import { AppError } from '../../utils/AppError.js';

// ── POST /help-requests ─────────────────────────────────────────────────
export async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const helpRequest = await helpRequestService.createHelpRequest(
    req.user._id.toString(),
    req.body,
  );

  res.status(201).json({
    success: true,
    data: helpRequest,
  });
}

// ── GET /help-requests ──────────────────────────────────────────────────
export async function list(req: Request, res: Response): Promise<void> {
  const result = await helpRequestService.listHelpRequests(req.query as any);

  res.status(200).json({
    success: true,
    data: result.requests,
    pagination: result.pagination,
  });
}

// ── GET /help-requests/my ───────────────────────────────────────────────
export async function myRequests(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await helpRequestService.getUserHelpRequests(
    req.user._id.toString(),
    page,
    limit,
  );

  res.status(200).json({
    success: true,
    data: result.requests,
    pagination: result.pagination,
  });
}

// ── GET /help-requests/assigned ─────────────────────────────────────────
export async function assignedToMe(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const result = await helpRequestService.getVolunteerAssignedRequests(
    req.user._id.toString(),
  );

  res.status(200).json({
    success: true,
    data: result.requests,
  });
}

// ── GET /help-requests/:id ──────────────────────────────────────────────
export async function getById(req: Request, res: Response): Promise<void> {
  const helpRequest = await helpRequestService.getHelpRequestById(req.params.id as string);

  res.status(200).json({
    success: true,
    data: helpRequest,
  });
}

// ── PATCH /help-requests/:id/accept ─────────────────────────────────────
export async function accept(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const helpRequest = await helpRequestService.acceptHelpRequest(
    req.user._id.toString(),
    req.params.id as string,
  );

  res.status(200).json({
    success: true,
    data: helpRequest,
  });
}

// ── PATCH /help-requests/:id/complete ───────────────────────────────────
export async function complete(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const helpRequest = await helpRequestService.completeHelpRequest(
    req.user._id.toString(),
    req.params.id as string,
  );

  res.status(200).json({
    success: true,
    data: helpRequest,
  });
}

// ── PATCH /help-requests/:id/cancel ─────────────────────────────────────
export async function cancel(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const helpRequest = await helpRequestService.cancelHelpRequest(
    req.user._id.toString(),
    req.params.id as string,
  );

  res.status(200).json({
    success: true,
    data: helpRequest,
  });
}

// ── PATCH /help-requests/:id/rate ───────────────────────────────────────
export async function rate(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const helpRequest = await helpRequestService.rateHelpRequest(
    req.user._id.toString(),
    req.params.id as string,
    req.body,
  );

  res.status(200).json({
    success: true,
    data: helpRequest,
  });
}
