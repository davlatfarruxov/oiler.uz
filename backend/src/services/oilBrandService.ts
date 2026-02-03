import OilBrand, { IOilBrand } from '../models/OilBrand';
import { ApiError } from '../utils/ApiError';

interface CreateOilBrandData {
  name: string;
  description?: string;
}

interface UpdateOilBrandData {
  name?: string;
  description?: string;
  active?: boolean;
}

export class OilBrandService {
  async createOilBrand(data: CreateOilBrandData): Promise<IOilBrand> {
    const existingBrand = await OilBrand.findOne({ name: data.name });
    
    if (existingBrand) {
      throw new ApiError(400, 'Brand already exists');
    }

    const brand = await OilBrand.create(data);
    return brand;
  }

  async getAllOilBrands(activeOnly: boolean = false): Promise<IOilBrand[]> {
    const filter = activeOnly ? { active: true } : {};
    return OilBrand.find(filter).sort({ name: 1 });
  }

  async getOilBrandById(id: string): Promise<IOilBrand> {
    const brand = await OilBrand.findById(id);
    
    if (!brand) {
      throw new ApiError(404, 'Brand not found');
    }
    
    return brand;
  }

  async updateOilBrand(id: string, data: UpdateOilBrandData): Promise<IOilBrand> {
    const brand = await OilBrand.findById(id);
    
    if (!brand) {
      throw new ApiError(404, 'Brand not found');
    }

    if (data.name && data.name !== brand.name) {
      const duplicate = await OilBrand.findOne({ name: data.name, _id: { $ne: id } });
      if (duplicate) {
        throw new ApiError(400, 'Brand name already exists');
      }
    }

    Object.assign(brand, data);
    await brand.save();
    
    return brand;
  }

  async deleteOilBrand(id: string): Promise<void> {
    const brand = await OilBrand.findById(id);
    
    if (!brand) {
      throw new ApiError(404, 'Brand not found');
    }

    await brand.deleteOne();
  }
}
