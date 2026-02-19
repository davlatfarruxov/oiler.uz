import OilProduct, { IOilProduct } from '../models/OilProduct';
import OilBrand from '../models/OilBrand';
import Settings from '../models/Settings';
import { ApiError } from '../utils/ApiError';

interface CreateOilProductData {
  brandId: string;
  viscosity: string;
  apiGrade: string;
  volume: number;
  costPrice: number;
  costCurrency: 'USD' | 'UZS';
  price: number; // Sale price in UZS
  stock: number;
  reorderLevel?: number;
}

interface UpdateOilProductData {
  brandId?: string;
  viscosity?: string;
  apiGrade?: string;
  volume?: number;
  costPrice?: number;
  costCurrency?: 'USD' | 'UZS';
  price?: number;
  stock?: number;
  reorderLevel?: number;
  active?: boolean;
}

export class OilProductService {
  async createOilProduct(tenantId: string, data: CreateOilProductData): Promise<IOilProduct> {
    // Check if brand exists and belongs to tenant
    const brand = await OilBrand.findOne({ _id: data.brandId, tenant: tenantId });
    if (!brand) {
      throw new ApiError(404, 'Brand not found');
    }

    // Get current exchange rate from tenant settings
    let settings = await Settings.findOne({ tenant: tenantId });
    if (!settings) {
      settings = await Settings.create({ tenant: tenantId });
    }
    const exchangeRate = settings.exchangeRate;

    // Check if product already exists for this tenant
    const existingProduct = await OilProduct.findOne({
      tenant: tenantId,
      brand: data.brandId,
      viscosity: data.viscosity,
      apiGrade: data.apiGrade,
      volume: data.volume
    });

    if (existingProduct) {
      throw new ApiError(400, 'Oil product with these specifications already exists');
    }

    const oilProduct = await OilProduct.create({
      tenant: tenantId,
      brand: data.brandId,
      viscosity: data.viscosity,
      apiGrade: data.apiGrade,
      volume: data.volume,
      costPrice: data.costPrice,
      costCurrency: data.costCurrency,
      exchangeRateUsed: exchangeRate,
      price: data.price,
      stock: data.stock,
      reorderLevel: data.reorderLevel || 10
    });

    return oilProduct.populate('brand');
  }

  async getAllOilProducts(tenantId: string, activeOnly: boolean = false, brandId?: string): Promise<any[]> {
    const filter: any = { tenant: tenantId };
    if (activeOnly) {
      filter.active = true;
    }
    if (brandId) {
      filter.brand = brandId;
    }
    
    const products = await OilProduct.find(filter)
      .populate('brand', 'name _id')
      .sort({ brand: 1, viscosity: 1, volume: 1 });
    
    // Convert to plain objects with brand as string
    return products.map(p => {
      const brand = p.brand as any;
      const brandName = brand?.name || 'Unknown';
      return {
        _id: p._id.toString(),
        brand: brandName, // Return as string, not object
        brandId: brand?._id?.toString(),
        viscosity: p.viscosity,
        apiGrade: p.apiGrade,
        volume: p.volume,
        costPrice: p.costPrice,
        costCurrency: p.costCurrency,
        exchangeRateUsed: p.exchangeRateUsed,
        price: p.price,
        stock: p.stock,
        reorderLevel: p.reorderLevel,
        active: p.active,
        displayName: `${brandName} ${p.viscosity} ${p.apiGrade} ${p.volume}L`
      };
    });
  }

  async getOilProductById(tenantId: string, id: string): Promise<IOilProduct> {
    const oilProduct = await OilProduct.findOne({ _id: id, tenant: tenantId }).populate('brand');
    
    if (!oilProduct) {
      throw new ApiError(404, 'Oil product not found');
    }
    
    return oilProduct;
  }

  async updateOilProduct(tenantId: string, id: string, data: UpdateOilProductData): Promise<IOilProduct> {
    const oilProduct = await OilProduct.findOne({ _id: id, tenant: tenantId });
    
    if (!oilProduct) {
      throw new ApiError(404, 'Oil product not found');
    }

    // If updating brand, check if it exists and belongs to tenant
    if (data.brandId) {
      const brand = await OilBrand.findOne({ _id: data.brandId, tenant: tenantId });
      if (!brand) {
        throw new ApiError(404, 'Brand not found');
      }
    }

    // If updating specifications, check for duplicates within tenant
    if (data.brandId || data.viscosity || data.apiGrade || data.volume) {
      const checkData = {
        tenant: tenantId,
        brand: data.brandId || oilProduct.brand,
        viscosity: data.viscosity || oilProduct.viscosity,
        apiGrade: data.apiGrade || oilProduct.apiGrade,
        volume: data.volume || oilProduct.volume
      };

      const duplicate = await OilProduct.findOne({
        ...checkData,
        _id: { $ne: id }
      });

      if (duplicate) {
        throw new ApiError(400, 'Oil product with these specifications already exists');
      }
    }

    if (data.brandId) {
      oilProduct.brand = data.brandId as any;
    }
    if (data.viscosity) oilProduct.viscosity = data.viscosity;
    if (data.apiGrade) oilProduct.apiGrade = data.apiGrade;
    if (data.volume) oilProduct.volume = data.volume;
    if (data.costPrice !== undefined) oilProduct.costPrice = data.costPrice;
    if (data.costCurrency) oilProduct.costCurrency = data.costCurrency;
    if (data.price !== undefined) oilProduct.price = data.price;
    if (data.stock !== undefined) oilProduct.stock = data.stock;
    if (data.reorderLevel !== undefined) oilProduct.reorderLevel = data.reorderLevel;
    if (data.active !== undefined) oilProduct.active = data.active;
    
    // Update exchange rate if cost currency or price changed
    if (data.costPrice !== undefined || data.costCurrency) {
      const settings = await Settings.findOne({ tenant: tenantId });
      if (settings) {
        oilProduct.exchangeRateUsed = settings.exchangeRate;
      }
    }

    await oilProduct.save();
    
    return oilProduct.populate('brand');
  }

  async deleteOilProduct(tenantId: string, id: string): Promise<void> {
    const oilProduct = await OilProduct.findOne({ _id: id, tenant: tenantId });
    
    if (!oilProduct) {
      throw new ApiError(404, 'Oil product not found');
    }

    await oilProduct.deleteOne();
  }

  async updateStock(tenantId: string, id: string, quantity: number): Promise<IOilProduct> {
    const oilProduct = await OilProduct.findOne({ _id: id, tenant: tenantId });
    
    if (!oilProduct) {
      throw new ApiError(404, 'Oil product not found');
    }

    oilProduct.stock += quantity;
    
    if (oilProduct.stock < 0) {
      throw new ApiError(400, 'Insufficient stock');
    }

    await oilProduct.save();
    return oilProduct;
  }

  async getLowStockProducts(tenantId: string, threshold: number = 10): Promise<IOilProduct[]> {
    return OilProduct.find({
      tenant: tenantId,
      active: true,
      stock: { $lte: threshold }
    })
      .populate('brand', 'name')
      .lean()
      .sort({ stock: 1 });
  }
}
