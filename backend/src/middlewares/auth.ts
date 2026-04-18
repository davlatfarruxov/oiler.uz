import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import Tenant from '../models/Tenant';
import Session from '../models/Session';
import { resolvePermissionsByUserId } from '../services/userPermissionService';
import { getRequiredRoutePermission } from './routePermissionMap';
import type { PermissionKey } from '../constants/permissions';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const tenant = await Tenant.findById(decoded.tenantId);
    if (!tenant) {
      throw new ApiError(404, 'Tenant not found');
    }

    if (!tenant.isActive) {
      throw new ApiError(403, 'Account is inactive. Please contact support.');
    }

    if (tenant.expiresAt && new Date() > tenant.expiresAt) {
      throw new ApiError(403, 'Subscription has expired. Please renew your subscription.');
    }

    if (decoded.sid && decoded.role !== UserRole.SUPER_ADMIN) {
      const sess = await Session.findById(decoded.sid);
      if (!sess || sess.revokedAt || sess.user.toString() !== decoded.id) {
        throw new ApiError(401, 'Session expired');
      }
    }

    const permissions = await resolvePermissionsByUserId(decoded.id);

    const routePerm = getRequiredRoutePermission(req.method, req.originalUrl);

    if (routePerm !== null && routePerm !== 'SKIP') {
      if (!permissions.includes(routePerm as PermissionKey)) {
        throw new ApiError(403, 'Forbidden: insufficient permissions');
      }
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      tenantId: decoded.tenantId,
      isTenantOwner: decoded.isTenantOwner,
      permissions,
      matchedRoutePermission: routePerm,
      accessSessionId: decoded.sid
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

export const authorize = (...roles: (UserRole | UserRole[])[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const roleList = roles.flatMap((r) => (Array.isArray(r) ? r : [r])) as UserRole[];

    if (req.user.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    if (roleList.includes(req.user.role)) {
      return next();
    }

    const m = req.user.matchedRoutePermission;
    if (m && m !== 'SKIP' && req.user.permissions?.includes(m as PermissionKey)) {
      return next();
    }

    return next(new ApiError(403, 'Forbidden: Insufficient permissions'));
  };
};
