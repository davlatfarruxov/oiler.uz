import mongoose, { Schema, Document } from 'mongoose';

export interface ISessionDocument extends Document {
  user: mongoose.Types.ObjectId;
  tenant: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  userAgent?: string;
  ip?: string;
  revokedAt?: Date;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISessionDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    refreshTokenHash: {
      type: String,
      required: true,
      default: ''
    },
    userAgent: { type: String },
    ip: { type: String },
    revokedAt: { type: Date },
    lastUsedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1, revokedAt: 1 });
sessionSchema.index({ tenant: 1, createdAt: -1 });

export default mongoose.model<ISessionDocument>('Session', sessionSchema);
