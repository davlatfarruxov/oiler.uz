import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

/** Xizmat katalogi (serviceRoutes) — vaqtincha stub */
export class AppointmentServiceController {
  async getAllServices(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(ApiResponse.success('OK', []));
    } catch (e) {
      next(e);
    }
  }

  async getServiceById(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      next(new ApiError(404, 'Topilmadi'));
    } catch (e) {
      next(e);
    }
  }

  async createService(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      next(new ApiError(501, 'Xizmat katalogi hozircha mavjud emas'));
    } catch (e) {
      next(e);
    }
  }

  async updateService(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      next(new ApiError(501, 'Xizmat katalogi hozircha mavjud emas'));
    } catch (e) {
      next(e);
    }
  }

  async toggleServiceStatus(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      next(new ApiError(501, 'Xizmat katalogi hozircha mavjud emas'));
    } catch (e) {
      next(e);
    }
  }

  async deleteService(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      next(new ApiError(501, 'Xizmat katalogi hozircha mavjud emas'));
    } catch (e) {
      next(e);
    }
  }
}
