import Inventory, { IInventoryDocument } from '../models/Inventory';
import { ApiError } from '../utils/ApiError';
import { ProductType } from '../types';

interface CreateInventoryData {
  productType: ProductType;
  name: string;
  stock: number;
  reorderLevel: number;
  costPrice?: number;
  costCurrency?: 'USD' | 'UZS';
  price: number;
}

export class InventoryService {
  async createItem(tenantId: string, data: CreateInventoryData): Promise<IInventoryDocument> {
    // Check if item with same name already exists for this tenant
    const existingItem = await Inventory.findOne({ 
      tenant: tenantId,
      name: { $regex: new RegExp(`^${data.name}$`, 'i') },
      productType: data.productType 
    });
    
    if (existingItem) {
      throw new ApiError(409, 'Item with this name already exists');
    }

    const item = await Inventory.create({
      tenant: tenantId,
      ...data
    });
    return item;
  }

  async getAllItems(tenantId: string): Promise<IInventoryDocument[]> {
    return Inventory.find({ tenant: tenantId }).sort({ productType: 1, name: 1 });
  }

  async getLowStockItems(tenantId: string): Promise<IInventoryDocument[]> {
    // Find items where stock <= reorderLevel for this tenant
    return Inventory.find({
      tenant: tenantId,
      $expr: { $lte: ['$stock', '$reorderLevel'] }
    }).sort({ stock: 1 });
  }

  async getItemById(tenantId: string, itemId: string): Promise<IInventoryDocument> {
    const item = await Inventory.findOne({ _id: itemId, tenant: tenantId });
    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }
    return item;
  }

  async updateItem(tenantId: string, itemId: string, data: Partial<CreateInventoryData>): Promise<IInventoryDocument> {
    // Check if updating name conflicts with existing item
    if (data.name) {
      const existingItem = await Inventory.findOne({
        tenant: tenantId,
        _id: { $ne: itemId },
        name: { $regex: new RegExp(`^${data.name}$`, 'i') },
        productType: data.productType
      });

      if (existingItem) {
        throw new ApiError(409, 'Item with this name already exists');
      }
    }

    const item = await Inventory.findOneAndUpdate(
      { _id: itemId, tenant: tenantId },
      data,
      { new: true, runValidators: true }
    );

    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }

    return item;
  }

  async deleteItem(tenantId: string, itemId: string): Promise<void> {
    const item = await Inventory.findOneAndDelete({ _id: itemId, tenant: tenantId });
    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }
  }

  async updateStock(tenantId: string, itemId: string, quantity: number, operation: 'add' | 'subtract'): Promise<IInventoryDocument> {
    const item = await Inventory.findOne({ _id: itemId, tenant: tenantId });
    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }

    if (operation === 'add') {
      item.stock += quantity;
    } else if (operation === 'subtract') {
      if (item.stock < quantity) {
        throw new ApiError(400, 'Insufficient stock');
      }
      item.stock -= quantity;
    }

    await item.save();
    return item;
  }

  async getItemsByType(tenantId: string, productType: ProductType): Promise<IInventoryDocument[]> {
    return Inventory.find({ tenant: tenantId, productType }).sort({ name: 1 });
  }

  async checkAndGetLowStockAlerts(tenantId: string): Promise<IInventoryDocument[]> {
    return this.getLowStockItems(tenantId);
  }

  async bulkImport(tenantId: string, rows: CreateInventoryData[]): Promise<{ created: number; skipped: number; errors: { row: number; name: string; reason: string }[] }> {
    let created = 0;
    let skipped = 0;
    const errors: { row: number; name: string; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const data = rows[i];
      try {
        const existing = await Inventory.findOne({
          tenant: tenantId,
          name: { $regex: new RegExp(`^${data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          productType: data.productType,
        });
        if (existing) {
          skipped++;
          continue;
        }
        await Inventory.create({ tenant: tenantId, ...data });
        created++;
      } catch {
        errors.push({ row: i + 2, name: data.name, reason: 'Saqlashda xatolik' });
      }
    }

    return { created, skipped, errors };
  }
}
