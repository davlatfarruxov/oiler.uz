import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventoryService';
import { ApiResponse } from '../utils/ApiResponse';

const inventoryService = new InventoryService();

export class InventoryController {
  async createItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await inventoryService.createItem(req.body);
      res.status(201).json(ApiResponse.success('Inventory item created successfully', item));
    } catch (error) {
      next(error);
    }
  }

  async getAllItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await inventoryService.getAllItems();
      res.status(200).json(ApiResponse.success('Inventory items retrieved', items));
    } catch (error) {
      next(error);
    }
  }

  async getLowStockItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await inventoryService.getLowStockItems();
      res.status(200).json(ApiResponse.success('Low stock items retrieved', items));
    } catch (error) {
      next(error);
    }
  }

  async getItemById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await inventoryService.getItemById(req.params.id);
      res.status(200).json(ApiResponse.success('Inventory item retrieved', item));
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await inventoryService.updateItem(req.params.id, req.body);
      res.status(200).json(ApiResponse.success('Inventory item updated successfully', item));
    } catch (error) {
      next(error);
    }
  }

  async deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await inventoryService.deleteItem(req.params.id);
      res.status(200).json(ApiResponse.success('Inventory item deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { quantity, operation } = req.body;
      const item = await inventoryService.updateStock(req.params.id, quantity, operation);
      res.status(200).json(ApiResponse.success('Stock updated successfully', item));
    } catch (error) {
      next(error);
    }
  }
}
