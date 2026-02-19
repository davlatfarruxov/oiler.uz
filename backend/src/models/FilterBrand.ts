import mongoose, { Schema, Document } from 'mongoose';

export interface IFilterBrandDocument extends Document {
  tenant: mongoose.Types.ObjectId;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const filterBrandSchema = new Schema<IFilterBrandDocument>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Filter brand name is required'],
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
filterBrandSchema.index({ tenant: 1, createdAt: -1 });
filterBrandSchema.index({ tenant: 1, name: 1 }, { unique: true });
filterBrandSchema.index({ tenant: 1, active: 1 });

export default mongoose.model<IFilterBrandDocument>('FilterBrand', filterBrandSchema);
