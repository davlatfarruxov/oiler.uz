import Role from '../models/Role';
import type { PermissionKey } from '../constants/permissions';
import { ALL_PERMISSIONS, DEFAULT_EMPLOYEE_PERMISSIONS } from '../constants/permissions';
import mongoose from 'mongoose';

export async function seedDefaultRolesForTenant(
  tenantId: mongoose.Types.ObjectId
): Promise<{ adminRoleId: mongoose.Types.ObjectId; employeeRoleId: mongoose.Types.ObjectId }> {
  const adminRole = await Role.create({
    tenant: tenantId,
    name: 'Administrator',
    description: "Barcha bo'limlar va sozlamalar",
    permissions: ALL_PERMISSIONS as PermissionKey[],
    isSystem: true
  });

  const employeeRole = await Role.create({
    tenant: tenantId,
    name: 'Xodim',
    description: 'Standart ustaxona xodimi',
    permissions: [...DEFAULT_EMPLOYEE_PERMISSIONS],
    isSystem: true
  });

  return { adminRoleId: adminRole._id, employeeRoleId: employeeRole._id };
}
