import { Request, Response, NextFunction } from 'express';
import { ServiceService } from '../services/serviceService';
import { ApiResponse } from '../utils/ApiResponse';

const serviceService = new ServiceService();

export class ServiceController {
  async createService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await serviceService.createService(req.body);
      res.status(201).json(ApiResponse.success('Service created successfully', service));
    } catch (error) {
      next(error);
    }
  }

  async getAllServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeOnly = req.query.activeOnly !== 'false';
      const services = await serviceService.getAllServices(activeOnly);
      res.status(200).json(ApiResponse.success('Services retrieved', services));
    } catch (error) {
      next(error);
    }
  }

  async getServiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await serviceService.getServiceById(req.params.id);
      res.status(200).json(ApiResponse.success('Service retrieved', service));
    } catch (error) {
      next(error);
    }
  }

  async updateService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await serviceService.updateService(req.params.id, req.body);
      res.status(200).json(ApiResponse.success('Service updated successfully', service));
    } catch (error) {
      next(error);
    }
  }

  async toggleServiceStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await serviceService.toggleServiceStatus(req.params.id);
      res.status(200).json(ApiResponse.success('Service status toggled', service));
    } catch (error) {
      next(error);
    }
  }

  async deleteService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await serviceService.deleteService(req.params.id);
      res.status(200).json(ApiResponse.success('Service deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
