import Settings, { ISettings } from '../models/Settings';
import User from '../models/User';
import Tenant from '../models/Tenant';
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
  async getSettings(tenantId: string): Promise<ISettings> {
    let settings = await Settings.findOne({ tenant: tenantId });
    
    if (!settings) {
      settings = await Settings.create({ tenant: tenantId });
    }
    
    return settings;
  }

  async updateCompanyInfo(tenantId: string, data: UpdateCompanyData): Promise<any> {
    // Update Tenant model instead of Settings
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new ApiError(404, 'Tenant not found');
    }
    
    // Update tenant fields
    if (data.companyName !== undefined) tenant.companyName = data.companyName;
    if (data.businessEmail !== undefined) tenant.businessEmail = data.businessEmail;
    if (data.businessPhone !== undefined) tenant.businessPhone = data.businessPhone;
    if (data.address !== undefined) tenant.address = data.address;
    
    await tenant.save();
    
    return tenant;
  }

  async updateServiceDefaults(tenantId: string, data: UpdateServiceDefaultsData): Promise<ISettings> {
    let settings = await Settings.findOne({ tenant: tenantId });
    
    if (!settings) {
      settings = await Settings.create({ tenant: tenantId, ...data });
    } else {
      Object.assign(settings, data);
      await settings.save();
    }
    
    return settings;
  }

  async updateExchangeRate(tenantId: string, exchangeRate: number): Promise<ISettings> {
    if (!exchangeRate || exchangeRate <= 0) {
      throw new ApiError(400, 'Exchange rate must be a positive number');
    }
    
    let settings = await Settings.findOne({ tenant: tenantId });
    
    if (!settings) {
      settings = await Settings.create({ tenant: tenantId, exchangeRate });
    } else {
      settings.exchangeRate = exchangeRate;
      await settings.save();
    }
    
    return settings;
  }

  async getNotificationPreferences(userId: string, tenantId: string) {
    const user = await User.findOne({ _id: userId, tenant: tenantId })
      .select('emailNotifications smsNotifications lowStockAlerts dailyReport');
    
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

  async updateNotificationPreferences(userId: string, tenantId: string, data: UpdateNotificationPreferencesData) {
    const user = await User.findOne({ _id: userId, tenant: tenantId });
    
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

  async changePassword(userId: string, tenantId: string, data: ChangePasswordData): Promise<void> {
    const user = await User.findOne({ _id: userId, tenant: tenantId }).select('+password');
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    const isPasswordValid = await user.comparePassword(data.currentPassword);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect');
    }
    
    if (data.newPassword.length < 6) {
      throw new ApiError(400, 'New password must be at least 6 characters');
    }
    
    user.password = data.newPassword;
    await user.save();
  }

  async getPublicSettings(tenantId?: string): Promise<any> {
    // Get tenant by ID or first tenant
    const tenant = tenantId 
      ? await Tenant.findById(tenantId).lean()
      : await Tenant.findOne().lean();
    
    if (!tenant) {
      return {
        companyName: 'OILER.UZ',
        businessPhone: '',
        businessEmail: '',
        address: ''
      };
    }
    
    // Return only public fields from Tenant
    return {
      companyName: tenant.companyName || 'OILER.UZ',
      businessPhone: tenant.businessPhone || '',
      businessEmail: tenant.businessEmail || '',
      address: tenant.address || ''
    };
  }
}
