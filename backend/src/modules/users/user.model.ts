import mongoose, { Schema, Document, Types } from 'mongoose';

// ── Interfaces ──────────────────────────────────────────────────────────
export interface IUser extends Document {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  password?: string;
  mobile?: string;
  role: 'user' | 'volunteer' | 'admin';
  profilePhoto?: string;
  city?: string;
  age?: number;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  disabilityType: 'deaf' | 'blind' | 'handicapped' | 'elderly' | 'none';
  isVolunteer: boolean;
  volunteerProfile?: Types.ObjectId;
  googleId?: string;

  // Auth / security fields
  refreshToken?: string;           // bcrypt-hashed refresh token
  refreshTokenFamily?: string;     // For rotation breach detection
  loginAttempts: number;
  lockUntil?: Date;

  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ──────────────────────────────────────────────────────────────
const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false, // Never returned in queries by default
    },
    mobile: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'volunteer', 'admin'],
      default: 'user',
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      min: 1,
      max: 150,
    },
    location: {
      type: new Schema(
        {
          type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
          },
          coordinates: {
            type: [Number],
            required: true,
          },
        },
        { _id: false },
      ),
      default: undefined,
      required: false,
    },
    disabilityType: {
      type: String,
      enum: ['deaf', 'blind', 'handicapped', 'elderly', 'none'],
      default: 'none',
    },
    isVolunteer: {
      type: Boolean,
      default: false,
    },
    volunteerProfile: {
      type: Schema.Types.ObjectId,
      ref: 'Volunteer',
    },
    googleId: {
      type: String,
      sparse: true,
    },

    // Auth / security
    refreshToken: {
      type: String,
      select: false,
    },
    refreshTokenFamily: {
      type: String,
      select: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
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
userSchema.index({ location: '2dsphere' }, { sparse: true });
userSchema.index({ role: 1, isDeleted: 1 });

// TTL index for locked accounts — auto-unlock after 15 min
userSchema.index({ lockUntil: 1 }, { expireAfterSeconds: 0 });

// ── Pre-query filter: exclude soft-deleted by default ───────────────────
userSchema.pre('find', function () {
  if (!(this as any)._conditions.isDeleted) {
    this.where({ isDeleted: false });
  }
});

userSchema.pre('findOne', function () {
  if (!(this as any)._conditions.isDeleted) {
    this.where({ isDeleted: false });
  }
});

// ── Virtual: full text search index on non-sensitive fields ─────────────
userSchema.index(
  { fullName: 'text', city: 'text', email: 'text' },
  { weights: { fullName: 3, city: 2, email: 1 } },
);

const User = mongoose.model<IUser>('User', userSchema);
export default User;
