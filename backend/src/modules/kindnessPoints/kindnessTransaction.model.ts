import mongoose, { Schema, Document, Types } from 'mongoose';

// ── Interfaces ──────────────────────────────────────────────────────────
export interface IKindnessTransaction extends Document {
  _id: Types.ObjectId;
  helpRequestId: Types.ObjectId;
  volunteerId: Types.ObjectId;
  totalPoints: number;
  volunteerShare: number;   // 70% of totalPoints
  adminShare: number;       // 30% of totalPoints
  description: string;
  createdAt: Date;
}

// ── Schema ──────────────────────────────────────────────────────────────
const kindnessTransactionSchema = new Schema<IKindnessTransaction>(
  {
    helpRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'HelpRequest',
      required: true,
    },
    volunteerId: {
      type: Schema.Types.ObjectId,
      ref: 'Volunteer',
      required: true,
    },
    totalPoints: {
      type: Number,
      required: true,
      min: 0,
    },
    volunteerShare: {
      type: Number,
      required: true,
      min: 0,
    },
    adminShare: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ─────────────────────────────────────────────────────────────
kindnessTransactionSchema.index({ volunteerId: 1, createdAt: -1 });
kindnessTransactionSchema.index({ helpRequestId: 1 });
kindnessTransactionSchema.index({ createdAt: -1 });

const KindnessTransaction = mongoose.model<IKindnessTransaction>(
  'KindnessTransaction',
  kindnessTransactionSchema,
);
export default KindnessTransaction;
