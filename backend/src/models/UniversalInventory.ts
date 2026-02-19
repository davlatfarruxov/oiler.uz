import mongoose, { Document, Schema } from 'mongoose';

export interface IUniversalInventoryDocument extends Document {
  tenant: mongoose.Types.ObjectId;
  name: string;
  partNumber?: string;
  brand?: string;
  category: string;
  price: number;
  stock: number;
  unit: 'piece' | 'liter' | 'kg' | 'meter' | 'set' | 'pair' | 'box';
  description?: string;
  reorderLevel: number;
  createdAt: Date;
  updatedAt: Date;
  needsReorder: boolean; // Virtual field
}

const universalInventorySchema = new Schema<IUniversalInventoryDocument>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    partNumber: {
      type: String,
      trim: true
    },
    brand: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative']
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: ['piece', 'liter', 'kg', 'meter', 'set', 'pair', 'box'],
      default: 'piece'
    },
    description: {
      type: String,
      trim: true
    },
    reorderLevel: {
      type: Number,
      required: true,
      default: 10,
      min: [0, 'Reorder level cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for multi-tenant queries
universalInventorySchema.index({ tenant: 1, category: 1 });
universalInventorySchema.index({ tenant: 1, name: 'text' });
universalInventorySchema.index({ tenant: 1, stock: 1 });

// Virtual for needsReorder
universalInventorySchema.virtual('needsReorder').get(function() {
  return this.stock <= this.reorderLevel;
});

// Ensure virtuals are included in JSON
universalInventorySchema.set('toJSON', { virtuals: true });
universalInventorySchema.set('toObject', { virtuals: true });

export default mongoose.model<IUniversalInventoryDocument>('UniversalInventory', universalInventorySchema);
