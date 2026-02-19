import mongoose, { Schema, Document } from 'mongoose';

// Individual service item (product/part within a service)
export interface IServiceItemItem {
  itemName: string;
  itemType: 'inventory' | 'custom';
  inventoryId?: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Individual service within a work session
export interface IServiceItem {
  serviceName: string;
  items: IServiceItemItem[];
  laborCost: number;
  employees: mongoose.Types.ObjectId[]; // Each service has its own employees
  totalPrice: number;
}

// Work session document (contains multiple services)
export interface IServiceDocument extends Document {
  tenant: mongoose.Types.ObjectId;
  vehicle: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  services: IServiceItem[]; // Array of services in this work session
  mileage?: number;
  notes?: string;
  totalPrice: number;
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

// Service item item schema (products/parts within a service)
const serviceItemItemSchema = new Schema({
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  itemType: {
    type: String,
    enum: ['inventory', 'custom'],
    required: true
  },
  inventoryId: {
    type: Schema.Types.ObjectId,
    ref: 'UniversalInventory',
    required: function(this: IServiceItemItem) {
      return this.itemType === 'inventory';
    }
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Individual service schema
const serviceItemSchema = new Schema({
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  items: {
    type: [serviceItemItemSchema],
    default: []
  },
  laborCost: {
    type: Number,
    default: 0,
    min: 0
  },
  employees: [{
    type: Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Work session schema (main document)
const serviceSchema = new Schema<IServiceDocument>(
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
    services: {
      type: [serviceItemSchema],
      required: true,
      validate: {
        validator: function(services: IServiceItem[]) {
          return services.length > 0;
        },
        message: 'Work session must have at least one service'
      }
    },
    mileage: {
      type: Number,
      min: 0
    },
    notes: {
      type: String,
      trim: true
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
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
serviceSchema.index({ tenant: 1, createdAt: -1 });
serviceSchema.index({ tenant: 1, vehicle: 1, createdAt: -1 });
serviceSchema.index({ tenant: 1, customer: 1, createdAt: -1 });
serviceSchema.index({ tenant: 1, paymentStatus: 1 });
serviceSchema.index({ tenant: 1, dueDate: 1, paymentStatus: 1 });

// Pre-save hook to calculate totalPrice and amountDue
serviceSchema.pre('save', function(next) {
  // Calculate total from all services
  this.totalPrice = this.services.reduce((sum, service) => sum + service.totalPrice, 0);
  this.amountDue = this.totalPrice - this.amountPaid;
  next();
});

export default mongoose.model<IServiceDocument>('Service', serviceSchema);
