import { Response, NextFunction } from 'express';
import { OilChangeService } from '../services/oilChangeService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

const oilChangeService = new OilChangeService();

export class OilChangeController {
  async createOilChange(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const oilChange = await oilChangeService.createOilChange(req.body);
      res.status(201).json(ApiResponse.success('Oil change service created', oilChange));
    } catch (error) {
      next(error);
    }
  }

  async getAllOilChanges(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const oilChanges = await oilChangeService.getAllOilChanges();
      res.status(200).json(ApiResponse.success('Oil changes retrieved', oilChanges));
    } catch (error) {
      next(error);
    }
  }

  async getTodayCount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await oilChangeService.getTodayCount();
      res.status(200).json(ApiResponse.success('Today count retrieved', { count }));
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyRevenue(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const revenue = await oilChangeService.getMonthlyRevenue();
      res.status(200).json(ApiResponse.success('Monthly revenue retrieved', { revenue }));
    } catch (error) {
      next(error);
    }
  }

  async getRecentServices(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const services = await oilChangeService.getRecentServices(limit);
      res.status(200).json(ApiResponse.success('Recent services retrieved', services));
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeCommissions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employeeId } = req.params;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const commissions = await oilChangeService.getEmployeeCommissions(employeeId, startDate, endDate);
      res.status(200).json(ApiResponse.success('Employee commissions retrieved', commissions));
    } catch (error) {
      next(error);
    }
  }
}
