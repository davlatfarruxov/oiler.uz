import { Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';
import { serviceService } from '../services/serviceService';
import { ApiError } from '../utils/ApiError';

export class GeneralServiceController {
  async createService(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      const workSession = await serviceService.createWorkSession(
        tenantId,
        req.body,
        userId
      );

      res.status(201).json(ApiResponse.success('Work session created successfully', workSession));
    } catch (error) {
      next(error);
    }
  }

  async listServices(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { vehicleId, customerId, paymentStatus } = req.query;

      const services = await serviceService.listServices(tenantId, {
        vehicleId: vehicleId as string,
        customerId: customerId as string,
        paymentStatus: paymentStatus as 'paid' | 'partial' | 'unpaid'
      });

      res.status(200).json(ApiResponse.success('Services retrieved successfully', services));
    } catch (error) {
      next(error);
    }
  }

  async getService(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const serviceId = req.params.id;

      const service = await serviceService.getServiceById(tenantId, serviceId);

      res.status(200).json(ApiResponse.success('Service retrieved successfully', service));
    } catch (error) {
      next(error);
    }
  }

  async updateService(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const serviceId = req.params.id;

      const updatedService = await serviceService.updateService(
        tenantId,
        serviceId,
        req.body,
        userId
      );

      res.status(200).json(ApiResponse.success('Service updated successfully', updatedService));
    } catch (error) {
      next(error);
    }
  }

  async deleteService(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const serviceId = req.params.id;
      const reason = req.body.reason;

      await serviceService.archiveWorkSession(tenantId, serviceId, userId, reason);

      res.status(200).json(ApiResponse.success('Service archived successfully'));
    } catch (error) {
      next(error);
    }
  }

  async archiveService(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const serviceId = req.params.id;
      const reason = req.body.reason;

      await serviceService.archiveWorkSession(tenantId, serviceId, userId, reason);

      res.status(200).json(ApiResponse.success('Service archived successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getServiceHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const serviceId = req.params.id;

      const history = await serviceService.getServiceHistory(tenantId, serviceId);

      res.status(200).json(ApiResponse.success('Service history retrieved successfully', history));
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const generalServiceController = new GeneralServiceController();
