import { Response, NextFunction } from 'express';
import { OilProductService } from '../services/oilProductService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

const oilProductService = new OilProductService();

export class OilProductController {
  async createOilProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const oilProduct = await oilProductService.createOilProduct(tenantId, req.body);
      res.status(201).json(ApiResponse.success('Oil product created', oilProduct));
    } catch (error) {
      next(error);
    }
  }

  async getAllOilProducts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const activeOnly = req.query.activeOnly === 'true';
      const brandId = req.query.brandId as string;
      const oilProducts = await oilProductService.getAllOilProducts(tenantId, activeOnly, brandId);
      res.status(200).json(ApiResponse.success('Oil products retrieved', oilProducts));
    } catch (error) {
      next(error);
    }
  }

  async getOilProductById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const oilProduct = await oilProductService.getOilProductById(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Oil product retrieved', oilProduct));
    } catch (error) {
      next(error);
    }
  }

  async updateOilProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const oilProduct = await oilProductService.updateOilProduct(tenantId, req.params.id, req.body);
      res.status(200).json(ApiResponse.success('Oil product updated', oilProduct));
    } catch (error) {
      next(error);
    }
  }

  async deleteOilProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      await oilProductService.deleteOilProduct(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Oil product deleted'));
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { quantity } = req.body;
      const oilProduct = await oilProductService.updateStock(tenantId, req.params.id, quantity);
      res.status(200).json(ApiResponse.success('Stock updated', oilProduct));
    } catch (error) {
      next(error);
    }
  }

  async getLowStockProducts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const threshold = parseInt(req.query.threshold as string) || 10;
      const products = await oilProductService.getLowStockProducts(tenantId, threshold);
      res.status(200).json(ApiResponse.success('Low stock products retrieved', products));
    } catch (error) {
      next(error);
    }
  }
}
