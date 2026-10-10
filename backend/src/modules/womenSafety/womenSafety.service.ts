import SafetyAlert from './safetyAlert.model.js';
import Volunteer from '../volunteers/volunteer.model.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../config/logger.js';
import type { InstantHelpInput } from './womenSafety.schema.js';

// ── Trigger instant help ────────────────────────────────────────────────
export async function triggerInstantHelp(userId: string | undefined, input: InstantHelpInput) {
  const alert = await SafetyAlert.create({
    userId: userId || undefined,
    location: {
      type: 'Point',
      coordinates: [input.location.longitude, input.location.latitude],
    },
    address: input.address,
    description: input.description,
    status: 'active',
  });

  logger.info('Women safety alert triggered', {
    alertId: alert._id.toString(),
    userId: userId || 'anonymous',
  });

  return alert;
}

// ── Get active alerts ───────────────────────────────────────────────────
export async function getActiveAlerts(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const filter = { status: 'active' };

  const [alerts, total] = await Promise.all([
    SafetyAlert.find(filter as any)
      .populate('userId', 'fullName mobile city profilePhoto')
      .populate({
        path: 'respondedVolunteers',
        populate: { path: 'userId', select: 'fullName mobile' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SafetyAlert.countDocuments(filter as any),
  ]);

  return {
    alerts,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// ── Volunteer responds to alert ─────────────────────────────────────────
export async function respondToAlert(userId: string, alertId: string) {
  const alert = await SafetyAlert.findById(alertId);
  if (!alert) {
    throw AppError.notFound('Safety alert');
  }

  if (alert.status !== 'active') {
    throw AppError.badRequest('This alert has already been resolved');
  }

  const volunteer = await Volunteer.findOne({ userId });
  if (!volunteer) {
    throw AppError.notFound('Volunteer profile');
  }

  if (alert.respondedVolunteers.some((v) => v.toString() === volunteer._id.toString())) {
    throw AppError.conflict('You have already responded to this alert');
  }

  alert.respondedVolunteers.push(volunteer._id);
  await alert.save();

  return alert;
}

// ── Resolve alert ───────────────────────────────────────────────────────
export async function resolveAlert(userId: string, alertId: string) {
  const alert = await SafetyAlert.findOne({ _id: alertId, userId });
  if (!alert) {
    throw AppError.notFound('Safety alert');
  }

  alert.status = 'resolved';
  alert.resolvedAt = new Date();
  await alert.save();

  return alert;
}

// ── Get user's alert history ────────────────────────────────────────────
export async function getUserAlerts(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const filter = { userId };

  const [alerts, total] = await Promise.all([
    SafetyAlert.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SafetyAlert.countDocuments(filter),
  ]);

  return {
    alerts,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
