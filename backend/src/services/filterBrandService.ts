import FilterBrand, { IFilterBrandDocument } from '../models/FilterBrand';
import { ApiError } from '../utils/ApiError';

interface CreateFilterBrandData {
  name: string;
}

export class FilterBrandService {
  async createFilterBrand(data: CreateFilterBrandData): Promise<IFilterBrandDocument> {
    const existingBrand = await FilterBrand.findOne({ name: data.name });
    if (existingBrand) {
      throw new ApiError(409, 'Filter brand with this name already exists');
    }

    const brand = await FilterBrand.create(data);
    return brand;
  }

  async getAllFilterBrands(activeOnly: boolean = false): Promise<IFilterBrandDocument[]> {
    const filter = activeOnly ? { active: true } : {};
    return FilterBrand.find(filter).sort({ name: 1 });
  }

  async getFilterBrandById(id: string): Promise<IFilterBrandDocument> {
    const brand = await FilterBrand.findById(id);
    if (!brand) {
      throw new ApiError(404, 'Filter brand not found');
    }
    return brand;
  }

  async updateFilterBrand(id: string, data: Partial<CreateFilterBrandData>): Promise<IFilterBrandDocument> {
    if (data.name) {
      const existingBrand = await FilterBrand.findOne({
        _id: { $ne: id },
        name: data.name
      });
      if (existingBrand) {
        throw new ApiError(409, 'Filter brand with this name already exists');
      }
    }

    const brand = await FilterBrand.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!brand) {
      throw new ApiError(404, 'Filter brand not found');
    }
    return brand;
  }

  async toggleFilterBrandStatus(id: string): Promise<IFilterBrandDocument> {
    const brand = await FilterBrand.findById(id);
    if (!brand) {
      throw new ApiError(404, 'Filter brand not found');
    }
    brand.active = !brand.active;
    await brand.save();
    return brand;
  }

  async deleteFilterBrand(id: string): Promise<void> {
    const brand = await FilterBrand.findByIdAndDelete(id);
    if (!brand) {
      throw new ApiError(404, 'Filter brand not found');
    }
  }
}
