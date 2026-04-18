import crypto from 'crypto';
import mongoose from 'mongoose';
import User, { IUserDocument } from '../models/User';
import Tenant from '../models/Tenant';
import Session from '../models/Session';
import Role from '../models/Role';
import { ApiError } from '../utils/ApiError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { UserRole, SubscriptionPlan } from '../types';
import { normalizePhone } from '../utils/phone';
import { hashRefreshToken } from '../utils/tokenHash';
import { seedDefaultRolesForTenant } from './roleSeedService';
import { resolveEffectivePermissions } from './userPermissionService';
import type { PermissionKey } from '../constants/permissions';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  companyName: string;
  businessEmail?: string;
  businessPhone?: string;
  address?: string;
}

/** Kirish: tenant egasi — email; qo‘shimcha foydalanuvchilar — telefon */
interface LoginData {
  identifier: string;
  password: string;
}

export interface AuthUserPayload {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  tenantId: string;
  isTenantOwner: boolean;
  permissions: PermissionKey[];
  assignedRole?: { id: string; name: string };
}

async function toUserPayload(user: IUserDocument, permissions: PermissionKey[]): Promise<AuthUserPayload> {
  let assignedRole: { id: string; name: string } | undefined;
  if (user.assignedRole) {
    const r = await Role.findById(user.assignedRole).select('name').lean();
    if (r) assignedRole = { id: String((r as any)._id), name: (r as any).name };
  }
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email || undefined,
    phone: user.phone || undefined,
    role: user.role,
    tenantId: (user.tenant as any)?._id?.toString?.() || String(user.tenant),
    isTenantOwner: user.isTenantOwner,
    permissions,
    assignedRole
  };
}

export class AuthService {
  async register(data: RegisterData) {
    const email = data.email.trim().toLowerCase();
    if (!email) {
      throw new ApiError(400, 'Email kerak');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, 'Bu email allaqachon ro‘yxatdan o‘tgan');
    }

    const tenant = await Tenant.create({
      companyName: data.companyName,
      businessEmail: data.businessEmail || email,
      businessPhone: data.businessPhone || 'Not provided',
      address: data.address || '',
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

    const { adminRoleId } = await seedDefaultRolesForTenant(tenant._id);

    const user = await User.create({
      name: data.name,
      email,
      password: data.password,
      role: data.role || UserRole.ADMIN,
      tenant: tenant._id,
      assignedRole: adminRoleId,
      isTenantOwner: true,
      isActive: true
    });

    const populated = (await User.findById(user._id).populate('tenant')) as IUserDocument;
    const permissions = await resolveEffectivePermissions(populated);

    const session = await Session.create({
      user: user._id,
      tenant: tenant._id,
      refreshTokenHash: hashRefreshToken(crypto.randomBytes(48).toString('hex')),
      lastUsedAt: new Date()
    });

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      role: user.role,
      tenantId: tenant._id.toString(),
      isTenantOwner: true,
      sid: session._id.toString()
    });

    const refreshToken = generateRefreshToken({
      id: user._id.toString(),
      role: user.role,
      tenantId: tenant._id.toString(),
      isTenantOwner: true,
      sid: session._id.toString()
    });

    session.refreshTokenHash = hashRefreshToken(refreshToken);
    await session.save();

    return {
      user: await toUserPayload(populated, permissions),
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

  async login(data: LoginData, meta?: { userAgent?: string; ip?: string }) {
    const raw = (data.identifier || '').trim();
    if (!raw) {
      throw new ApiError(400, 'Email yoki telefon kerak');
    }

    let user: IUserDocument | null = null;
    if (raw.includes('@')) {
      user = await User.findOne({ email: raw.toLowerCase() })
        .select('+password')
        .populate('tenant')
        .populate('assignedRole');
    } else {
      const phone = normalizePhone(raw);
      if (!phone) {
        throw new ApiError(400, "Telefon raqam noto'g'ri");
      }
      user = await User.findOne({ phone })
        .select('+password')
        .populate('tenant')
        .populate('assignedRole');
    }

    if (!user || !user.isActive) {
      throw new ApiError(401, 'Email/telefon yoki parol noto‘g‘ri');
    }

    const tenant = user.tenant as any;
    if (!tenant || !tenant.isActive) {
      throw new ApiError(403, 'Account is inactive. Please contact support.');
    }

    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Email/telefon yoki parol noto‘g‘ri');
    }

    const permissions = await resolveEffectivePermissions(user);

    const session = await Session.create({
      user: user._id,
      tenant: tenant._id,
      refreshTokenHash: hashRefreshToken(crypto.randomBytes(48).toString('hex')),
      userAgent: meta?.userAgent,
      ip: meta?.ip,
      lastUsedAt: new Date()
    });

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      role: user.role,
      tenantId: tenant._id.toString(),
      isTenantOwner: user.isTenantOwner,
      sid: session._id.toString()
    });

    const refreshToken = generateRefreshToken({
      id: user._id.toString(),
      role: user.role,
      tenantId: tenant._id.toString(),
      isTenantOwner: user.isTenantOwner,
      sid: session._id.toString()
    });

    session.refreshTokenHash = hashRefreshToken(refreshToken);
    await session.save();

    return {
      user: await toUserPayload(user as IUserDocument, permissions),
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

  async refreshToken(
    token: string,
    meta?: { userAgent?: string; ip?: string }
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = verifyRefreshToken(token) as {
        id: string;
        role: UserRole;
        tenantId: string;
        isTenantOwner: boolean;
        sid?: string;
      };

      if (!decoded.sid) {
        throw new ApiError(401, 'Please login again');
      }

      const user = await User.findById(decoded.id).populate('tenant');
      if (!user || !user.isActive) {
        throw new ApiError(401, 'Invalid token');
      }

      const tenant = user.tenant as any;
      if (!tenant || !tenant.isActive) {
        throw new ApiError(403, 'Account is inactive');
      }

      const session = await Session.findById(decoded.sid);
      if (!session || session.revokedAt || session.user.toString() !== user._id.toString()) {
        throw new ApiError(401, 'Session invalid');
      }
      const incomingHash = hashRefreshToken(token);
      if (incomingHash !== session.refreshTokenHash) {
        throw new ApiError(401, 'Session invalid');
      }

      const sid = session._id.toString();

      const accessToken = generateAccessToken({
        id: user._id.toString(),
        role: user.role,
        tenantId: tenant._id.toString(),
        isTenantOwner: user.isTenantOwner,
        sid
      });

      const refreshToken = generateRefreshToken({
        id: user._id.toString(),
        role: user.role,
        tenantId: tenant._id.toString(),
        isTenantOwner: user.isTenantOwner,
        sid
      });

      session.refreshTokenHash = hashRefreshToken(refreshToken);
      session.lastUsedAt = new Date();
      if (meta?.userAgent) session.userAgent = meta.userAgent;
      if (meta?.ip) session.ip = meta.ip;
      await session.save();

      return { accessToken, refreshToken };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(401, 'Invalid or expired refresh token');
    }
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    try {
      const decoded = verifyRefreshToken(refreshToken) as { sid?: string };
      if (decoded.sid) {
        await Session.findByIdAndUpdate(decoded.sid, { revokedAt: new Date() });
      }
    } catch {
      /* ignore */
    }
  }

  async getProfilePayload(
    userId: string
  ): Promise<{ user: AuthUserPayload; tenant: { id: string; companyName: string; plan: string; isActive: boolean; businessEmail?: string; businessPhone?: string } }> {
    const user = await User.findById(userId).populate('tenant').populate('assignedRole');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    const permissions = await resolveEffectivePermissions(user);
    const u = await toUserPayload(user, permissions);
    const t = user.tenant as any;
    const tenant = {
      id: t._id.toString(),
      companyName: t.companyName,
      plan: t.plan,
      isActive: t.isActive,
      businessEmail: t.businessEmail,
      businessPhone: t.businessPhone
    };
    return { user: u, tenant };
  }

  async listSessionsForUser(userId: string) {
    return Session.find({ user: userId, revokedAt: { $exists: false } })
      .sort({ lastUsedAt: -1 })
      .select('_id userAgent ip createdAt lastUsedAt')
      .lean();
  }

  async listSessionsForTenant(tenantId: string) {
    return Session.find({ tenant: tenantId, revokedAt: { $exists: false } })
      .sort({ lastUsedAt: -1 })
      .populate('user', 'name phone role')
      .select('_id user userAgent ip createdAt lastUsedAt')
      .lean();
  }

  async revokeSession(sessionId: string, actorUserId: string, opts?: { tenantAdmin?: boolean; tenantId?: string }) {
    const s = await Session.findById(sessionId);
    if (!s || s.revokedAt) {
      throw new ApiError(404, 'Session not found');
    }
    if (opts?.tenantAdmin && opts.tenantId && s.tenant.toString() === opts.tenantId) {
      s.revokedAt = new Date();
      await s.save();
      return;
    }
    if (s.user.toString() === actorUserId) {
      s.revokedAt = new Date();
      await s.save();
      return;
    }
    throw new ApiError(403, 'Forbidden');
  }

  async revokeOtherSessions(userId: string, keepSessionId: string) {
    await Session.updateMany(
      {
        user: new mongoose.Types.ObjectId(userId),
        _id: { $ne: new mongoose.Types.ObjectId(keepSessionId) },
        revokedAt: { $exists: false }
      },
      { revokedAt: new Date() }
    );
  }
}
