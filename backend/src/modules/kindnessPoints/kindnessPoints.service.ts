import KindnessTransaction from './kindnessTransaction.model.js';
import Volunteer from '../volunteers/volunteer.model.js';
import { AppError } from '../../utils/AppError.js';

// ── Get volunteer's points ──────────────────────────────────────────────
export async function getMyPoints(userId: string) {
  const volunteer = await Volunteer.findOne({ userId });
  if (!volunteer) {
    throw AppError.notFound('Volunteer profile');
  }

  return {
    kindnessScore: volunteer.kindnessScore,
    totalPointsEarned: volunteer.totalPointsEarned,
    completedTasks: volunteer.completedTasks,
  };
}

// ── Get transaction history ─────────────────────────────────────────────
export async function getPointsHistory(userId: string, page: number, limit: number) {
  const volunteer = await Volunteer.findOne({ userId });
  if (!volunteer) {
    throw AppError.notFound('Volunteer profile');
  }

  const skip = (page - 1) * limit;
  const filter = { volunteerId: volunteer._id };

  const [transactions, total] = await Promise.all([
    KindnessTransaction.find(filter)
      .populate({
        path: 'helpRequestId',
        select: 'serviceType category subCategory status completedAt',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    KindnessTransaction.countDocuments(filter),
  ]);

  return {
    transactions,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// ── Leaderboard ─────────────────────────────────────────────────────────
export async function getLeaderboard(page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [volunteers, total] = await Promise.all([
    Volunteer.find({ isDeleted: false })
      .populate('userId', 'fullName profilePhoto city')
      .sort({ kindnessScore: -1 })
      .skip(skip)
      .limit(limit)
      .select('kindnessScore totalPointsEarned completedTasks rating userId skills'),
    Volunteer.countDocuments({ isDeleted: false }),
  ]);

  // Add rank to each entry
  const leaderboard = volunteers.map((vol, index) => ({
    rank: skip + index + 1,
    volunteer: vol,
  }));

  return {
    leaderboard,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// ── Admin: total kindness earnings ──────────────────────────────────────
export async function getAdminEarnings() {
  const result = await KindnessTransaction.aggregate([
    {
      $group: {
        _id: null,
        totalPoints: { $sum: '$totalPoints' },
        totalAdminShare: { $sum: '$adminShare' },
        totalVolunteerShare: { $sum: '$volunteerShare' },
        transactionCount: { $sum: 1 },
      },
    },
  ]);

  return result[0] || {
    totalPoints: 0,
    totalAdminShare: 0,
    totalVolunteerShare: 0,
    transactionCount: 0,
  };
}
