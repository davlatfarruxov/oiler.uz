import Archive from '../models/Archive';
import { ApiError } from '../utils/ApiError';

export class ArchiveService {
  async createArchiveEntry(
    tenantId: string,
    entityType: 'Vehicle' | 'OilChange' | 'Service',
    entityId: string,
    action: 'created' | 'updated' | 'archived',
    snapshot: any,
    performedBy: string,
    changes: { field: string; oldValue: any; newValue: any }[] = [],
    reason?: string
  ) {
    return Archive.create({
      tenant: tenantId,
      entityType,
      entityId,
      action,
      changes,
      snapshot,
      performedBy,
      reason
    });
  }

  async getEntityHistory(tenantId: string, entityType: string, entityId: string) {
    return Archive.find({
      tenant: tenantId,
      entityType,
      entityId
    })
      .populate('performedBy', 'name email')
      .sort({ performedAt: -1 })
      .lean();
  }

  async getAllArchives(tenantId: string, entityType?: string, page: number = 1, limit: number = 20, action?: string) {
    const filter: any = { tenant: tenantId };
    if (entityType) {
      filter.entityType = entityType;
    }
    if (action) {
      filter.action = action;
    }

    const skip = (page - 1) * limit;

    const [data, totalItems] = await Promise.all([
      Archive.find(filter)
        .populate('performedBy', 'name email')
        .sort({ performedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Archive.countDocuments(filter)
    ]);

    return {
      data,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems
    };
  }
}
