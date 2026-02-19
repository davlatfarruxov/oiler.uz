import mongoose, { Schema, Document } from 'mongoose';

export interface IArchiveDocument extends Document {
  tenant: mongoose.Types.ObjectId;
  entityType: 'Vehicle' | 'OilChange' | 'Service';
  entityId: mongoose.Types.ObjectId;
  action: 'created' | 'updated' | 'archived';
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  snapshot: any; // Full snapshot of the entity at this point
  performedBy: mongoose.Types.ObjectId;
  performedAt: Date;
  reason?: string;
}

const archiveSchema = new Schema<IArchiveDocument>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    entityType: {
      type: String,
      enum: ['Vehicle', 'OilChange', 'Service'],
      required: true
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'archived'],
      required: true
    },
    changes: [{
      field: String,
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed
    }],
    snapshot: {
      type: Schema.Types.Mixed,
      required: true
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  },
  {
    timestamps: true
  }
);

// Compound index for efficient queries
archiveSchema.index({ tenant: 1, entityType: 1, entityId: 1, performedAt: -1 });

export default mongoose.model<IArchiveDocument>('Archive', archiveSchema);
