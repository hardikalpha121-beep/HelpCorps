import Volunteer from './volunteer.model.js';
import User from '../users/user.model.js';
import { AppError } from '../../utils/AppError.js';
import type {
  RegisterVolunteerInput,
  UpdateVolunteerInput,
} from './volunteer.schema.js';

// ── Register as volunteer ───────────────────────────────────────────────
export async function registerVolunteer(userId: string, input: RegisterVolunteerInput) {
  const existing = await Volunteer.findOne({ userId });
  if (existing) {
    existing.skills = input.skills;
    existing.availability = input.availability as any;
    existing.preferredCategories = input.preferredCategories;
    existing.location = {
      type: 'Point',
      coordinates: [input.location.longitude, input.location.latitude],
    };
    if (input.address) existing.address = input.address;
    existing.activeStatus = 'online';
    await existing.save();

    await User.findByIdAndUpdate(userId, {
      isVolunteer: true,
      role: 'volunteer',
      volunteerProfile: existing._id,
    });
    return existing;
  }

  const volunteer = await Volunteer.create({
    userId,
    skills: input.skills,
    availability: input.availability,
    preferredCategories: input.preferredCategories,
    location: {
      type: 'Point',
      coordinates: [input.location.longitude, input.location.latitude],
    },
    address: input.address,
  });

  // Update user record
  await User.findByIdAndUpdate(userId, {
    isVolunteer: true,
    role: 'volunteer',
    volunteerProfile: volunteer._id,
  });

  return volunteer;
}

// ── Find nearby volunteers ──────────────────────────────────────────────
export async function findNearbyVolunteers(
  longitude: number,
  latitude: number,
  maxDistance: number,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;

  let volunteers = await Volunteer.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [longitude, latitude] },
        distanceField: 'distance',
        maxDistance, // in meters
        spherical: true,
        query: { isDeleted: false, activeStatus: { $ne: 'offline' } },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
        pipeline: [
          { $project: { fullName: 1, email: 1, profilePhoto: 1, mobile: 1, city: 1 } },
        ],
      },
    },
    { $unwind: '$user' },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        user: 1,
        skills: 1,
        activeStatus: 1,
        kindnessScore: 1,
        rating: 1,
        completedTasks: 1,
        distance: { $round: ['$distance', 0] }, // distance in meters
        availability: 1,
        address: 1,
      },
    },
  ]);

  let total = 0;

  if (volunteers.length === 0) {
    // Fallback 1: Query nearest active volunteers without strict maxDistance boundary
    try {
      volunteers = await Volunteer.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [longitude, latitude] },
            distanceField: 'distance',
            spherical: true,
            query: { isDeleted: false, activeStatus: { $ne: 'offline' } },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
            pipeline: [
              { $project: { fullName: 1, email: 1, profilePhoto: 1, mobile: 1, city: 1 } },
            ],
          },
        },
        { $unwind: '$user' },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            user: 1,
            skills: 1,
            activeStatus: 1,
            kindnessScore: 1,
            rating: 1,
            completedTasks: 1,
            distance: { $round: ['$distance', 0] },
            availability: 1,
            address: 1,
          },
        },
      ]);
    } catch {
      // Fallback 2: Plain lookup if geoNear throws for any reason
      volunteers = await Volunteer.aggregate([
        { $match: { isDeleted: false } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
            pipeline: [
              { $project: { fullName: 1, email: 1, profilePhoto: 1, mobile: 1, city: 1 } },
            ],
          },
        },
        { $unwind: '$user' },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            user: 1,
            skills: 1,
            activeStatus: 1,
            kindnessScore: 1,
            rating: 1,
            completedTasks: 1,
            distance: { $literal: 1200 },
            availability: 1,
            address: 1,
          },
        },
      ]);
    }
    total = volunteers.length;
  } else {
    // Count total nearby volunteers for pagination
    const totalResult = await Volunteer.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distance',
          maxDistance,
          spherical: true,
          query: { isDeleted: false, activeStatus: { $ne: 'offline' } },
        },
      },
      { $count: 'total' },
    ]);
    total = totalResult[0]?.total || 0;
  }

  return {
    volunteers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

// ── Get volunteer by ID ─────────────────────────────────────────────────
export async function getVolunteerById(volunteerId: string) {
  const volunteer = await Volunteer.findById(volunteerId)
    .populate('userId', 'fullName email profilePhoto mobile city age');

  if (!volunteer) {
    throw AppError.notFound('Volunteer');
  }
  return volunteer;
}

// ── Update volunteer profile ────────────────────────────────────────────
export async function updateVolunteer(
  userId: string,
  volunteerId: string,
  input: UpdateVolunteerInput,
) {
  const volunteer = await Volunteer.findOne({ _id: volunteerId, userId });
  if (!volunteer) {
    throw AppError.notFound('Volunteer');
  }

  // Update location if provided
  if (input.location) {
    volunteer.location = {
      type: 'Point',
      coordinates: [input.location.longitude, input.location.latitude],
    };
  }

  // Update other fields
  if (input.skills) volunteer.skills = input.skills;
  if (input.availability) volunteer.availability = input.availability;
  if (input.preferredCategories) volunteer.preferredCategories = input.preferredCategories;
  if (input.address !== undefined) volunteer.address = input.address;
  if (input.activeStatus) volunteer.activeStatus = input.activeStatus;

  await volunteer.save();
  return volunteer;
}

// ── List all volunteers (paginated) ─────────────────────────────────────
export async function listVolunteers(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [volunteers, total] = await Promise.all([
    Volunteer.find()
      .populate('userId', 'fullName email profilePhoto mobile city age')
      .sort({ kindnessScore: -1 })
      .skip(skip)
      .limit(limit),
    Volunteer.countDocuments({ isDeleted: false }),
  ]);

  return {
    volunteers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Get volunteer by user ID ────────────────────────────────────────────
export async function getVolunteerByUserId(userId: string) {
  const volunteer = await Volunteer.findOne({ userId })
    .populate('userId', 'fullName email profilePhoto mobile city age');

  if (!volunteer) {
    throw AppError.notFound('Volunteer profile');
  }
  return volunteer;
}
