import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import Tenant from '../models/Tenant';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Verify tenant is active
    const tenant = await Tenant.findById(decoded.tenantId);
    if (!tenant) {
      throw new ApiError(404, 'Tenant not found');
    }

    if (!tenant.isActive) {
      throw new ApiError(403, 'Account is inactive. Please contact support.');
    }

    // Check if subscription is expired
    if (tenant.expiresAt && new Date() > tenant.expiresAt) {
      throw new ApiError(403, 'Subscription has expired. Please renew your subscription.');
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      tenantId: decoded.tenantId,
      isTenantOwner: decoded.isTenantOwner
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError(401, 'Invalid or expired token'));
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    // Handle both array and spread arguments
    const roleList = Array.isArray(roles[0]) ? roles[0] : roles;

    console.log('User role:', req.user.role);
    console.log('Required roles:', roleList);
    console.log('Role check:', roleList.includes(req.user.role));

    if (!roleList.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden: Insufficient permissions'));
    }

    next();
  };
};
