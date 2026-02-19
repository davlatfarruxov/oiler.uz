import { Response, NextFunction } from 'express';
import { FilterService } from '../services/filterService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest, FilterType } from '../types';

const filterService = new FilterService();

export class FilterController {
  async createFilter(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const filter = await filterService.createFilter(tenantId, req.body);
      res.status(201).json(ApiResponse.success('Filter created', filter));
    } catch (error) {
      next(error);
    }
  }

  async getAllFilters(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const activeOnly = req.query.activeOnly === 'true';
      const filterType = req.query.filterType as FilterType;
      const brandId = req.query.brandId as string;
      const filters = await filterService.getAllFilters(tenantId, activeOnly, filterType, brandId);
      res.status(200).json(ApiResponse.success('Filters retrieved', filters));
    } catch (error) {
      next(error);
    }
  }

  async getFilterById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const filter = await filterService.getFilterById(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Filter retrieved', filter));
    } catch (error) {
      next(error);
    }
  }

  async updateFilter(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const filter = await filterService.updateFilter(tenantId, req.params.id, req.body);
      res.status(200).json(ApiResponse.success('Filter updated', filter));
    } catch (error) {
      next(error);
    }
  }

  async deleteFilter(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      await filterService.deleteFilter(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Filter deleted'));
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { quantity } = req.body;
      const filter = await filterService.updateStock(tenantId, req.params.id, quantity);
      res.status(200).json(ApiResponse.success('Stock updated', filter));
    } catch (error) {
      next(error);
    }
  }

  async getLowStockFilters(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const threshold = parseInt(req.query.threshold as string) || 10;
      const filters = await filterService.getLowStockFilters(tenantId, threshold);
      res.status(200).json(ApiResponse.success('Low stock filters retrieved', filters));
    } catch (error) {
      next(error);
    }
  }
}
