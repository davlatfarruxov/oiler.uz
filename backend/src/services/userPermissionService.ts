import User, { IUserDocument } from '../models/User';
import Role from '../models/Role';
import { UserRole } from '../types';
import type { PermissionKey } from '../constants/permissions';
import { ALL_PERMISSIONS, DEFAULT_EMPLOYEE_PERMISSIONS } from '../constants/permissions';

export async function resolveEffectivePermissions(user: IUserDocument): Promise<PermissionKey[]> {
  if (user.role === UserRole.SUPER_ADMIN) {
    return [...ALL_PERMISSIONS];
  }
  if (user.isTenantOwner) {
    return [...ALL_PERMISSIONS];
  }

  if (user.assignedRole) {
    const role = await Role.findById(user.assignedRole).lean();
    const perms = (role?.permissions || []) as string[];
    return perms.filter((p): p is PermissionKey =>
      (ALL_PERMISSIONS as readonly string[]).includes(p)
    ) as PermissionKey[];
  }

  if (user.role === UserRole.ADMIN) {
    return [...ALL_PERMISSIONS];
  }

  if (user.role === UserRole.EMPLOYEE) {
    return [...DEFAULT_EMPLOYEE_PERMISSIONS];
  }

  return [...DEFAULT_EMPLOYEE_PERMISSIONS];
}

export async function resolvePermissionsByUserId(userId: string): Promise<PermissionKey[]> {
  const user = await User.findById(userId);
  if (!user) return [];
  return resolveEffectivePermissions(user);
}
