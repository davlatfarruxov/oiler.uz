import { Response, NextFunction } from 'express';
import { VehicleService } from '../services/vehicleService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

const vehicleService = new VehicleService();

export class VehicleController {
  async createVehicle(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicle = await vehicleService.createVehicle(req.body);
      res.status(201).json(ApiResponse.success('Vehicle created successfully', vehicle));
    } catch (error) {
      next(error);
    }
  }

  async getAllVehicles(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query.search as string;
      const vehicles = await vehicleService.getAllVehicles(query);
      res.status(200).json(ApiResponse.success('Vehicles retrieved', vehicles));
    } catch (error) {
      next(error);
    }
  }

  async getVehicleById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicle = await vehicleService.getVehicleById(req.params.id);
      res.status(200).json(ApiResponse.success('Vehicle retrieved', vehicle));
    } catch (error) {
      next(error);
    }
  }

  async updateVehicle(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
      res.status(200).json(ApiResponse.success('Vehicle updated successfully', vehicle));
    } catch (error) {
      next(error);
    }
  }

  async deleteVehicle(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await vehicleService.deleteVehicle(req.params.id);
      res.status(200).json(ApiResponse.success('Vehicle deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getVehiclesCount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await vehicleService.getVehiclesCount();
      res.status(200).json(ApiResponse.success('Vehicle count retrieved', { count }));
    } catch (error) {
      next(error);
    }
  }

  async searchByPlateNumber(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plateNumber } = req.params;
      const vehicle = await vehicleService.searchByPlateNumber(plateNumber);
      
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
      const data = await vehicleService.getVehicleWithHistory(req.params.id);
      res.status(200).json(ApiResponse.success('Vehicle history retrieved', data));
    } catch (error) {
      next(error);
    }
  }
}
