import mongoose, { Schema, Document, Types } from 'mongoose';

// ── Interfaces ──────────────────────────────────────────────────────────
export interface IVolunteer extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  skills: string[];
  availability: {
    days: string[];
    hours: {
      start: string; // "09:00"
      end: string;   // "17:00"
    };
  };
  preferredCategories: string[];
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  address?: string;

  // Kindness & performance
  kindnessScore: number;
  totalPointsEarned: number;
  rating: number;
  totalRatings: number;
  completedTasks: number;

  // Status
  activeStatus: 'online' | 'offline' | 'busy';
  isVerified: boolean;

  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ──────────────────────────────────────────────────────────────
const volunteerSchema = new Schema<IVolunteer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    availability: {
      days: {
        type: [String],
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        default: [],
      },
      hours: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '17:00' },
      },
    },
    preferredCategories: {
      type: [String],
      enum: ['disability', 'elderly', 'womenSafety', 'general'],
      default: ['general'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    address: {
      type: String,
      trim: true,
    },

    // Kindness & performance
    kindnessScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Status
    activeStatus: {
      type: String,
      enum: ['online', 'offline', 'busy'],
      default: 'offline',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ─────────────────────────────────────────────────────────────
volunteerSchema.index({ location: '2dsphere' });
volunteerSchema.index({ activeStatus: 1, isDeleted: 1 });
volunteerSchema.index({ kindnessScore: -1 }); // For leaderboard queries
volunteerSchema.index({ skills: 1 });
volunteerSchema.index(
  { skills: 'text', address: 'text' },
  { weights: { skills: 3, address: 1 } },
);

// ── Pre-query filter: exclude soft-deleted ──────────────────────────────
volunteerSchema.pre('find', function () {
  if (!(this as any)._conditions.isDeleted) {
    this.where({ isDeleted: false });
  }
});

volunteerSchema.pre('findOne', function () {
  if (!(this as any)._conditions.isDeleted) {
    this.where({ isDeleted: false });
  }
});

const Volunteer = mongoose.model<IVolunteer>('Volunteer', volunteerSchema);
export default Volunteer;
