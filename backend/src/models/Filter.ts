import mongoose, { Schema, Document } from 'mongoose';
import { FilterType } from '../types';

export interface IFilterDocument extends Document {
  brandName: string;
  filterType: FilterType;
  partNumber: string; // e.g., "W 712/75"
  quality: string; // e.g., "Premium", "Standard", "Economy"
  compatibleVehicles: string[]; // e.g., ["Toyota Camry", "Honda Accord"]
  costPrice: number;
  costCurrency: 'USD' | 'UZS';
  exchangeRateUsed: number;
  price: number; // Sale price in UZS
  stock: number;
  reorderLevel: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const filterSchema = new Schema<IFilterDocument>(
  {
    brandName: {
      type: String,
      required: [true, 'Filter brand name is required'],
      trim: true,
      index: true
    },
    filterType: {
      type: String,
      enum: Object.values(FilterType),
      required: [true, 'Filter type is required'],
      index: true
    },
    partNumber: {
      type: String,
      required: [true, 'Part number is required'],
      trim: true
    },
    quality: {
      type: String,
      required: [true, 'Quality is required'],
      trim: true
    },
    compatibleVehicles: [{
      type: String,
      trim: true
    }],
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: 0
    },
    costCurrency: {
      type: String,
      enum: ['USD', 'UZS'],
      required: [true, 'Cost currency is required']
    },
    exchangeRateUsed: {
      type: Number,
      required: [true, 'Exchange rate is required'],
      min: 0
    },
    price: {
      type: Number,
      required: [true, 'Sale price is required'],
      min: 0
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: 0,
      default: 0
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: 0
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

filterSchema.index({ brandName: 1, filterType: 1, partNumber: 1 });
filterSchema.index({ active: 1 });
filterSchema.index({ stock: 1 });

export default mongoose.model<IFilterDocument>('Filter', filterSchema);
