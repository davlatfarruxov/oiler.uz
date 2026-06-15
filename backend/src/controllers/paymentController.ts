import { Response, NextFunction } from 'express';
import { PaymentService } from '../services/paymentService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types';

const paymentService = new PaymentService();

export class PaymentController {
  /**
   * Record a new payment
   * POST /payments
   */
  async recordPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      
      const payment = await paymentService.recordPayment(tenantId, req.body, userId);
      
      res.status(201).json(ApiResponse.success('Payment recorded successfully', payment));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payments by customer
   * GET /payments?customerId=xxx
   */
  async getPaymentsByCustomer(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { customerId } = req.query;

      if (!customerId) {
        res.status(400).json(ApiResponse.error('Customer ID is required'));
        return;
      }

      const payments = await paymentService.getCustomerPayments(tenantId, customerId as string);
      
      res.status(200).json(ApiResponse.success('Payments retrieved', payments));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payments by oil change
   * GET /payments?oilChangeId=xxx
   */
  async getPaymentsByOilChange(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { oilChangeId } = req.query;

      if (!oilChangeId) {
        res.status(400).json(ApiResponse.error('Oil change ID is required'));
        return;
      }

      const payments = await paymentService.getOilChangePayments(tenantId, oilChangeId as string);
      
      res.status(200).json(ApiResponse.success('Payments retrieved', payments));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payments by service
   * GET /payments?serviceId=xxx
   */
  async getPaymentsByService(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { serviceId } = req.query;

      if (!serviceId) {
        res.status(400).json(ApiResponse.error('Service ID is required'));
        return;
      }

      const payments = await paymentService.getServicePayments(tenantId, serviceId as string);
      
      res.status(200).json(ApiResponse.success('Payments retrieved', payments));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all payments (with optional filters)
   * GET /payments
   */
  async getAllPayments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { customerId, oilChangeId, serviceId } = req.query;

      if (customerId) {
        return this.getPaymentsByCustomer(req, res, next);
      }

      if (oilChangeId) {
        return this.getPaymentsByOilChange(req, res, next);
      }

      if (serviceId) {
        return this.getPaymentsByService(req, res, next);
      }

      res.status(400).json(ApiResponse.error('Please provide customerId, oilChangeId, or serviceId'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get customer payment summary
   * GET /payments/customer/:customerId/summary
   */
  async getCustomerPaymentSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { customerId } = req.params;
      // Ixtiyoriy: ?vehicleId= berilsa, qarz faqat shu mashina bo'yicha hisoblanadi
      const vehicleId = typeof req.query.vehicleId === 'string' ? req.query.vehicleId : undefined;

      const summary = await paymentService.getCustomerPaymentSummary(tenantId, customerId, vehicleId);
      
      res.status(200).json(ApiResponse.success('Payment summary retrieved', summary));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get customer payment history (ledger)
   * GET /payments/customer/:customerId/history?page=1&limit=20
   */
  async getCustomerPaymentHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { customerId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await paymentService.getCustomerPaymentHistory(tenantId, customerId, page, limit);
      
      res.status(200).json(ApiResponse.success('Payment history retrieved', result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get overdue payments
   * GET /payments/overdue
   */
  async getOverduePayments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;

      const overduePayments = await paymentService.getOverduePayments(tenantId);
      
      res.status(200).json(ApiResponse.success('Overdue payments retrieved', overduePayments));
    } catch (error) {
      next(error);
    }
  }
}
