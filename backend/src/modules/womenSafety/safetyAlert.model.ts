import mongoose, { Schema, Document, Types } from 'mongoose';

// ── Interfaces ──────────────────────────────────────────────────────────
export interface ISafetyAlert extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  address?: string;
  status: 'active' | 'resolved';
  resolvedAt?: Date;
  respondedVolunteers: Types.ObjectId[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ──────────────────────────────────────────────────────────────
const safetyAlertSchema = new Schema<ISafetyAlert>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
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
    status: {
      type: String,
      enum: ['active', 'resolved'],
      default: 'active',
    },
    resolvedAt: {
      type: Date,
    },
    respondedVolunteers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Volunteer',
      },
    ],
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ─────────────────────────────────────────────────────────────
safetyAlertSchema.index({ location: '2dsphere' });
safetyAlertSchema.index({ userId: 1, createdAt: -1 });
safetyAlertSchema.index({ status: 1 });

const SafetyAlert = mongoose.model<ISafetyAlert>('SafetyAlert', safetyAlertSchema);
export default SafetyAlert;
