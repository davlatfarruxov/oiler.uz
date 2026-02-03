import Settings, { ISettings } from '../models/Settings';
import User from '../models/User';
import { ApiError } from '../utils/ApiError';

interface UpdateCompanyData {
  companyName?: string;
  businessEmail?: string;
  businessPhone?: string;
  address?: string;
}

interface UpdateServiceDefaultsData {
  defaultOilType?: string;
  serviceIntervalKm?: number;
  serviceIntervalMonths?: number;
}

interface UpdateNotificationPreferencesData {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  lowStockAlerts?: boolean;
  dailyReport?: boolean;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export class SettingsService {
  async getSettings(): Promise<ISettings> {
    let settings = await Settings.findOne();
    
    // Create default settings if none exist
    if (!settings) {
      settings = await Settings.create({});
    }
    
    return settings;
  }

  async updateCompanyInfo(data: UpdateCompanyData): Promise<ISettings> {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create(data);
    } else {
      Object.assign(settings, data);
      await settings.save();
    }
    
    return settings;
  }

  async updateServiceDefaults(data: UpdateServiceDefaultsData): Promise<ISettings> {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create(data);
    } else {
      Object.assign(settings, data);
      await settings.save();
    }
    
    return settings;
  }

  async updateExchangeRate(exchangeRate: number): Promise<ISettings> {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({ exchangeRate });
    } else {
      settings.exchangeRate = exchangeRate;
      await settings.save();
    }
    
    return settings;
  }

  async getNotificationPreferences(userId: string) {
    const user = await User.findById(userId).select('emailNotifications smsNotifications lowStockAlerts dailyReport');
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    return {
      emailNotifications: user.emailNotifications,
      smsNotifications: user.smsNotifications,
      lowStockAlerts: user.lowStockAlerts,
      dailyReport: user.dailyReport
    };
  }

  async updateNotificationPreferences(userId: string, data: UpdateNotificationPreferencesData) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    if (data.emailNotifications !== undefined) user.emailNotifications = data.emailNotifications;
    if (data.smsNotifications !== undefined) user.smsNotifications = data.smsNotifications;
    if (data.lowStockAlerts !== undefined) user.lowStockAlerts = data.lowStockAlerts;
    if (data.dailyReport !== undefined) user.dailyReport = data.dailyReport;
    
    await user.save();
    
    return {
      emailNotifications: user.emailNotifications,
      smsNotifications: user.smsNotifications,
      lowStockAlerts: user.lowStockAlerts,
      dailyReport: user.dailyReport
    };
  }

  async changePassword(userId: string, data: ChangePasswordData): Promise<void> {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Verify current password
    const isPasswordValid = await user.comparePassword(data.currentPassword);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect');
    }
    
    // Validate new password
    if (data.newPassword.length < 6) {
      throw new ApiError(400, 'New password must be at least 6 characters');
    }
    
    // Update password
    user.password = data.newPassword;
    await user.save();
  }
}
