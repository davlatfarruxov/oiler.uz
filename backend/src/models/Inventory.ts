import mongoose, { Schema, Document } from 'mongoose';
import { ProductType } from '../types';

export interface IInventoryDocument extends Document {
  tenant: mongoose.Types.ObjectId;
  productType: ProductType;
  name: string;
  stock: number;
  reorderLevel: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventoryDocument>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant is required'],
      index: true
    },
    productType: {
      type: String,
      enum: Object.values(ProductType),
      required: [true, 'Product type is required']
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: 0,
      default: 0
    },
    reorderLevel: {
      type: Number,
      required: [true, 'Reorder level is required'],
      min: 0,
      default: 10
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for multi-tenant queries
inventorySchema.index({ tenant: 1, createdAt: -1 });
inventorySchema.index({ tenant: 1, productType: 1 });
inventorySchema.index({ tenant: 1, stock: 1 });
inventorySchema.index({ tenant: 1, name: 1 });

// Virtual to check if reorder is needed
inventorySchema.virtual('needsReorder').get(function() {
  return this.stock <= this.reorderLevel;
});

export default mongoose.model<IInventoryDocument>('Inventory', inventorySchema);
