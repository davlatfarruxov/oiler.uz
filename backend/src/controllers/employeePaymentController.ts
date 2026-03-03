import { Response, NextFunction } from 'express';
import { EmployeePaymentService } from '../services/employeePaymentService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

const employeePaymentService = new EmployeePaymentService();

export class EmployeePaymentController {
  async createPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      const payment = await employeePaymentService.createPayment(tenantId, req.body, userId);
      res.status(201).json(ApiResponse.success('Payment created successfully', payment));
    } catch (error) {
      next(error);
    }
  }

  async getEmployeePayments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { employeeId } = req.params;
      const { startDate, endDate, paymentMethod, page, limit } = req.query;

      const filters: any = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20
      };

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (paymentMethod) filters.paymentMethod = paymentMethod;

      const result = await employeePaymentService.getEmployeePayments(tenantId, employeeId, filters);
      res.status(200).json(ApiResponse.success('Payments retrieved', result));
    } catch (error) {
      next(error);
    }
  }

  async getPaymentById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { paymentId } = req.params;

      const payment = await employeePaymentService.getPaymentById(tenantId, paymentId);
      res.status(200).json(ApiResponse.success('Payment retrieved', payment));
    } catch (error) {
      next(error);
    }
  }

  async deletePayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { paymentId } = req.params;

      await employeePaymentService.deletePayment(tenantId, paymentId);
      res.status(200).json(ApiResponse.success('Payment deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getEmployeePaymentSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { employeeId } = req.params;

      const summary = await employeePaymentService.getEmployeePaymentSummary(tenantId, employeeId);
      res.status(200).json(ApiResponse.success('Payment summary retrieved', summary));
    } catch (error) {
      next(error);
    }
  }
}
