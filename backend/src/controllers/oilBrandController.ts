import { Response, NextFunction } from 'express';
import { OilBrandService } from '../services/oilBrandService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

const oilBrandService = new OilBrandService();

export class OilBrandController {
  async createOilBrand(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const brand = await oilBrandService.createOilBrand(tenantId, req.body);
      res.status(201).json(ApiResponse.success('Oil brand created', brand));
    } catch (error) {
      next(error);
    }
  }

  async getAllOilBrands(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const activeOnly = req.query.activeOnly === 'true';
      const brands = await oilBrandService.getAllOilBrands(tenantId, activeOnly);
      res.status(200).json(ApiResponse.success('Oil brands retrieved', brands));
    } catch (error) {
      next(error);
    }
  }

  async getOilBrandById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const brand = await oilBrandService.getOilBrandById(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Oil brand retrieved', brand));
    } catch (error) {
      next(error);
    }
  }

  async updateOilBrand(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const brand = await oilBrandService.updateOilBrand(tenantId, req.params.id, req.body);
      res.status(200).json(ApiResponse.success('Oil brand updated', brand));
    } catch (error) {
      next(error);
    }
  }

  async deleteOilBrand(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      await oilBrandService.deleteOilBrand(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Oil brand deleted'));
    } catch (error) {
      next(error);
    }
  }
}
