import { Response, NextFunction } from 'express';
import { VehicleService } from '../services/vehicleService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

const vehicleService = new VehicleService();

export class VehicleController {
  async createVehicle(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const vehicle = await vehicleService.createVehicle(tenantId, req.body, userId);
      res.status(201).json(ApiResponse.success('Vehicle created successfully', vehicle));
    } catch (error) {
      next(error);
    }
  }

  async getAllVehicles(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const query = req.query.search as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await vehicleService.getAllVehicles(tenantId, query, page, limit);
      res.status(200).json(ApiResponse.success('Vehicles retrieved', result.data, {
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        totalItems: result.totalItems
      }));
    } catch (error) {
      next(error);
    }
  }

  async getVehicleById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const vehicle = await vehicleService.getVehicleById(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Vehicle retrieved', vehicle));
    } catch (error) {
      next(error);
    }
  }

  async updateVehicle(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const vehicle = await vehicleService.updateVehicle(tenantId, req.params.id, req.body, userId);
      res.status(200).json(ApiResponse.success('Vehicle updated successfully', vehicle));
    } catch (error) {
      next(error);
    }
  }

  async archiveVehicle(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { reason } = req.body;
      await vehicleService.archiveVehicle(tenantId, req.params.id, userId, reason);
      res.status(200).json(ApiResponse.success('Vehicle archived successfully'));
    } catch (error) {
      next(error);
    }
  }

  async restoreVehicle(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const vehicle = await vehicleService.restoreVehicle(tenantId, req.params.id, userId);
      res.status(200).json(ApiResponse.success('Vehicle restored successfully', vehicle));
    } catch (error) {
      next(error);
    }
  }

  async getVehicleHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const history = await vehicleService.getVehicleHistory(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Vehicle history retrieved', history));
    } catch (error) {
      next(error);
    }
  }

  async deleteVehicle(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      await vehicleService.deleteVehicle(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Vehicle deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getVehiclesCount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const count = await vehicleService.getVehiclesCount(tenantId);
      res.status(200).json(ApiResponse.success('Vehicle count retrieved', { count }));
    } catch (error) {
      next(error);
    }
  }

  async searchByPlateNumber(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { plateNumber } = req.params;
      const vehicle = await vehicleService.searchByPlateNumber(tenantId, plateNumber);
      
      if (!vehicle) {
        res.status(404).json(ApiResponse.error('Vehicle not found'));
        return;
      }

      res.status(200).json(ApiResponse.success('Vehicle found', vehicle));
    } catch (error) {
      next(error);
    }
  }

  async getVehicleWithHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const data = await vehicleService.getVehicleWithHistory(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Vehicle history retrieved', data));
    } catch (error) {
      next(error);
    }
  }

  async getArchivedVehicles(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const result = await vehicleService.getArchivedVehicles(tenantId, page, limit);
      res.status(200).json(ApiResponse.success('Archived vehicles retrieved', result.data, {
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        totalItems: result.totalItems
      }));
    } catch (error) {
      next(error);
    }
  }

  async getUnifiedVehicleHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const history = await vehicleService.getUnifiedVehicleHistory(tenantId, req.params.id);
      res.status(200).json(ApiResponse.success('Unified vehicle history retrieved', history));
    } catch (error) {
      next(error);
    }
  }
}
