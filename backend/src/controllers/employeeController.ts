import { Response, NextFunction } from 'express';
import { EmployeeService } from '../services/employeeService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

const employeeService = new EmployeeService();

export class EmployeeController {
  async createEmployee(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const employee = await employeeService.createEmployee(tenantId, req.body);
      res.status(201).json(ApiResponse.success('Employee created successfully', employee));
    } catch (error) {
      next(error);
    }
  }

  async getAllEmployees(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const employees = await employeeService.getAllEmployeesWithStats(tenantId);
      res.status(200).json(ApiResponse.success('Employees retrieved', employees));
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const employee = await employeeService.getEmployeeWithPerformance(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Employee retrieved', employee));
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const stats = await employeeService.getEmployeeStats(tenantId);
      res.status(200).json(ApiResponse.success('Employee statistics retrieved', stats));
    } catch (error) {
      next(error);
    }
  }

  async getEmployeePerformance(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const performance = await employeeService.getEmployeePerformance(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Employee performance retrieved', performance));
    } catch (error) {
      next(error);
    }
  }

  async updateEmployee(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const employee = await employeeService.updateEmployee(tenantId, req.params.id, req.body);
      res.status(200).json(ApiResponse.success('Employee updated successfully', employee));
    } catch (error) {
      next(error);
    }
  }

  async toggleEmployeeStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const employee = await employeeService.toggleEmployeeStatus(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Employee status toggled', employee));
    } catch (error) {
      next(error);
    }
  }

  async deleteEmployee(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { reason } = req.body;
      await employeeService.archiveEmployee(tenantId, req.params.id, userId, reason);
      res.status(200).json(ApiResponse.success('Employee deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getArchivedEmployees(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const result = await employeeService.getArchivedEmployees(tenantId, page, limit);
      res.status(200).json(ApiResponse.success('Archived employees retrieved', result.data, {
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        totalItems: result.totalItems
      }));
    } catch (error) {
      next(error);
    }
  }

  async restoreEmployee(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const employee = await employeeService.restoreEmployee(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Employee restored successfully', employee));
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeStatistics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const statistics = await employeeService.getEmployeeStatistics(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Employee statistics retrieved', statistics));
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeServices(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { startDate, endDate, serviceType, paymentStatus, page, limit } = req.query;

      const filters: any = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20
      };

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (serviceType) filters.serviceType = serviceType;
      if (paymentStatus) filters.paymentStatus = paymentStatus;

      const result = await employeeService.getEmployeeServices(tenantId, req.params.id, filters);
      res.status(200).json(ApiResponse.success('Employee services retrieved', result));
    } catch (error) {
      next(error);
    }
  }

  async getTotalEmployeeDebt(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const result = await employeeService.getTotalEmployeeDebt(tenantId);
      res.status(200).json(ApiResponse.success('Total employee debt retrieved', result));
    } catch (error) {
      next(error);
    }
  }
}
