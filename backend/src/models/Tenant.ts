import mongoose, { Schema, Document } from 'mongoose';

export enum SubscriptionPlan {
  FREE = 'free',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

export interface ITenantSettings {
  currency: string;
  timezone: string;
  exchangeRate: number;
  lowStockThreshold: number;
  defaultOilType: string;
  serviceIntervalKm: number;
  serviceIntervalMonths: number;
}

export interface ITenantDocument extends Document {
  // Company Information
  companyName: string;
  businessEmail: string;
  businessPhone: string;
  address: string;
  subdomain?: string;
  
  // Subscription Information
  plan: SubscriptionPlan;
  maxEmployees: number;
  maxVehicles: number;
  
  // Settings
  settings: ITenantSettings;
  
  // Status
  isActive: boolean;
  expiresAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const tenantSettingsSchema = new Schema({
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
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  defaultOilType: {
    type: String,
    default: '5w30'
  },
  serviceIntervalKm: {
    type: Number,
    default: 5000,
    min: 0
  },
  serviceIntervalMonths: {
    type: Number,
    default: 6,
    min: 0
  }
}, { _id: false });

const tenantSchema = new Schema<ITenantDocument>(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      index: true
    },
    businessEmail: {
      type: String,
      required: [true, 'Business email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    businessPhone: {
      type: String,
      required: [true, 'Business phone is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    subdomain: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens']
    },
    plan: {
      type: String,
      enum: Object.values(SubscriptionPlan),
      default: SubscriptionPlan.FREE
    },
    maxEmployees: {
      type: Number,
      default: 5, // Free plan: 5 employees
      min: 1
    },
    maxVehicles: {
      type: Number,
      default: 100, // Free plan: 100 vehicles
      min: 1
    },
    settings: {
      type: tenantSettingsSchema,
      default: () => ({})
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
tenantSchema.index({ companyName: 1, isActive: 1 });
tenantSchema.index({ createdAt: -1 });

// Virtual for checking if subscription is expired
tenantSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Method to check if tenant can add more employees
tenantSchema.methods.canAddEmployee = async function(currentCount: number): Promise<boolean> {
  return currentCount < this.maxEmployees;
};

// Method to check if tenant can add more vehicles
tenantSchema.methods.canAddVehicle = async function(currentCount: number): Promise<boolean> {
  return currentCount < this.maxVehicles;
};

export default mongoose.model<ITenantDocument>('Tenant', tenantSchema);
