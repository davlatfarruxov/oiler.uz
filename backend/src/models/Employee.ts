import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

export interface IEmployeeDocument extends Document {
  tenant: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  commissionRate: number; // Percentage from labor cost (1-100)
  active: boolean;
  startDate: Date;
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployeeDocument>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.EMPLOYEE
    },
    commissionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    active: {
      type: Boolean,
      default: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    },
    archivedAt: {
      type: Date
    },
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for multi-tenant queries
employeeSchema.index({ tenant: 1, active: 1 });
employeeSchema.index({ tenant: 1, role: 1 });
employeeSchema.index({ tenant: 1, createdAt: -1 });

// Email should be unique per tenant
employeeSchema.index({ tenant: 1, email: 1 }, { unique: true });

export default mongoose.model<IEmployeeDocument>('Employee', employeeSchema);
