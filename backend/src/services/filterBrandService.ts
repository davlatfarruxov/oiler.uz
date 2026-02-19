import FilterBrand, { IFilterBrandDocument } from '../models/FilterBrand';
import { ApiError } from '../utils/ApiError';

interface CreateFilterBrandData {
  name: string;
}

export class FilterBrandService {
  async createFilterBrand(tenantId: string, data: CreateFilterBrandData): Promise<IFilterBrandDocument> {
    const existingBrand = await FilterBrand.findOne({ tenant: tenantId, name: data.name });
    if (existingBrand) {
      throw new ApiError(409, 'Filter brand with this name already exists');
    }

    const brand = await FilterBrand.create({
      tenant: tenantId,
      ...data
    });
    return brand;
  }

  async getAllFilterBrands(tenantId: string, activeOnly: boolean = false): Promise<IFilterBrandDocument[]> {
    const filter: any = { tenant: tenantId };
    if (activeOnly) {
      filter.active = true;
    }
    return FilterBrand.find(filter).sort({ name: 1 });
  }

  async getFilterBrandById(tenantId: string, id: string): Promise<IFilterBrandDocument> {
    const brand = await FilterBrand.findOne({ _id: id, tenant: tenantId });
    if (!brand) {
      throw new ApiError(404, 'Filter brand not found');
    }
    return brand;
  }

  async updateFilterBrand(tenantId: string, id: string, data: Partial<CreateFilterBrandData>): Promise<IFilterBrandDocument> {
    if (data.name) {
      const existingBrand = await FilterBrand.findOne({
        tenant: tenantId,
        _id: { $ne: id },
        name: data.name
      });
      if (existingBrand) {
        throw new ApiError(409, 'Filter brand with this name already exists');
      }
    }

    const brand = await FilterBrand.findOneAndUpdate(
      { _id: id, tenant: tenantId },
      data,
      { new: true, runValidators: true }
    );
    if (!brand) {
      throw new ApiError(404, 'Filter brand not found');
    }
    return brand;
  }

  async toggleFilterBrandStatus(tenantId: string, id: string): Promise<IFilterBrandDocument> {
    const brand = await FilterBrand.findOne({ _id: id, tenant: tenantId });
    if (!brand) {
      throw new ApiError(404, 'Filter brand not found');
    }
    brand.active = !brand.active;
    await brand.save();
    return brand;
  }

  async deleteFilterBrand(tenantId: string, id: string): Promise<void> {
    const brand = await FilterBrand.findOneAndDelete({ _id: id, tenant: tenantId });
    if (!brand) {
      throw new ApiError(404, 'Filter brand not found');
    }
  }
}
