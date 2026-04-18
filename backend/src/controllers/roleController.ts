import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import Role from '../models/Role';
import User from '../models/User';
import { isValidPermission } from '../constants/permissions';
import mongoose from 'mongoose';

export class RoleController {
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.user!.tenantId);
      const roles = await Role.find({ tenant: tenantId }).sort({ isSystem: -1, name: 1 }).lean();
      res.status(200).json(ApiResponse.success('OK', roles));
    } catch (e) {
      next(e);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.user!.tenantId);
      const { name, description, permissions } = req.body;
      if (!name || !Array.isArray(permissions)) {
        throw new ApiError(400, 'name va permissions kerak');
      }
      for (const p of permissions) {
        if (!isValidPermission(p)) throw new ApiError(400, `Noto'g'ri ruxsat: ${p}`);
      }
      const role = await Role.create({
        tenant: tenantId,
        name: String(name).trim(),
        description: description ? String(description).trim() : undefined,
        permissions,
        isSystem: false
      });
      res.status(201).json(ApiResponse.success('Rol yaratildi', role));
    } catch (e) {
      next(e);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.user!.tenantId);
      const { id } = req.params;
      const { name, description, permissions } = req.body;
      const role = await Role.findOne({ _id: id, tenant: tenantId });
      if (!role) throw new ApiError(404, 'Rol topilmadi');
      if (permissions !== undefined) {
        if (role.isSystem) {
          throw new ApiError(400, 'Tizim rolini ruxsatlari o‘zgartirilmaydi');
        }
        if (!Array.isArray(permissions)) {
          throw new ApiError(400, 'permissions massiv bo‘lishi kerak');
        }
        if (permissions.length < 1) {
          throw new ApiError(400, 'Kamida bitta ruxsat kerak');
        }
        for (const p of permissions) {
          if (!isValidPermission(p)) throw new ApiError(400, `Noto'g'ri ruxsat: ${p}`);
        }
        role.permissions = permissions;
      }
      if (name) role.name = String(name).trim();
      if (description !== undefined) role.description = description ? String(description).trim() : undefined;
      await role.save();
      res.status(200).json(ApiResponse.success('Yangilandi', role));
    } catch (e) {
      next(e);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.user!.tenantId);
      const { id } = req.params;
      const role = await Role.findOne({ _id: id, tenant: tenantId });
      if (!role) throw new ApiError(404, 'Rol topilmadi');
      if (role.isSystem) throw new ApiError(400, 'Tizim rolini o‘chirib bo‘lmaydi');
      const inUse = await User.exists({ assignedRole: role._id });
      if (inUse) throw new ApiError(400, 'Bu rol foydalanuvchilarga biriktirilgan');
      await role.deleteOne();
      res.status(200).json(ApiResponse.success("Rol o'chirildi", null));
    } catch (e) {
      next(e);
    }
  }
}
