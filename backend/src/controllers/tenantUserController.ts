import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import User from '../models/User';
import Role from '../models/Role';
import { normalizePhone } from '../utils/phone';
import { UserRole } from '../types';
import mongoose from 'mongoose';

export class TenantUserController {
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.user!.tenantId);
      const users = await User.find({ tenant: tenantId })
        .select('name phone email role isActive isTenantOwner assignedRole createdAt')
        .populate('assignedRole', 'name')
        .lean();
      res.status(200).json(ApiResponse.success('OK', users));
    } catch (e) {
      next(e);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.user!.tenantId);
      const { name, phone, password, roleId, role } = req.body;
      const phoneNorm = normalizePhone(phone);
      if (!phoneNorm || !password || password.length < 6) {
        throw new ApiError(400, 'Telefon va parol (min 6) kerak');
      }
      const exists = await User.findOne({ phone: phoneNorm });
      if (exists) throw new ApiError(409, 'Bu telefon band');
      if (!roleId) throw new ApiError(400, 'roleId kerak');
      const r = await Role.findOne({ _id: roleId, tenant: tenantId });
      if (!r) throw new ApiError(400, 'Rol topilmadi');

      const userRole = role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.EMPLOYEE;

      const user = await User.create({
        name: String(name || '').trim() || 'User',
        phone: phoneNorm,
        password: String(password),
        role: userRole,
        tenant: tenantId,
        assignedRole: r._id,
        isTenantOwner: false,
        isActive: true
      });

      res.status(201).json(
        ApiResponse.success(
          'Foydalanuvchi yaratildi',
          await User.findById(user._id).select('-password').populate('assignedRole', 'name').lean()
        )
      );
    } catch (e) {
      next(e);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.user!.tenantId);
      const { id } = req.params;
      const { name, roleId, isActive } = req.body;
      const user = await User.findOne({ _id: id, tenant: tenantId });
      if (!user) throw new ApiError(404, 'Topilmadi');
      if (user.isTenantOwner) throw new ApiError(400, 'Tenant egasini bu yerda tahrirlab bo‘lmaydi');
      if (name) user.name = String(name).trim();
      if (typeof isActive === 'boolean') user.isActive = isActive;
      if (roleId) {
        const r = await Role.findOne({ _id: roleId, tenant: tenantId });
        if (!r) throw new ApiError(400, 'Rol topilmadi');
        user.assignedRole = r._id as any;
      }
      await user.save();
      res.status(200).json(ApiResponse.success('Yangilandi', await User.findById(user._id).select('-password').populate('assignedRole', 'name').lean()));
    } catch (e) {
      next(e);
    }
  }

  async resetPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.user!.tenantId);
      const { id } = req.params;
      const { password } = req.body;
      if (!password || password.length < 6) throw new ApiError(400, 'Parol min 6');
      const user = await User.findOne({ _id: id, tenant: tenantId }).select('+password');
      if (!user) throw new ApiError(404, 'Topilmadi');
      if (user.isTenantOwner) throw new ApiError(400, 'Tenant egasi');
      user.password = password;
      await user.save();
      res.status(200).json(ApiResponse.success('Parol yangilandi', null));
    } catch (e) {
      next(e);
    }
  }
}
