import User, { IUserDocument } from '../models/User';
import Tenant from '../models/Tenant';
import { ApiError } from '../utils/ApiError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { UserRole, SubscriptionPlan } from '../types';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  // Company information for new tenant
  companyName: string;
  businessEmail?: string;
  businessPhone?: string;
  address?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    tenantId: string;
    isTenantOwner: boolean;
  };
  tenant: {
    id: string;
    companyName: string;
    plan: SubscriptionPlan;
    isActive: boolean;
  };
  accessToken: string;
}

export class AuthService {
  async register(data: RegisterData): Promise<{ user: AuthResponse['user']; tenant: AuthResponse['tenant']; accessToken: string; refreshToken: string }> {
    // Check if user with this email already exists in ANY tenant
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ApiError(409, 'Email already registered');
    }

    // Create new tenant for this user
    const tenant = await Tenant.create({
      companyName: data.companyName,
      businessEmail: data.businessEmail || data.email,
      businessPhone: data.businessPhone || 'Not provided',
      address: data.address || 'Not provided',
      plan: SubscriptionPlan.FREE,
      maxEmployees: 5,
      maxVehicles: 100,
      isActive: true,
      settings: {
        currency: 'USD',
        timezone: 'Asia/Tashkent',
        exchangeRate: 12500,
        lowStockThreshold: 10,
        defaultOilType: '5w30',
        serviceIntervalKm: 5000,
        serviceIntervalMonths: 6
      }
    });

    // Create user as tenant owner
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role || UserRole.ADMIN, // First user is admin
      tenant: tenant._id,
      isTenantOwner: true,
      isActive: true
    });

    const accessToken = generateAccessToken({ 
      id: user._id.toString(), 
      role: user.role,
      tenantId: tenant._id.toString(),
      isTenantOwner: true
    });
    
    const refreshToken = generateRefreshToken({ 
      id: user._id.toString(), 
      role: user.role,
      tenantId: tenant._id.toString(),
      isTenantOwner: true
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: tenant._id.toString(),
        isTenantOwner: true
      },
      tenant: {
        id: tenant._id.toString(),
        companyName: tenant.companyName,
        plan: tenant.plan,
        isActive: tenant.isActive
      },
      accessToken,
      refreshToken
    };
  }

  async login(data: LoginData): Promise<{ user: AuthResponse['user']; tenant: AuthResponse['tenant']; accessToken: string; refreshToken: string }> {
    const user = await User.findOne({ email: data.email })
      .select('+password')
      .populate('tenant');
    
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Check if tenant is active
    const tenant = user.tenant as any;
    if (!tenant || !tenant.isActive) {
      throw new ApiError(403, 'Account is inactive. Please contact support.');
    }

    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const accessToken = generateAccessToken({ 
      id: user._id.toString(), 
      role: user.role,
      tenantId: tenant._id.toString(),
      isTenantOwner: user.isTenantOwner
    });
    
    const refreshToken = generateRefreshToken({ 
      id: user._id.toString(), 
      role: user.role,
      tenantId: tenant._id.toString(),
      isTenantOwner: user.isTenantOwner
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: tenant._id.toString(),
        isTenantOwner: user.isTenantOwner
      },
      tenant: {
        id: tenant._id.toString(),
        companyName: tenant.companyName,
        plan: tenant.plan,
        isActive: tenant.isActive
      },
      accessToken,
      refreshToken
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = verifyRefreshToken(token);
      
      const user = await User.findById(decoded.id).populate('tenant');
      if (!user || !user.isActive) {
        throw new ApiError(401, 'Invalid token');
      }

      // Check if tenant is active
      const tenant = user.tenant as any;
      if (!tenant || !tenant.isActive) {
        throw new ApiError(403, 'Account is inactive');
      }

      const accessToken = generateAccessToken({ 
        id: user._id.toString(), 
        role: user.role,
        tenantId: tenant._id.toString(),
        isTenantOwner: user.isTenantOwner
      });
      
      const refreshToken = generateRefreshToken({ 
        id: user._id.toString(), 
        role: user.role,
        tenantId: tenant._id.toString(),
        isTenantOwner: user.isTenantOwner
      });

      return { accessToken, refreshToken };
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId).populate('tenant');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }
}
