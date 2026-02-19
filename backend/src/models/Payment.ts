import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  tenant: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  oilChange?: mongoose.Types.ObjectId;
  service?: mongoose.Types.ObjectId;
  serviceType: 'oilChange' | 'service';
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'check' | 'other';
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },
    oilChange: {
      type: Schema.Types.ObjectId,
      ref: 'OilChange',
      index: true
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      index: true
    },
    serviceType: {
      type: String,
      enum: ['oilChange', 'service'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'transfer', 'check', 'other'],
      required: true,
      default: 'cash'
    },
    notes: {
      type: String,
      trim: true
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient queries
PaymentSchema.index({ tenant: 1, customer: 1, paymentDate: -1 });
PaymentSchema.index({ tenant: 1, oilChange: 1 });
PaymentSchema.index({ tenant: 1, service: 1 });

// Validation: exactly one of oilChange or service must be set
PaymentSchema.pre('validate', function(next) {
  const hasOilChange = !!this.oilChange;
  const hasService = !!this.service;
  
  if (!hasOilChange && !hasService) {
    this.invalidate('oilChange', 'Either oilChange or service must be set');
    this.invalidate('service', 'Either oilChange or service must be set');
  }
  
  if (hasOilChange && hasService) {
    this.invalidate('oilChange', 'Cannot set both oilChange and service');
    this.invalidate('service', 'Cannot set both oilChange and service');
  }
  
  // Validate serviceType matches the reference
  if (hasOilChange && this.serviceType !== 'oilChange') {
    this.invalidate('serviceType', 'serviceType must be "oilChange" when oilChange is set');
  }
  
  if (hasService && this.serviceType !== 'service') {
    this.invalidate('serviceType', 'serviceType must be "service" when service is set');
  }
  
  next();
});

const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
