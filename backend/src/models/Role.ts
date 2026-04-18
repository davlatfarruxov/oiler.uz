import mongoose, { Schema, Document } from 'mongoose';
import type { PermissionKey } from '../constants/permissions';

export interface IRoleDocument extends Document {
  tenant: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  permissions: PermissionKey[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRoleDocument>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    permissions: {
      type: [String],
      default: []
    },
    isSystem: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

roleSchema.index({ tenant: 1, name: 1 }, { unique: true });

export default mongoose.model<IRoleDocument>('Role', roleSchema);
