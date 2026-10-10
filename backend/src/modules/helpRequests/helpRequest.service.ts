import HelpRequest from './helpRequest.model.js';
import Volunteer from '../volunteers/volunteer.model.js';
import KindnessTransaction from '../kindnessPoints/kindnessTransaction.model.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../config/logger.js';
import type {
  CreateHelpRequestInput,
  ListHelpRequestsInput,
  RateHelpRequestInput,
} from './helpRequest.schema.js';

// Points awarded per completed task
const POINTS_PER_TASK = 100;
const VOLUNTEER_SHARE_PERCENT = 0.7;
const ADMIN_SHARE_PERCENT = 0.3;

// ── Create help request ─────────────────────────────────────────────────
export async function createHelpRequest(
  requesterId: string,
  input: CreateHelpRequestInput,
) {
  let category: 'disability' | 'elderly' | 'womenSafety' | 'general' = 'general';
  let subCategory = input.subCategory as any;

  const rawCat = (input.category || '').toLowerCase();
  if (
    rawCat.includes('disability') ||
    rawCat.includes('deaf') ||
    rawCat.includes('blind') ||
    rawCat.includes('handicapped') ||
    rawCat.includes('mobility')
  ) {
    category = 'disability';
    if (!subCategory) {
      if (rawCat.includes('deaf')) subCategory = 'deaf';
      else if (rawCat.includes('blind')) subCategory = 'blind';
      else if (rawCat.includes('handicapped') || rawCat.includes('mobility')) subCategory = 'handicapped';
      else subCategory = 'general';
    }
  } else if (rawCat.includes('elderly')) {
    category = 'elderly';
  } else if (rawCat.includes('women') || rawCat.includes('sos')) {
    category = 'womenSafety';
  } else {
    category = 'general';
  }

  // Coordinates with fallback if GPS is not yet acquired
  const lon = typeof input.location?.longitude === 'number' ? input.location.longitude : 76.5266;
  const lat = typeof input.location?.latitude === 'number' ? input.location.latitude : 31.7061;

  const helpRequest = await HelpRequest.create({
    requesterId,
    category,
    subCategory,
    serviceType: input.serviceType || `${category} support`,
    description: input.description,
    location: {
      type: 'Point',
      coordinates: [lon, lat],
    },
    address: input.address || '',
    numberOfVolunteersNeeded: input.numberOfVolunteersNeeded || 1,
  });

  return helpRequest;
}

// ── List help requests ──────────────────────────────────────────────────
export async function listHelpRequests(query: ListHelpRequestsInput) {
  const filter: Record<string, unknown> = { isDeleted: false };
  if (query.category) filter.category = query.category;
  if (query.subCategory) filter.subCategory = query.subCategory;
  if (query.status) filter.status = query.status;

  const skip = (query.page - 1) * query.limit;

  const [requests, total] = await Promise.all([
    HelpRequest.find(filter)
      .populate('requesterId', 'fullName email profilePhoto city disabilityType')
      .populate('assignedVolunteers', 'userId skills kindnessScore rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit),
    HelpRequest.countDocuments(filter),
  ]);

  return {
    requests,
    pagination: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

// ── Get help request by ID ──────────────────────────────────────────────
export async function getHelpRequestById(requestId: string) {
  const request = await HelpRequest.findById(requestId)
    .populate('requesterId', 'fullName email profilePhoto city disabilityType mobile')
    .populate({
      path: 'assignedVolunteers',
      populate: { path: 'userId', select: 'fullName email profilePhoto mobile' },
    });

  if (!request) {
    throw AppError.notFound('Help request');
  }
  return request;
}

// ── Volunteer accepts help request ──────────────────────────────────────
export async function acceptHelpRequest(volunteerId: string, requestId: string) {
  const helpRequest = await HelpRequest.findById(requestId);
  if (!helpRequest) {
    throw AppError.notFound('Help request');
  }

  if (helpRequest.status !== 'pending' && helpRequest.status !== 'accepted') {
    throw AppError.badRequest(`Cannot accept a request with status: ${helpRequest.status}`);
  }

  // Check if volunteer is already assigned
  const volunteer = await Volunteer.findOne({ userId: volunteerId });
  if (!volunteer) {
    throw AppError.notFound('Volunteer profile');
  }

  if (helpRequest.assignedVolunteers.some((v) => v.toString() === volunteer._id.toString())) {
    throw AppError.conflict('You are already assigned to this request');
  }

  // Check if max volunteers reached
  if (helpRequest.assignedVolunteers.length >= helpRequest.numberOfVolunteersNeeded) {
    throw AppError.badRequest('Maximum number of volunteers already assigned');
  }

  helpRequest.assignedVolunteers.push(volunteer._id);
  helpRequest.status = 'accepted';

  // If all needed volunteers are assigned, move to inProgress
  if (helpRequest.assignedVolunteers.length >= helpRequest.numberOfVolunteersNeeded) {
    helpRequest.status = 'inProgress';
  }

  await helpRequest.save();

  // Update volunteer status
  volunteer.activeStatus = 'busy';
  await volunteer.save();

  return helpRequest;
}

// ── Complete help request ───────────────────────────────────────────────
export async function completeHelpRequest(userId: string, requestId: string) {
  const helpRequest = await HelpRequest.findById(requestId);
  if (!helpRequest) {
    throw AppError.notFound('Help request');
  }

  // Only the requester or an assigned volunteer can complete
  const isRequester = helpRequest.requesterId.toString() === userId;
  const volunteer = await Volunteer.findOne({ userId });
  const isAssignedVolunteer = volunteer
    ? helpRequest.assignedVolunteers.some((v) => v.toString() === volunteer._id.toString())
    : false;

  if (!isRequester && !isAssignedVolunteer) {
    throw AppError.forbidden('Only the requester or an assigned volunteer can complete this request');
  }

  if (helpRequest.status !== 'accepted' && helpRequest.status !== 'inProgress') {
    throw AppError.badRequest(`Cannot complete a request with status: ${helpRequest.status}`);
  }

  helpRequest.status = 'completed';
  helpRequest.completedAt = new Date();
  await helpRequest.save();

  // Award kindness points to all assigned volunteers
  for (const volId of helpRequest.assignedVolunteers) {
    const volunteerShare = Math.round(POINTS_PER_TASK * VOLUNTEER_SHARE_PERCENT);
    const adminShare = Math.round(POINTS_PER_TASK * ADMIN_SHARE_PERCENT);

    await KindnessTransaction.create({
      helpRequestId: helpRequest._id,
      volunteerId: volId,
      totalPoints: POINTS_PER_TASK,
      volunteerShare,
      adminShare,
      description: `Points for completing: ${helpRequest.serviceType}`,
    });

    // Update volunteer stats
    await Volunteer.findByIdAndUpdate(volId, {
      $inc: {
        kindnessScore: volunteerShare,
        totalPointsEarned: volunteerShare,
        completedTasks: 1,
      },
      activeStatus: 'online',
    });
  }

  logger.info('Help request completed — kindness points awarded', {
    requestId: helpRequest._id.toString(),
    volunteersCount: helpRequest.assignedVolunteers.length,
  });

  return helpRequest;
}

// ── Cancel help request ─────────────────────────────────────────────────
export async function cancelHelpRequest(userId: string, requestId: string) {
  const helpRequest = await HelpRequest.findOne({
    _id: requestId,
    requesterId: userId,
  });

  if (!helpRequest) {
    throw AppError.notFound('Help request');
  }

  if (helpRequest.status === 'completed' || helpRequest.status === 'cancelled') {
    throw AppError.badRequest(`Cannot cancel a request with status: ${helpRequest.status}`);
  }

  helpRequest.status = 'cancelled';
  await helpRequest.save();

  // Release volunteers
  for (const volId of helpRequest.assignedVolunteers) {
    await Volunteer.findByIdAndUpdate(volId, { activeStatus: 'online' });
  }

  return helpRequest;
}

// ── Rate a completed help request ───────────────────────────────────────
export async function rateHelpRequest(
  userId: string,
  requestId: string,
  input: RateHelpRequestInput,
) {
  const helpRequest = await HelpRequest.findOne({
    _id: requestId,
    requesterId: userId,
    status: 'completed',
  });

  if (!helpRequest) {
    throw AppError.notFound('Completed help request');
  }

  if (helpRequest.rating) {
    throw AppError.conflict('This request has already been rated');
  }

  helpRequest.rating = input.rating;
  helpRequest.ratingComment = input.ratingComment;
  await helpRequest.save();

  // Update volunteer ratings
  for (const volId of helpRequest.assignedVolunteers) {
    const vol = await Volunteer.findById(volId);
    if (vol) {
      const newTotalRatings = vol.totalRatings + 1;
      const newRating =
        (vol.rating * vol.totalRatings + input.rating) / newTotalRatings;
      vol.rating = Math.round(newRating * 10) / 10; // Round to 1 decimal
      vol.totalRatings = newTotalRatings;
      await vol.save();
    }
  }

  return helpRequest;
}

// ── Get user's help requests ────────────────────────────────────────────
export async function getUserHelpRequests(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const filter = { requesterId: userId, isDeleted: false };

  const [requests, total] = await Promise.all([
    HelpRequest.find(filter)
      .populate('assignedVolunteers', 'userId skills kindnessScore rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    HelpRequest.countDocuments(filter),
  ]);

  return {
    requests,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// ── Get volunteer's assigned active tasks ────────────────────────────────
export async function getVolunteerAssignedRequests(userId: string) {
  const volunteer = await Volunteer.findOne({ userId });
  if (!volunteer) {
    return { requests: [] };
  }

  const requests = await HelpRequest.find({
    assignedVolunteers: volunteer._id,
    isDeleted: false,
    status: { $in: ['accepted', 'inProgress'] },
  })
    .populate('requesterId', 'fullName email mobile city disabilityType')
    .sort({ updatedAt: -1 });

  return { requests };
}
