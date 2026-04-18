import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import { UserRole } from '../types';

export interface TokenPayload {
  id: string;
  role: UserRole;
  tenantId: string;
  isTenantOwner: boolean;
  /** Session / refresh rotation */
  sid?: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpire } as SignOptions);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpire } as SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtRefreshSecret) as TokenPayload;
};
