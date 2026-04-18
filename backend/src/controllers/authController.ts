import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/ApiError';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(201).json(
        ApiResponse.success('Registration successful', {
          user: result.user,
          tenant: result.tenant,
          accessToken: result.accessToken
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meta = {
        userAgent: req.get('user-agent') || undefined,
        ip: req.ip
      };
      const result = await authService.login(req.body, meta);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json(
        ApiResponse.success('Login successful', {
          user: result.user,
          tenant: result.tenant,
          accessToken: result.accessToken
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        throw new ApiError(401, 'Refresh token not found');
      }

      const meta = {
        userAgent: req.get('user-agent') || undefined,
        ip: req.ip
      };
      const result = await authService.refreshToken(refreshToken, meta);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json(ApiResponse.success('Token refreshed', { accessToken: result.accessToken }));
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      await authService.logout(refreshToken);
      res.clearCookie('refreshToken');
      res.status(200).json(ApiResponse.success('Logout successful', null));
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, tenant } = await authService.getProfilePayload(req.user!.id);
      res.status(200).json(ApiResponse.success('Profile retrieved', { user, tenant }));
    } catch (error) {
      next(error);
    }
  }

  async listMySessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await authService.listSessionsForUser(req.user!.id);
      const current = req.user!.accessSessionId;
      const mapped = list.map((s: any) => ({
        id: String(s._id),
        userAgent: s.userAgent,
        ip: s.ip,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
        isCurrent: Boolean(current && String(s._id) === current)
      }));
      res.status(200).json(ApiResponse.success('OK', mapped));
    } catch (e) {
      next(e);
    }
  }

  async revokeMySession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.revokeSession(req.params.id, req.user!.id, {});
      res.status(200).json(ApiResponse.success('Seans bekor qilindi', null));
    } catch (e) {
      next(e);
    }
  }

  async revokeMyOtherSessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sid = req.user!.accessSessionId;
      if (!sid) throw new ApiError(400, 'Joriy seans aniqlanmadi');
      await authService.revokeOtherSessions(req.user!.id, sid);
      res.status(200).json(ApiResponse.success('Boshqa seanslar bekor qilindi', null));
    } catch (e) {
      next(e);
    }
  }

  async listTenantSessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await authService.listSessionsForTenant(req.user!.tenantId);
      res.status(200).json(ApiResponse.success('OK', list));
    } catch (e) {
      next(e);
    }
  }

  async revokeTenantSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.revokeSession(req.params.id, req.user!.id, {
        tenantAdmin: true,
        tenantId: req.user!.tenantId
      });
      res.status(200).json(ApiResponse.success('Seans bekor qilindi', null));
    } catch (e) {
      next(e);
    }
  }
}
