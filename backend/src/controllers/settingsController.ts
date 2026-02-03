import { Response, NextFunction } from 'express';
import { SettingsService } from '../services/settingsService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

const settingsService = new SettingsService();

export class SettingsController {
  async getSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsService.getSettings();
      res.status(200).json(ApiResponse.success('Settings retrieved', settings));
    } catch (error) {
      next(error);
    }
  }

  async updateCompanyInfo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsService.updateCompanyInfo(req.body);
      res.status(200).json(ApiResponse.success('Company information updated', settings));
    } catch (error) {
      next(error);
    }
  }

  async updateServiceDefaults(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsService.updateServiceDefaults(req.body);
      res.status(200).json(ApiResponse.success('Service defaults updated', settings));
    } catch (error) {
      next(error);
    }
  }

  async getNotificationPreferences(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const preferences = await settingsService.getNotificationPreferences(req.user!.id);
      res.status(200).json(ApiResponse.success('Notification preferences retrieved', preferences));
    } catch (error) {
      next(error);
    }
  }

  async updateNotificationPreferences(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const preferences = await settingsService.updateNotificationPreferences(req.user!.id, req.body);
      res.status(200).json(ApiResponse.success('Notification preferences updated', preferences));
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await settingsService.changePassword(req.user!.id, req.body);
      res.status(200).json(ApiResponse.success('Password changed successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateExchangeRate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { exchangeRate } = req.body;
      const settings = await settingsService.updateExchangeRate(exchangeRate);
      res.status(200).json(ApiResponse.success('Exchange rate updated', settings));
    } catch (error) {
      next(error);
    }
  }
}
