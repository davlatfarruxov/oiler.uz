import EmployeePayment, { IEmployeePaymentDocument } from '../models/EmployeePayment';
import Employee from '../models/Employee';
import { ApiError } from '../utils/ApiError';
import mongoose from 'mongoose';

interface CreatePaymentData {
  employeeId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  paymentDate?: Date;
  notes?: string;
  relatedServices?: Array<{
    serviceId: string;
    serviceType: 'oilChange' | 'service';
    commissionAmount: number;
  }>;
  isMonthlyPayment?: boolean;
  monthYear?: string;
}

export class EmployeePaymentService {
  async createPayment(
    tenantId: string,
    data: CreatePaymentData,
    userId: string
  ): Promise<IEmployeePaymentDocument> {
    // Verify employee exists
    const employee = await Employee.findOne({
      _id: data.employeeId,
      tenant: tenantId
    });

    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    // Create payment
    const payment = await EmployeePayment.create({
      tenant: tenantId,
      employee: data.employeeId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentDate: data.paymentDate || new Date(),
      notes: data.notes,
      relatedServices: data.relatedServices || [],
      isMonthlyPayment: data.isMonthlyPayment || false,
      monthYear: data.monthYear,
      createdBy: userId
    });

    return payment.populate('employee', 'name email');
  }

  async getEmployeePayments(
    tenantId: string,
    employeeId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      paymentMethod?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<any> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = {
      tenant: new mongoose.Types.ObjectId(tenantId),
      employee: new mongoose.Types.ObjectId(employeeId)
    };

    if (filters.startDate || filters.endDate) {
      query.paymentDate = {};
      if (filters.startDate) query.paymentDate.$gte = filters.startDate;
      if (filters.endDate) query.paymentDate.$lte = filters.endDate;
    }

    if (filters.paymentMethod) {
      query.paymentMethod = filters.paymentMethod;
    }

    const [payments, totalItems] = await Promise.all([
      EmployeePayment.find(query)
        .populate('employee', 'name email')
        .populate('createdBy', 'name')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EmployeePayment.countDocuments(query)
    ]);

    const totalAmount = await EmployeePayment.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit),
        totalItems
      },
      summary: {
        totalPaid: totalAmount[0]?.total || 0
      }
    };
  }

  async getPaymentById(
    tenantId: string,
    paymentId: string
  ): Promise<IEmployeePaymentDocument> {
    const payment = await EmployeePayment.findOne({
      _id: paymentId,
      tenant: tenantId
    })
      .populate('employee', 'name email phone')
      .populate('createdBy', 'name');

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    return payment;
  }

  async deletePayment(
    tenantId: string,
    paymentId: string
  ): Promise<void> {
    const payment = await EmployeePayment.findOneAndDelete({
      _id: paymentId,
      tenant: tenantId
    });

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }
  }

  async getEmployeePaymentSummary(
    tenantId: string,
    employeeId: string
  ): Promise<any> {
    // Verify employee exists
    await Employee.findOne({
      _id: employeeId,
      tenant: tenantId
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get all time payments
    const allTimePayments = await EmployeePayment.aggregate([
      {
        $match: {
          tenant: new mongoose.Types.ObjectId(tenantId),
          employee: new mongoose.Types.ObjectId(employeeId)
        }
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get this month payments
    const monthPayments = await EmployeePayment.aggregate([
      {
        $match: {
          tenant: new mongoose.Types.ObjectId(tenantId),
          employee: new mongoose.Types.ObjectId(employeeId),
          paymentDate: { $gte: monthStart, $lte: monthEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      allTime: {
        totalPaid: allTimePayments[0]?.totalPaid || 0,
        paymentsCount: allTimePayments[0]?.count || 0
      },
      thisMonth: {
        totalPaid: monthPayments[0]?.totalPaid || 0,
        paymentsCount: monthPayments[0]?.count || 0
      }
    };
  }
}
