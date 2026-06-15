import Filter, { IFilterDocument } from '../models/Filter';
import Settings from '../models/Settings';
import { ApiError } from '../utils/ApiError';
import { FilterType } from '../types';

interface CreateFilterData {
  brandName: string;
  filterType: FilterType;
  partNumber: string;
  quality: string;
  compatibleVehicles: string[];
  costPrice: number;
  costCurrency: 'USD' | 'UZS';
  price: number;
  stock: number;
  reorderLevel?: number;
}

interface UpdateFilterData {
  brandName?: string;
  filterType?: FilterType;
  partNumber?: string;
  quality?: string;
  compatibleVehicles?: string[];
  costPrice?: number;
  costCurrency?: 'USD' | 'UZS';
  price?: number;
  stock?: number;
  reorderLevel?: number;
  active?: boolean;
}

export class FilterService {
  async createFilter(tenantId: string, data: CreateFilterData): Promise<IFilterDocument> {
    let settings = await Settings.findOne({ tenant: tenantId });
    if (!settings) {
      settings = await Settings.create({ tenant: tenantId });
    }
    const exchangeRate = settings.exchangeRate;

    const existingFilter = await Filter.findOne({
      tenant: tenantId,
      brandName: data.brandName,
      filterType: data.filterType,
      partNumber: data.partNumber
    });

    if (existingFilter) {
      throw new ApiError(400, 'Filter with these specifications already exists');
    }

    const filter = await Filter.create({
      tenant: tenantId,
      brandName: data.brandName,
      filterType: data.filterType,
      partNumber: data.partNumber,
      quality: data.quality,
      compatibleVehicles: data.compatibleVehicles,
      costPrice: data.costPrice,
      costCurrency: data.costCurrency,
      exchangeRateUsed: exchangeRate,
      price: data.price,
      stock: data.stock,
      reorderLevel: data.reorderLevel || 10
    });

    return filter;
  }

  async getAllFilters(tenantId: string, activeOnly: boolean = false, filterType?: FilterType, brandName?: string): Promise<any[]> {
    const filter: any = { tenant: tenantId };
    if (activeOnly) {
      filter.active = true;
    }
    if (filterType) {
      filter.filterType = filterType;
    }
    if (brandName) {
      filter.brandName = { $regex: brandName, $options: 'i' };
    }
    
    const filters = await Filter.find(filter)
      .sort({ brandName: 1, filterType: 1, partNumber: 1 });
    
    return filters.map(f => ({
      _id: f._id.toString(),
      brandName: f.brandName,
      filterType: f.filterType,
      partNumber: f.partNumber,
      quality: f.quality,
      compatibleVehicles: f.compatibleVehicles,
      costPrice: f.costPrice,
      costCurrency: f.costCurrency,
      exchangeRateUsed: f.exchangeRateUsed,
      price: f.price,
      stock: f.stock,
      reorderLevel: f.reorderLevel,
      active: f.active,
      displayName: `${f.brandName} ${f.partNumber} (${f.quality})`
    }));
  }

  async getFilterById(tenantId: string, id: string): Promise<IFilterDocument> {
    const filter = await Filter.findOne({ _id: id, tenant: tenantId });
    if (!filter) {
      throw new ApiError(404, 'Filter not found');
    }
    return filter;
  }

  async updateFilter(tenantId: string, id: string, data: UpdateFilterData): Promise<IFilterDocument> {
    const filter = await Filter.findOne({ _id: id, tenant: tenantId });
    if (!filter) {
      throw new ApiError(404, 'Filter not found');
    }

    if (data.brandName || data.filterType || data.partNumber) {
      const checkData = {
        tenant: tenantId,
        brandName: data.brandName || filter.brandName,
        filterType: data.filterType || filter.filterType,
        partNumber: data.partNumber || filter.partNumber
      };

      const duplicate = await Filter.findOne({
        ...checkData,
        _id: { $ne: id }
      });

      if (duplicate) {
        throw new ApiError(400, 'Filter with these specifications already exists');
      }
    }

    if (data.brandName) filter.brandName = data.brandName;
    if (data.filterType) filter.filterType = data.filterType;
    if (data.partNumber) filter.partNumber = data.partNumber;
    if (data.quality) filter.quality = data.quality;
    if (data.compatibleVehicles) filter.compatibleVehicles = data.compatibleVehicles;
    if (data.costPrice !== undefined) filter.costPrice = data.costPrice;
    if (data.costCurrency) filter.costCurrency = data.costCurrency;
    if (data.price !== undefined) filter.price = data.price;
    if (data.stock !== undefined) filter.stock = data.stock;
    if (data.reorderLevel !== undefined) filter.reorderLevel = data.reorderLevel;
    if (data.active !== undefined) filter.active = data.active;
    
    if (data.costPrice !== undefined || data.costCurrency) {
      const settings = await Settings.findOne({ tenant: tenantId });
      if (settings) {
        filter.exchangeRateUsed = settings.exchangeRate;
      }
    }

    await filter.save();
    return filter;
  }

  async deleteFilter(tenantId: string, id: string): Promise<void> {
    const filter = await Filter.findOne({ _id: id, tenant: tenantId });
    if (!filter) {
      throw new ApiError(404, 'Filter not found');
    }
    await filter.deleteOne();
  }

  async updateStock(tenantId: string, id: string, quantity: number): Promise<IFilterDocument> {
    const filter = await Filter.findOne({ _id: id, tenant: tenantId });
    if (!filter) {
      throw new ApiError(404, 'Filter not found');
    }

    filter.stock += quantity;
    if (filter.stock < 0) {
      throw new ApiError(400, 'Insufficient stock');
    }

    await filter.save();
    return filter;
  }

  async getLowStockFilters(tenantId: string, threshold: number = 10): Promise<IFilterDocument[]> {
    return Filter.find({
      tenant: tenantId,
      active: true,
      stock: { $lte: threshold }
    })
      .lean()
      .sort({ stock: 1 });
  }

  async bulkImport(
    tenantId: string,
    rows: CreateFilterData[]
  ): Promise<{ created: number; skipped: number; errors: { row: number; name: string; reason: string }[] }> {
    let settings = await Settings.findOne({ tenant: tenantId });
    if (!settings) settings = await Settings.create({ tenant: tenantId });
    const exchangeRate = settings.exchangeRate;

    let created = 0;
    let skipped = 0;
    const errors: { row: number; name: string; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const data = rows[i];
      const label = `${data.brandName} ${data.partNumber}`;
      try {
        const existing = await Filter.findOne({
          tenant: tenantId,
          brandName: data.brandName,
          filterType: data.filterType,
          partNumber: data.partNumber,
        });
        if (existing) { skipped++; continue; }

        await Filter.create({
          tenant: tenantId,
          ...data,
          exchangeRateUsed: exchangeRate,
          reorderLevel: data.reorderLevel ?? 10,
        });
        created++;
      } catch {
        errors.push({ row: i + 2, name: label, reason: 'Saqlashda xatolik' });
      }
    }

    return { created, skipped, errors };
  }
}
