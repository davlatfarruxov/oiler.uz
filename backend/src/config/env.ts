import dotenv from 'dotenv';

dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtExpire: string;
  jwtRefreshSecret: string;
  jwtRefreshExpire: string;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  authRateLimitWindowMs: number;
  authRateLimitMaxRequests: number;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const config: Config = {
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  port: parseInt(getEnvVar('PORT', '5000'), 10),
  mongoUri: getEnvVar('MONGODB_URI'),
  jwtSecret: getEnvVar('JWT_SECRET'),
  jwtExpire: getEnvVar('JWT_EXPIRE', '15m'),
  jwtRefreshSecret: getEnvVar('JWT_REFRESH_SECRET'),
  jwtRefreshExpire: getEnvVar('JWT_REFRESH_EXPIRE', '7d'),
  corsOrigin: getEnvVar('CORS_ORIGIN', 'http://localhost:3000'),
  rateLimitWindowMs: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  rateLimitMaxRequests: parseInt(getEnvVar('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  authRateLimitWindowMs: parseInt(getEnvVar('AUTH_RATE_LIMIT_WINDOW_MS', '900000'), 10),
  authRateLimitMaxRequests: parseInt(getEnvVar('AUTH_RATE_LIMIT_MAX_REQUESTS', '5'), 10),
};
