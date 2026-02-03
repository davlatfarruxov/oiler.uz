import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerDocument extends Document {
  name: string;
  phone: string;
  vehicles: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomerDocument>(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true
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

export default mongoose.model<ICustomerDocument>('Customer', customerSchema);
