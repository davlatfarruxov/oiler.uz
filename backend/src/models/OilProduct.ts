import mongoose, { Document, Schema } from 'mongoose';

export interface IOilProduct extends Document {
  brand: mongoose.Types.ObjectId; // Reference to OilBrand
  viscosity: string; // 10W-40, 5W-30, etc.
  apiGrade: string; // SN, SL, SP, etc.
  volume: number; // liters (4, 5, 1, etc.)
  costPrice: number; // Sotib olingan narx
  costCurrency: 'USD' | 'UZS'; // Qaysi valyutada sotib olingan
  exchangeRateUsed: number; // Mahsulot kiritilgan paytdagi kurs
  price: number; // Sotish narxi (faqat UZS)
  stock: number;
  reorderLevel: number; // Minimum stock level
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const oilProductSchema = new Schema<IOilProduct>(
  {
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'OilBrand',
      required: [true, 'Brand is required']
    },
    viscosity: {
      type: String,
      required: [true, 'Viscosity is required'],
      trim: true
    },
    apiGrade: {
      type: String,
      required: [true, 'API grade is required'],
      trim: true,
      uppercase: true
    },
    volume: {
      type: Number,
      required: [true, 'Volume is required'],
      min: [0.5, 'Volume must be at least 0.5 liters']
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative']
    },
    costCurrency: {
      type: String,
      enum: ['USD', 'UZS'],
      required: [true, 'Cost currency is required'],
      default: 'UZS'
    },
    exchangeRateUsed: {
      type: Number,
      required: [true, 'Exchange rate is required'],
      min: [0, 'Exchange rate cannot be negative']
    },
    price: {
      type: Number,
      required: [true, 'Sale price is required'],
      min: [0, 'Sale price cannot be negative']
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative']
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: [0, 'Reorder level cannot be negative']
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

// Index for faster queries
oilProductSchema.index({ brand: 1, viscosity: 1, apiGrade: 1, volume: 1 });
oilProductSchema.index({ active: 1 });

// Virtual for display name
oilProductSchema.virtual('displayName').get(function() {
  const brand = this.populated('brand') || this.brand;
  const brandName = typeof brand === 'object' && brand.name ? brand.name : 'Unknown';
  return `${brandName} ${this.viscosity} ${this.apiGrade} ${this.volume}L`;
});

// Ensure virtuals are included in JSON
oilProductSchema.set('toJSON', { virtuals: true });
oilProductSchema.set('toObject', { virtuals: true });

export default mongoose.model<IOilProduct>('OilProduct', oilProductSchema);
