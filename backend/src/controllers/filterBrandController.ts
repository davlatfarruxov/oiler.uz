import { Response, NextFunction } from 'express';
import { FilterBrandService } from '../services/filterBrandService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

const filterBrandService = new FilterBrandService();

export class FilterBrandController {
  async createFilterBrand(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await filterBrandService.createFilterBrand(req.body);
      res.status(201).json(ApiResponse.success('Filter brand created', brand));
    } catch (error) {
      next(error);
    }
  }

  async getAllFilterBrands(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const brands = await filterBrandService.getAllFilterBrands(activeOnly);
      res.status(200).json(ApiResponse.success('Filter brands retrieved', brands));
    } catch (error) {
      next(error);
    }
  }

  async getFilterBrandById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await filterBrandService.getFilterBrandById(req.params.id);
      res.status(200).json(ApiResponse.success('Filter brand retrieved', brand));
    } catch (error) {
      next(error);
    }
  }

  async updateFilterBrand(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await filterBrandService.updateFilterBrand(req.params.id, req.body);
      res.status(200).json(ApiResponse.success('Filter brand updated', brand));
    } catch (error) {
      next(error);
    }
  }

  async toggleFilterBrandStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await filterBrandService.toggleFilterBrandStatus(req.params.id);
      res.status(200).json(ApiResponse.success('Filter brand status toggled', brand));
    } catch (error) {
      next(error);
    }
  }

  async deleteFilterBrand(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await filterBrandService.deleteFilterBrand(req.params.id);
      res.status(200).json(ApiResponse.success('Filter brand deleted'));
    } catch (error) {
      next(error);
    }
  }
}
