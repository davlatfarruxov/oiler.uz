import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployeeCommission {
  employee: mongoose.Types.ObjectId;
  commissionRate: number; // Percentage at time of service
  commissionAmount: number; // Calculated amount
}

export interface IAdditionalProduct {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IOilChangeDocument extends Document {
  tenant: mongoose.Types.ObjectId;
  vehicle: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  employees: mongoose.Types.ObjectId[];
  employeeCommissions: IEmployeeCommission[];
  oilProduct?: mongoose.Types.ObjectId;
  oilProductCustomerProvided: boolean;
  oilProductCustomerProvidedDetails?: string;
  oilQuantityUsed: number;
  // Oil Filter
  oilFilter?: mongoose.Types.ObjectId;
  oilFilterCustomerProvided: boolean;
  oilFilterCustomerProvidedDetails?: string;
  // Air Filter
  airFilter?: mongoose.Types.ObjectId;
  airFilterCustomerProvided: boolean;
  airFilterCustomerProvidedDetails?: string;
  // Cabin Filter
  cabinFilter?: mongoose.Types.ObjectId;
  cabinFilterCustomerProvided: boolean;
  cabinFilterCustomerProvidedDetails?: string;
  // Fuel Filter
  fuelFilter?: mongoose.Types.ObjectId;
  fuelFilterCustomerProvided: boolean;
  fuelFilterCustomerProvidedDetails?: string;
  additionalProducts: IAdditionalProduct[];
  mileage: number;
  nextServiceMileage: number;
  laborCost: number;
  price: number;
  // Payment tracking fields
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  amountPaid: number;
  amountDue: number;
  dueDate?: Date;
  paidAt?: Date;
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeCommissionSchema = new Schema({
  employee: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  commissionAmount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const additionalProductSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const oilChangeSchema = new Schema<IOilChangeDocument>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant is required'],
      index: true
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },
    employees: [{
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    }],
    employeeCommissions: [employeeCommissionSchema],
    oilProduct: {
      type: Schema.Types.ObjectId,
      ref: 'OilProduct',
      required: false
    },
    oilProductCustomerProvided: {
      type: Boolean,
      default: false
    },
    oilProductCustomerProvidedDetails: {
      type: String,
      trim: true
    },
    oilQuantityUsed: {
      type: Number,
      required: [true, 'Oil quantity used is required'],
      min: 0
    },
    // Oil Filter
    oilFilter: {
      type: Schema.Types.ObjectId,
      ref: 'Filter',
      required: false
    },
    oilFilterCustomerProvided: {
      type: Boolean,
      default: false
    },
    oilFilterCustomerProvidedDetails: {
      type: String,
      trim: true
    },
    // Air Filter
    airFilter: {
      type: Schema.Types.ObjectId,
      ref: 'Filter',
      required: false
    },
    airFilterCustomerProvided: {
      type: Boolean,
      default: false
    },
    airFilterCustomerProvidedDetails: {
      type: String,
      trim: true
    },
    // Cabin Filter
    cabinFilter: {
      type: Schema.Types.ObjectId,
      ref: 'Filter',
      required: false
    },
    cabinFilterCustomerProvided: {
      type: Boolean,
      default: false
    },
    cabinFilterCustomerProvidedDetails: {
      type: String,
      trim: true
    },
    // Fuel Filter
    fuelFilter: {
      type: Schema.Types.ObjectId,
      ref: 'Filter',
      required: false
    },
    fuelFilterCustomerProvided: {
      type: Boolean,
      default: false
    },
    fuelFilterCustomerProvidedDetails: {
      type: String,
      trim: true
    },
    additionalProducts: [additionalProductSchema],
    mileage: {
      type: Number,
      required: [true, 'Mileage is required'],
      min: 0
    },
    nextServiceMileage: {
      type: Number,
      required: [true, 'Next service mileage is required'],
      min: 0
    },
    laborCost: {
      type: Number,
      default: 0,
      min: 0
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0
    },
    // Payment tracking fields
    paymentStatus: {
      type: String,
      enum: ['paid', 'partial', 'unpaid'],
      default: 'unpaid',
      index: true
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0
    },
    amountDue: {
      type: Number,
      required: true,
      min: 0
    },
    dueDate: {
      type: Date,
      index: true
    },
    paidAt: {
      type: Date
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    },
    archivedAt: Date,
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for multi-tenant queries
oilChangeSchema.index({ tenant: 1, createdAt: -1 });
oilChangeSchema.index({ tenant: 1, vehicle: 1, createdAt: -1 });
oilChangeSchema.index({ tenant: 1, customer: 1, createdAt: -1 });
oilChangeSchema.index({ tenant: 1, employees: 1, createdAt: -1 });
oilChangeSchema.index({ tenant: 1, paymentStatus: 1 });
oilChangeSchema.index({ tenant: 1, dueDate: 1, paymentStatus: 1 });

export default mongoose.model<IOilChangeDocument>('OilChange', oilChangeSchema);
