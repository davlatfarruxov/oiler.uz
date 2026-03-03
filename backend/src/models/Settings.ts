import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  tenant: mongoose.Types.ObjectId;
  
  // Service Defaults
  defaultOilType: string;
  serviceIntervalKm: number;
  serviceIntervalMonths: number;
  
  // System Settings
  lowStockThreshold: number;
  currency: string;
  timezone: string;
  exchangeRate: number; // USD to UZS exchange rate
  employeeCommissionRate: number; // Default commission rate for employees (percentage)
  
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant is required'],
      unique: true, // Each tenant can have only one settings document
      index: true
    },
    defaultOilType: {
      type: String,
      default: '5w30'
    },
    serviceIntervalKm: {
      type: Number,
      default: 5000
    },
    serviceIntervalMonths: {
      type: Number,
      default: 6
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    currency: {
      type: String,
      default: 'USD'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    exchangeRate: {
      type: Number,
      default: 12500, // 1 USD = 12,500 UZS
      min: [0, 'Exchange rate cannot be negative']
    },
    employeeCommissionRate: {
      type: Number,
      default: 30, // 30% commission rate
      min: [0, 'Commission rate cannot be negative'],
      max: [100, 'Commission rate cannot exceed 100%']
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ISettings>('Settings', settingsSchema);
