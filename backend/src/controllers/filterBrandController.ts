import { Response, NextFunction } from 'express';
import { FilterBrandService } from '../services/filterBrandService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

const filterBrandService = new FilterBrandService();

export class FilterBrandController {
  async createFilterBrand(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const brand = await filterBrandService.createFilterBrand(tenantId, req.body);
      res.status(201).json(ApiResponse.success('Filter brand created', brand));
    } catch (error) {
      next(error);
    }
  }

  async getAllFilterBrands(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const activeOnly = req.query.activeOnly === 'true';
      const brands = await filterBrandService.getAllFilterBrands(tenantId, activeOnly);
      res.status(200).json(ApiResponse.success('Filter brands retrieved', brands));
    } catch (error) {
      next(error);
    }
  }

  async getFilterBrandById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const brand = await filterBrandService.getFilterBrandById(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Filter brand retrieved', brand));
    } catch (error) {
      next(error);
    }
  }

  async updateFilterBrand(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const brand = await filterBrandService.updateFilterBrand(tenantId, req.params.id, req.body);
      res.status(200).json(ApiResponse.success('Filter brand updated', brand));
    } catch (error) {
      next(error);
    }
  }

  async toggleFilterBrandStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const brand = await filterBrandService.toggleFilterBrandStatus(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Filter brand status toggled', brand));
    } catch (error) {
      next(error);
    }
  }

  async deleteFilterBrand(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      await filterBrandService.deleteFilterBrand(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Filter brand deleted'));
    } catch (error) {
      next(error);
    }
  }
}
