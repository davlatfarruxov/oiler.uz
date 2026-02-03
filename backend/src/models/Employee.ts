import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

export interface IEmployeeDocument extends Document {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  commissionRate: number; // Percentage from labor cost (1-100)
  active: boolean;
  startDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployeeDocument>(
  {
    name: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
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
    }
  },
  {
    timestamps: true
  }
);

employeeSchema.index({ active: 1 });
employeeSchema.index({ role: 1 });
employeeSchema.index({ email: 1 });

export default mongoose.model<IEmployeeDocument>('Employee', employeeSchema);
