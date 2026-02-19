import mongoose, { Schema, Document } from 'mongoose';
import { EngineType } from '../types';

export interface IVehicleDocument extends Document {
  tenant: mongoose.Types.ObjectId;
  plateNumber: string;
  brand: string;
  vehicleModel: string; // Renamed from 'model' to avoid conflict with Document.model()
  engineType: EngineType;
  customer: mongoose.Types.ObjectId;
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicleDocument>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant is required'],
      index: true
    },
    plateNumber: {
      type: String,
      required: [true, 'Plate number is required'],
      uppercase: true,
      trim: true
    },
    brand: {
      type: String,
      required: [true, 'Vehicle brand is required'],
      trim: true
    },
    vehicleModel: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true
    },
    engineType: {
      type: String,
      enum: Object.values(EngineType),
      required: [true, 'Engine type is required']
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    },
    archivedAt: Date,
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
vehicleSchema.index({ tenant: 1, createdAt: -1 });
vehicleSchema.index({ tenant: 1, customer: 1 });

// Plate number should be unique per tenant
vehicleSchema.index({ tenant: 1, plateNumber: 1 }, { unique: true });

export default mongoose.model<IVehicleDocument>('Vehicle', vehicleSchema);
