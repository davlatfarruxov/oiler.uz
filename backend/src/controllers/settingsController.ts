import { Response, NextFunction } from 'express';
import { SettingsService } from '../services/settingsService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

const settingsService = new SettingsService();

export class SettingsController {
  async getSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const settings = await settingsService.getSettings(tenantId);
      res.status(200).json(ApiResponse.success('Settings retrieved', settings));
    } catch (error) {
      next(error);
    }
  }

  async updateCompanyInfo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const settings = await settingsService.updateCompanyInfo(tenantId, req.body);
      res.status(200).json(ApiResponse.success('Company information updated', settings));
    } catch (error) {
      next(error);
    }
  }

  async updateServiceDefaults(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const settings = await settingsService.updateServiceDefaults(tenantId, req.body);
      res.status(200).json(ApiResponse.success('Service defaults updated', settings));
    } catch (error) {
      next(error);
    }
  }

  async getNotificationPreferences(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const preferences = await settingsService.getNotificationPreferences(req.user!.id, tenantId);
      res.status(200).json(ApiResponse.success('Notification preferences retrieved', preferences));
    } catch (error) {
      next(error);
    }
  }

  async updateNotificationPreferences(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const preferences = await settingsService.updateNotificationPreferences(req.user!.id, tenantId, req.body);
      res.status(200).json(ApiResponse.success('Notification preferences updated', preferences));
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      await settingsService.changePassword(req.user!.id, tenantId, req.body);
      res.status(200).json(ApiResponse.success('Password changed successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateExchangeRate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { exchangeRate } = req.body;
      
      if (!exchangeRate || isNaN(exchangeRate) || exchangeRate <= 0) {
        res.status(400).json(ApiResponse.error('Invalid exchange rate. Must be a positive number.'));
        return;
      }
      
      const settings = await settingsService.updateExchangeRate(tenantId, Number(exchangeRate));
      res.status(200).json(ApiResponse.success('Exchange rate updated', settings));
    } catch (error) {
      next(error);
    }
  }
}
