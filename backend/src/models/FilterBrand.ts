import mongoose, { Schema, Document } from 'mongoose';

export interface IFilterBrandDocument extends Document {
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const filterBrandSchema = new Schema<IFilterBrandDocument>(
  {
    name: {
      type: String,
      required: [true, 'Filter brand name is required'],
      unique: true,
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

filterBrandSchema.index({ name: 1 });
filterBrandSchema.index({ active: 1 });

export default mongoose.model<IFilterBrandDocument>('FilterBrand', filterBrandSchema);
