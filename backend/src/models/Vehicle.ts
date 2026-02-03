import mongoose, { Schema, Document } from 'mongoose';
import { EngineType } from '../types';

export interface IVehicleDocument extends Document {
  plateNumber: string;
  brand: string;
  model: string;
  engineType: EngineType;
  customer: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicleDocument>(
  {
    plateNumber: {
      type: String,
      required: [true, 'Plate number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    brand: {
      type: String,
      required: [true, 'Vehicle brand is required'],
      trim: true
    },
    model: {
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
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IVehicleDocument>('Vehicle', vehicleSchema);
