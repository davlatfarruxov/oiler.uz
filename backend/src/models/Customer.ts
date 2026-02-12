import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerDocument extends Document {
  tenant: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  vehicles: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomerDocument>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    vehicles: [{
      type: Schema.Types.ObjectId,
      ref: 'Vehicle'
    }]
  },
  {
    timestamps: true
  }
);

// Compound indexes for multi-tenant queries
customerSchema.index({ tenant: 1, createdAt: -1 });
customerSchema.index({ tenant: 1, phone: 1 });

// Phone should be unique per tenant
customerSchema.index({ tenant: 1, phone: 1 }, { unique: true });

export default mongoose.model<ICustomerDocument>('Customer', customerSchema);
