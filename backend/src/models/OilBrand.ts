import mongoose, { Document, Schema } from 'mongoose';

export interface IOilBrand extends Document {
  name: string;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const oilBrandSchema = new Schema<IOilBrand>(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      unique: true,
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

oilBrandSchema.index({ name: 1 });

export default mongoose.model<IOilBrand>('OilBrand', oilBrandSchema);
