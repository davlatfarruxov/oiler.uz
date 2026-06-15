import mongoose, { Schema, Document } from 'mongoose';

export type ExpenseCategory = 'rent' | 'utilities' | 'equipment' | 'marketing' | 'other';

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: 'Ijara',
  utilities: 'Kommunal xizmatlar',
  equipment: 'Asbob-uskunalar',
  marketing: 'Reklama/Marketing',
  other: 'Boshqa',
};

export interface IExpense extends Document {
  tenant: mongoose.Types.ObjectId;
  date: Date;
  category: ExpenseCategory;
  amount: number;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    date: { type: Date, required: true, default: Date.now },
    category: {
      type: String,
      enum: ['rent', 'utilities', 'equipment', 'marketing', 'other'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ tenant: 1, date: -1 });
ExpenseSchema.index({ tenant: 1, category: 1, date: -1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
