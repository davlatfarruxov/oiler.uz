import mongoose, { Document, Schema } from 'mongoose';

export interface IOilBrand extends Document {
  tenant: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const oilBrandSchema = new Schema<IOilBrand>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
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

// Compound indexes for multi-tenant queries
oilBrandSchema.index({ tenant: 1, createdAt: -1 });
oilBrandSchema.index({ tenant: 1, name: 1 }, { unique: true });

export default mongoose.model<IOilBrand>('OilBrand', oilBrandSchema);
