import mongoose, { Schema, Document, Types } from 'mongoose';

// ── Interfaces ──────────────────────────────────────────────────────────
export interface IHelpRequest extends Document {
  _id: Types.ObjectId;
  requesterId: Types.ObjectId;
  category: 'disability' | 'elderly' | 'womenSafety' | 'general';
  subCategory?: 'deaf' | 'blind' | 'handicapped' | 'mobility' | 'general';
  serviceType: string;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  address?: string;
  numberOfVolunteersNeeded: number;
  status: 'pending' | 'accepted' | 'inProgress' | 'completed' | 'cancelled';
  assignedVolunteers: Types.ObjectId[];
  completedAt?: Date;
  rating?: number;         // Rating given to volunteer after completion
  ratingComment?: string;

  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ──────────────────────────────────────────────────────────────
const helpRequestSchema = new Schema<IHelpRequest>(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['disability', 'elderly', 'womenSafety', 'general'],
      required: true,
    },
    subCategory: {
      type: String,
      enum: ['deaf', 'blind', 'handicapped', 'mobility', 'general'],
    },
    serviceType: {
      type: String,
      default: 'Community Assistance',
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
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
    numberOfVolunteersNeeded: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      default: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'inProgress', 'completed', 'cancelled'],
      default: 'pending',
    },
    assignedVolunteers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Volunteer',
      },
    ],
    completedAt: {
      type: Date,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    ratingComment: {
      type: String,
      trim: true,
      maxlength: 500,
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
helpRequestSchema.index({ location: '2dsphere' });
helpRequestSchema.index({ requesterId: 1, isDeleted: 1 });
helpRequestSchema.index({ status: 1, category: 1 });
helpRequestSchema.index({ assignedVolunteers: 1 });
helpRequestSchema.index({ createdAt: -1 });
helpRequestSchema.index(
  { description: 'text', serviceType: 'text' },
  { weights: { serviceType: 3, description: 1 } },
);

// ── Pre-query: exclude soft-deleted ─────────────────────────────────────
helpRequestSchema.pre('find', function () {
  if (!(this as any)._conditions.isDeleted) {
    this.where({ isDeleted: false });
  }
});

helpRequestSchema.pre('findOne', function () {
  if (!(this as any)._conditions.isDeleted) {
    this.where({ isDeleted: false });
  }
});

const HelpRequest = mongoose.model<IHelpRequest>('HelpRequest', helpRequestSchema);
export default HelpRequest;
