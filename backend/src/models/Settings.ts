import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  // Company Information
  companyName: string;
  businessEmail: string;
  businessPhone: string;
  address: string;
  
  // Service Defaults
  defaultOilType: string;
  serviceIntervalKm: number;
  serviceIntervalMonths: number;
  
  // System Settings
  lowStockThreshold: number;
  currency: string;
  timezone: string;
  exchangeRate: number; // USD to UZS exchange rate
  
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    companyName: {
      type: String,
      required: true,
      default: 'OilServe Pro'
    },
    businessEmail: {
      type: String,
      required: true,
      default: 'admin@oilserve.com'
    },
    businessPhone: {
      type: String,
      required: true,
      default: '555-0000'
    },
    address: {
      type: String,
      required: true,
      default: '123 Service Ave'
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
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ISettings>('Settings', settingsSchema);
