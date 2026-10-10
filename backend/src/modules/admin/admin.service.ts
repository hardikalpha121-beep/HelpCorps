import Volunteer from '../volunteers/volunteer.model.js';
import User from '../users/user.model.js';

import HelpRequest from '../helpRequests/helpRequest.model.js';
import { getAdminEarnings } from '../kindnessPoints/kindnessPoints.service.js';

// ── List all volunteers with full details ───────────────────────────────
export async function getAllVolunteers(page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [volunteers, total] = await Promise.all([
    Volunteer.find({ isDeleted: false })
      .populate('userId', 'fullName email profilePhoto mobile city age disabilityType createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Volunteer.countDocuments({ isDeleted: false }),
  ]);

  return {
    volunteers,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// ── Get kindness scores and earnings ────────────────────────────────────
export async function getKindnessOverview() {
  const earnings = await getAdminEarnings();

  // Top 10 volunteers by kindness score
  const topVolunteers = await Volunteer.find({ isDeleted: false })
    .populate('userId', 'fullName email profilePhoto')
    .sort({ kindnessScore: -1 })
    .limit(10)
    .select('kindnessScore totalPointsEarned completedTasks rating userId');

  return {
    earnings,
    topVolunteers,
  };
}

// ── Dashboard statistics ────────────────────────────────────────────────
export async function getDashboardStats() {
  const [
    totalUsers,
    totalVolunteers,
    totalRequests,
    pendingRequests,
    completedRequests,
    activeVolunteers,
    earnings,
  ] = await Promise.all([
    User.countDocuments({ isDeleted: false }),
    Volunteer.countDocuments({ isDeleted: false }),
    HelpRequest.countDocuments({ isDeleted: false }),
    HelpRequest.countDocuments({ status: 'pending', isDeleted: false }),
    HelpRequest.countDocuments({ status: 'completed', isDeleted: false }),
    Volunteer.countDocuments({ activeStatus: 'online', isDeleted: false }),
    getAdminEarnings(),
  ]);

  // Requests by category
  const requestsByCategory = await HelpRequest.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  // Recent requests
  const recentRequests = await HelpRequest.find({ isDeleted: false })
    .populate('requesterId', 'fullName city')
    .sort({ createdAt: -1 })
    .limit(10);

  return {
    totalUsers,
    totalVolunteers,
    totalRequests,
    pendingRequests,
    completedRequests,
    activeVolunteers,
    earnings,
    requestsByCategory,
    recentRequests,
  };
}

// ── Update volunteer status (verify/unverify) ───────────────────────────
export async function updateVolunteerStatus(
  volunteerId: string,
  update: { isVerified?: boolean; activeStatus?: string },
) {
  const volunteer = await Volunteer.findByIdAndUpdate(volunteerId, update, {
    new: true,
    runValidators: true,
  }).populate('userId', 'fullName email profilePhoto mobile city');

  return volunteer;
}
