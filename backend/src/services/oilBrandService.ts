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
  async createOilBrand(tenantId: string, data: CreateOilBrandData): Promise<IOilBrand> {
    const existingBrand = await OilBrand.findOne({ tenant: tenantId, name: data.name });
    
    if (existingBrand) {
      throw new ApiError(400, 'Brand already exists');
    }

    const brand = await OilBrand.create({
      tenant: tenantId,
      ...data
    });
    return brand;
  }

  async getAllOilBrands(tenantId: string, activeOnly: boolean = false): Promise<IOilBrand[]> {
    const filter: any = { tenant: tenantId };
    if (activeOnly) {
      filter.active = true;
    }
    return OilBrand.find(filter).sort({ name: 1 });
  }

  async getOilBrandById(tenantId: string, id: string): Promise<IOilBrand> {
    const brand = await OilBrand.findOne({ _id: id, tenant: tenantId });
    
    if (!brand) {
      throw new ApiError(404, 'Brand not found');
    }
    
    return brand;
  }

  async updateOilBrand(tenantId: string, id: string, data: UpdateOilBrandData): Promise<IOilBrand> {
    const brand = await OilBrand.findOne({ _id: id, tenant: tenantId });
    
    if (!brand) {
      throw new ApiError(404, 'Brand not found');
    }

    if (data.name && data.name !== brand.name) {
      const duplicate = await OilBrand.findOne({ tenant: tenantId, name: data.name, _id: { $ne: id } });
      if (duplicate) {
        throw new ApiError(400, 'Brand name already exists');
      }
    }

    Object.assign(brand, data);
    await brand.save();
    
    return brand;
  }

  async deleteOilBrand(tenantId: string, id: string): Promise<void> {
    const brand = await OilBrand.findOne({ _id: id, tenant: tenantId });
    
    if (!brand) {
      throw new ApiError(404, 'Brand not found');
    }

    await brand.deleteOne();
  }
}
