import { Request } from 'express';

export enum UserRole {
  EMPLOYEE = 'employee',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum EngineType {
  PETROL = 'petrol',
  DIESEL = 'diesel',
  HYBRID = 'hybrid',
  ELECTRIC = 'electric'
}

export enum OilType {
  MINERAL = 'mineral',
  SEMI_SYNTHETIC = 'semi_synthetic',
  FULL_SYNTHETIC = 'full_synthetic'
}

export enum ProductType {
  OIL = 'oil',
  FILTER = 'filter',
  OTHER = 'other'
}

export enum FilterType {
  OIL_FILTER = 'oil_filter',
  AIR_FILTER = 'air_filter',
  CABIN_FILTER = 'cabin_filter',
  FUEL_FILTER = 'fuel_filter'
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}
