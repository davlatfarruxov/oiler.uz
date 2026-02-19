import { Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventoryService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

const inventoryService = new InventoryService();

export class InventoryController {
  async createItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const item = await inventoryService.createItem(tenantId, req.body);
      res.status(201).json(ApiResponse.success('Inventory item created successfully', item));
    } catch (error) {
      next(error);
    }
  }

  async getAllItems(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const items = await inventoryService.getAllItems(tenantId);
      res.status(200).json(ApiResponse.success('Inventory items retrieved', items));
    } catch (error) {
      next(error);
    }
  }

  async getLowStockItems(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const items = await inventoryService.getLowStockItems(tenantId);
      res.status(200).json(ApiResponse.success('Low stock items retrieved', items));
    } catch (error) {
      next(error);
    }
  }

  async getItemById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const item = await inventoryService.getItemById(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Inventory item retrieved', item));
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const item = await inventoryService.updateItem(tenantId, req.params.id, req.body);
      res.status(200).json(ApiResponse.success('Inventory item updated successfully', item));
    } catch (error) {
      next(error);
    }
  }

  async deleteItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      await inventoryService.deleteItem(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Inventory item deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { quantity, operation } = req.body;
      const item = await inventoryService.updateStock(tenantId, req.params.id, quantity, operation);
      res.status(200).json(ApiResponse.success('Stock updated successfully', item));
    } catch (error) {
      next(error);
    }
  }
}
