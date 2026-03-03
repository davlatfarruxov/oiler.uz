import { Response, NextFunction } from 'express';
import { OilChangeService } from '../services/oilChangeService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

const oilChangeService = new OilChangeService();

export class OilChangeController {
  async createOilChange(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const oilChange = await oilChangeService.createOilChange(tenantId, req.body);
      res.status(201).json(ApiResponse.success('Oil change service created', oilChange));
    } catch (error) {
      next(error);
    }
  }

  async getAllOilChanges(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await oilChangeService.getAllOilChanges(tenantId, page, limit);
      res.status(200).json(ApiResponse.success('Oil changes retrieved', result.data, {
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        totalItems: result.totalItems
      }));
    } catch (error) {
      next(error);
    }
  }

  async getOilChangeById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const oilChange = await oilChangeService.getOilChangeById(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Oil change retrieved', oilChange));
    } catch (error) {
      next(error);
    }
  }

  async getTodayCount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const count = await oilChangeService.getTodayCount(tenantId);
      res.status(200).json(ApiResponse.success('Today count retrieved', { count }));
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyRevenue(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const revenue = await oilChangeService.getMonthlyRevenue(tenantId);
      res.status(200).json(ApiResponse.success('Monthly revenue retrieved', { revenue }));
    } catch (error) {
      next(error);
    }
  }

  async getRecentServices(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const limit = parseInt(req.query.limit as string) || 5;
      const services = await oilChangeService.getRecentServices(tenantId, limit);
      res.status(200).json(ApiResponse.success('Recent services retrieved', services));
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeCommissions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { employeeId } = req.params;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const commissions = await oilChangeService.getEmployeeCommissions(tenantId, employeeId, startDate, endDate);
      res.status(200).json(ApiResponse.success('Employee commissions retrieved', commissions));
    } catch (error) {
      next(error);
    }
  }

  async archiveOilChange(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('Archive request user:', req.user);
      console.log('Archive request params:', req.params);
      console.log('Archive request body:', req.body);
      
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { reason } = req.body;
      
      console.log('Calling archiveOilChange with:', { tenantId, userId, oilChangeId: req.params.id, reason });
      
      await oilChangeService.archiveOilChange(tenantId, req.params.id, userId, reason);
      res.status(200).json(ApiResponse.success('Oil change archived successfully'));
    } catch (error) {
      console.error('Archive error:', error);
      next(error);
    }
  }

  async restoreOilChange(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const oilChange = await oilChangeService.restoreOilChange(tenantId, req.params.id, userId);
      res.status(200).json(ApiResponse.success('Oil change restored successfully', oilChange));
    } catch (error) {
      next(error);
    }
  }

  async getOilChangeHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const history = await oilChangeService.getOilChangeHistory(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Oil change history retrieved', history));
    } catch (error) {
      next(error);
    }
  }

  async updateOilChange(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const oilChange = await oilChangeService.updateOilChange(tenantId, req.params.id, req.body, userId);
      res.status(200).json(ApiResponse.success('Oil change updated successfully', oilChange));
    } catch (error) {
      next(error);
    }
  }

  async getArchivedOilChanges(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const result = await oilChangeService.getArchivedOilChanges(tenantId, page, limit);
      res.status(200).json(ApiResponse.success('Archived oil changes retrieved', result.data, {
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        totalItems: result.totalItems
      }));
    } catch (error) {
      next(error);
    }
  }

  async completeOilChange(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const oilChange = await oilChangeService.completeOilChange(tenantId, req.params.id, userId);
      res.status(200).json(ApiResponse.success('Oil change completed successfully', oilChange));
    } catch (error) {
      next(error);
    }
  }

  async getOilChangeByIdPublic(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const oilChange = await oilChangeService.getOilChangeByIdPublic(req.params.id);
      res.status(200).json(ApiResponse.success('Oil change retrieved', oilChange));
    } catch (error) {
      next(error);
    }
  }
}
