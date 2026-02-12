import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { config } from '../config/env';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging
  console.error('Error occurred:', {
    name: err.name,
    message: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params
  });

  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if ((err as any).code === 11000) {
    statusCode = 409;
    // Extract the field name from the error
    const field = Object.keys((err as any).keyPattern || {})[0];
    const value = (err as any).keyValue?.[field];
    
    if (field === 'plateNumber') {
      message = `Vehicle with plate number "${value}" already exists`;
    } else if (field === 'phone') {
      message = `Customer with phone number "${value}" already exists`;
    } else if (field === 'email') {
      message = `Email "${value}" is already registered`;
    } else if (field === 'name') {
      message = `This name is already taken`;
    } else {
      message = `Duplicate value for field: ${field}`;
    }
  }

  const response: any = {
    success: false,
    message
  };

  if (config.nodeEnv === 'development') {
    response.stack = err.stack;
    response.error = err;
  }

  res.status(statusCode).json(response);
};
