import Inventory, { IInventoryDocument } from '../models/Inventory';
import { ApiError } from '../utils/ApiError';
import { ProductType } from '../types';

interface CreateInventoryData {
  productType: ProductType;
  name: string;
  stock: number;
  reorderLevel: number;
  price: number;
}

export class InventoryService {
  async createItem(data: CreateInventoryData): Promise<IInventoryDocument> {
    // Check if item with same name already exists
    const existingItem = await Inventory.findOne({ 
      name: { $regex: new RegExp(`^${data.name}$`, 'i') },
      productType: data.productType 
    });
    
    if (existingItem) {
      throw new ApiError(409, 'Item with this name already exists');
    }

    const item = await Inventory.create(data);
    return item;
  }

  async getAllItems(): Promise<IInventoryDocument[]> {
    return Inventory.find().sort({ productType: 1, name: 1 });
  }

  async getLowStockItems(): Promise<IInventoryDocument[]> {
    // Find items where stock <= reorderLevel
    return Inventory.find({
      $expr: { $lte: ['$stock', '$reorderLevel'] }
    }).sort({ stock: 1 });
  }

  async getItemById(itemId: string): Promise<IInventoryDocument> {
    const item = await Inventory.findById(itemId);
    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }
    return item;
  }

  async updateItem(itemId: string, data: Partial<CreateInventoryData>): Promise<IInventoryDocument> {
    // Check if updating name conflicts with existing item
    if (data.name) {
      const existingItem = await Inventory.findOne({
        _id: { $ne: itemId },
        name: { $regex: new RegExp(`^${data.name}$`, 'i') },
        productType: data.productType
      });

      if (existingItem) {
        throw new ApiError(409, 'Item with this name already exists');
      }
    }

    const item = await Inventory.findByIdAndUpdate(
      itemId,
      data,
      { new: true, runValidators: true }
    );

    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }

    return item;
  }

  async deleteItem(itemId: string): Promise<void> {
    const item = await Inventory.findByIdAndDelete(itemId);
    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }
  }

  async updateStock(itemId: string, quantity: number, operation: 'add' | 'subtract'): Promise<IInventoryDocument> {
    const item = await Inventory.findById(itemId);
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

  async getItemsByType(productType: ProductType): Promise<IInventoryDocument[]> {
    return Inventory.find({ productType }).sort({ name: 1 });
  }

  async checkAndGetLowStockAlerts(): Promise<IInventoryDocument[]> {
    return this.getLowStockItems();
  }
}
