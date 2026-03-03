import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployeePaymentDocument extends Document {
  tenant: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  paymentDate: Date;
  notes?: string;
  // Related services (if paying for specific services)
  relatedServices: Array<{
    serviceId: mongoose.Types.ObjectId;
    serviceType: 'oilChange' | 'service';
    commissionAmount: number;
  }>;
  // Or monthly payment
  isMonthlyPayment: boolean;
  monthYear?: string; // Format: "2026-02" for February 2026
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeePaymentSchema = new Schema<IEmployeePaymentDocument>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant is required'],
      index: true
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee is required'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'transfer'],
      required: [true, 'Payment method is required']
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
      default: Date.now
    },
    notes: {
      type: String,
      trim: true
    },
    relatedServices: [{
      serviceId: {
        type: Schema.Types.ObjectId,
        required: true
      },
      serviceType: {
        type: String,
        enum: ['oilChange', 'service'],
        required: true
      },
      commissionAmount: {
        type: Number,
        required: true,
        min: 0
      }
    }],
    isMonthlyPayment: {
      type: Boolean,
      default: false
    },
    monthYear: {
      type: String,
      match: /^\d{4}-\d{2}$/ // Format: YYYY-MM
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
employeePaymentSchema.index({ tenant: 1, employee: 1, paymentDate: -1 });
employeePaymentSchema.index({ tenant: 1, monthYear: 1 });

export default mongoose.model<IEmployeePaymentDocument>('EmployeePayment', employeePaymentSchema);
