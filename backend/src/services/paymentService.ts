import Payment, { IPayment } from '../models/Payment';
import OilChange from '../models/OilChange';
import Service from '../models/Service';
import Customer from '../models/Customer';
import { ApiError } from '../utils/ApiError';

interface RecordPaymentData {
  customerId: string;
  serviceType: 'oilChange' | 'service';
  oilChangeId?: string;
  serviceId?: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'check' | 'other';
  paymentDate?: Date;
  notes?: string;
}

export class PaymentService {
  /**
   * Record a new payment for an oil change or service
   */
  async recordPayment(
    tenantId: string,
    data: RecordPaymentData,
    userId: string
  ): Promise<IPayment> {
    if (data.amount <= 0) {
      throw new ApiError(400, 'Payment amount must be greater than 0');
    }

    let entity: any;
    let entityId: string;

    // Query appropriate model based on serviceType
    if (data.serviceType === 'oilChange') {
      if (!data.oilChangeId) {
        throw new ApiError(400, 'oilChangeId is required for oil change payments');
      }

      const oilChange = await OilChange.findOne({
        _id: data.oilChangeId,
        tenant: tenantId
      });

      if (!oilChange) {
        throw new ApiError(404, 'Oil change not found');
      }

      entity = oilChange;
      entityId = data.oilChangeId;
    } else if (data.serviceType === 'service') {
      if (!data.serviceId) {
        throw new ApiError(400, 'serviceId is required for service payments');
      }

      const service = await Service.findOne({
        _id: data.serviceId,
        tenant: tenantId
      });

      if (!service) {
        throw new ApiError(404, 'Service not found');
      }

      entity = service;
      entityId = data.serviceId;
    } else {
      throw new ApiError(400, 'Invalid serviceType. Must be "oilChange" or "service"');
    }

    // Validate customer matches
    if (entity.customer.toString() !== data.customerId) {
      throw new ApiError(400, `Customer does not match ${data.serviceType} record`);
    }

    // Validate payment amount does not exceed amount due
    if (data.amount > entity.amountDue) {
      throw new ApiError(400, `Payment amount (${data.amount}) cannot exceed amount due (${entity.amountDue})`);
    }

    // Create payment record with correct reference
    const paymentData: any = {
      tenant: tenantId,
      customer: data.customerId,
      serviceType: data.serviceType,
      amount: data.amount,
      paymentDate: data.paymentDate || new Date(),
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      recordedBy: userId
    };

    if (data.serviceType === 'oilChange') {
      paymentData.oilChange = entityId;
    } else {
      paymentData.service = entityId;
    }

    const payment = await Payment.create(paymentData);

    // Update payment fields on correct entity
    entity.amountPaid += data.amount;
    entity.amountDue -= data.amount;

    // Update payment status
    if (entity.amountDue === 0) {
      entity.paymentStatus = 'paid';
      entity.paidAt = new Date();
    } else if (entity.amountPaid > 0 && entity.amountDue > 0) {
      entity.paymentStatus = 'partial';
    }

    await entity.save();

    // Update customer debt
    await this.updateCustomerDebt(tenantId, data.customerId);

    return payment.populate('recordedBy', 'name email');
  }

  /**
   * Get all payments for a customer (both oil changes and services)
   */
  async getCustomerPayments(tenantId: string, customerId: string): Promise<IPayment[]> {
    return Payment.find({
      tenant: tenantId,
      customer: customerId
    })
      .populate('oilChange', 'mileage price createdAt')
      .populate('service', 'serviceName totalPrice createdAt')
      .populate('recordedBy', 'name email')
      .sort({ paymentDate: -1 })
      .lean();
  }

  /**
   * Get all payments for a specific oil change
   */
  async getOilChangePayments(tenantId: string, oilChangeId: string): Promise<IPayment[]> {
    return Payment.find({
      tenant: tenantId,
      oilChange: oilChangeId
    })
      .populate('recordedBy', 'name email')
      .sort({ paymentDate: -1 })
      .lean();
  }

  /**
   * Get all payments for a specific service
   */
  async getServicePayments(tenantId: string, serviceId: string): Promise<IPayment[]> {
    return Payment.find({
      tenant: tenantId,
      service: serviceId
    })
      .populate('recordedBy', 'name email')
      .sort({ paymentDate: -1 })
      .lean();
  }

  /**
   * Calculate and update customer's total debt
   * Includes both oil changes and services
   */
  async updateCustomerDebt(tenantId: string, customerId: string): Promise<number> {
    const mongoose = require('mongoose');
    
    // Sum all amountDue from customer's oil changes
    const oilChangeResult = await OilChange.aggregate([
      {
        $match: {
          tenant: new mongoose.Types.ObjectId(tenantId),
          customer: new mongoose.Types.ObjectId(customerId),
          isArchived: { $ne: true }
        }
      },
      {
        $group: {
          _id: null,
          totalDebt: { $sum: '$amountDue' }
        }
      }
    ]);

    // Sum all amountDue from customer's services
    const serviceResult = await Service.aggregate([
      {
        $match: {
          tenant: new mongoose.Types.ObjectId(tenantId),
          customer: new mongoose.Types.ObjectId(customerId),
          isArchived: { $ne: true }
        }
      },
      {
        $group: {
          _id: null,
          totalDebt: { $sum: '$amountDue' }
        }
      }
    ]);

    const oilChangeDebt = oilChangeResult.length > 0 ? oilChangeResult[0].totalDebt : 0;
    const serviceDebt = serviceResult.length > 0 ? serviceResult[0].totalDebt : 0;
    const totalDebt = oilChangeDebt + serviceDebt;

    // Update customer record
    await Customer.findOneAndUpdate(
      { _id: customerId, tenant: tenantId },
      { 
        totalDebt,
        lastPaymentDate: new Date()
      }
    );

    return totalDebt;
  }

  /**
   * Calculate customer's total debt (without updating)
   * Includes both oil changes and services
   */
  async calculateCustomerDebt(tenantId: string, customerId: string, vehicleId?: string): Promise<number> {
    const mongoose = require('mongoose');

    // Ixtiyoriy: faqat bitta mashina bo'yicha qarz (mashinaga bog'langan qarz)
    const vehicleMatch = vehicleId ? { vehicle: new mongoose.Types.ObjectId(vehicleId) } : {};

    // Aggregate amountDue from OilChange collection
    const oilChangeResult = await OilChange.aggregate([
      {
        $match: {
          tenant: new mongoose.Types.ObjectId(tenantId),
          customer: new mongoose.Types.ObjectId(customerId),
          isArchived: { $ne: true },
          ...vehicleMatch
        }
      },
      {
        $group: {
          _id: null,
          totalDebt: { $sum: '$amountDue' }
        }
      }
    ]);

    // Aggregate amountDue from Service collection
    const serviceResult = await Service.aggregate([
      {
        $match: {
          tenant: new mongoose.Types.ObjectId(tenantId),
          customer: new mongoose.Types.ObjectId(customerId),
          isArchived: { $ne: true },
          ...vehicleMatch
        }
      },
      {
        $group: {
          _id: null,
          totalDebt: { $sum: '$amountDue' }
        }
      }
    ]);

    // Sum both amounts and return total
    const oilChangeDebt = oilChangeResult.length > 0 ? oilChangeResult[0].totalDebt : 0;
    const serviceDebt = serviceResult.length > 0 ? serviceResult[0].totalDebt : 0;

    return oilChangeDebt + serviceDebt;
  }

  /**
   * Get all overdue payments for a tenant (both oil changes and services)
   */
  async getOverduePayments(tenantId: string): Promise<any[]> {
    const now = new Date();

    const [overdueOilChanges, overdueServices] = await Promise.all([
      OilChange.find({
        tenant: tenantId,
        isArchived: { $ne: true },
        amountDue: { $gt: 0 },
        dueDate: { $lt: now }
      })
        .populate('customer', 'name phone')
        .populate('vehicle', 'plateNumber brand vehicleModel')
        .sort({ dueDate: 1 })
        .lean(),
      Service.find({
        tenant: tenantId,
        isArchived: { $ne: true },
        amountDue: { $gt: 0 },
        dueDate: { $lt: now }
      })
        .populate('customer', 'name phone')
        .populate('vehicle', 'plateNumber brand vehicleModel')
        .sort({ dueDate: 1 })
        .lean()
    ]);

    // Combine and add type indicator
    const combined = [
      ...overdueOilChanges.map(oc => ({ ...oc, serviceType: 'oilChange' })),
      ...overdueServices.map(s => ({ ...s, serviceType: 'service' }))
    ];

    // Sort by due date
    combined.sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return dateA - dateB;
    });

    return combined;
  }

  /**
   * Get payment summary for a customer (includes both oil changes and services)
   */
  async getCustomerPaymentSummary(tenantId: string, customerId: string, vehicleId?: string): Promise<any> {
    // Ixtiyoriy: faqat bitta mashina bo'yicha (qarz mashinaga bog'langan)
    const vehicleFilter = vehicleId ? { vehicle: vehicleId } : {};

    const [totalDebt, unpaidOilChanges, unpaidServices, overdueOilChanges, overdueServices, recentPayments, unpaidOilChangesList, unpaidServicesList] = await Promise.all([
      this.calculateCustomerDebt(tenantId, customerId, vehicleId),
      OilChange.countDocuments({
        tenant: tenantId,
        customer: customerId,
        ...vehicleFilter,
        isArchived: { $ne: true },
        paymentStatus: 'unpaid'
      }),
      Service.countDocuments({
        tenant: tenantId,
        customer: customerId,
        ...vehicleFilter,
        isArchived: { $ne: true },
        paymentStatus: 'unpaid'
      }),
      OilChange.countDocuments({
        tenant: tenantId,
        customer: customerId,
        ...vehicleFilter,
        isArchived: { $ne: true },
        amountDue: { $gt: 0 },
        dueDate: { $lt: new Date() }
      }),
      Service.countDocuments({
        tenant: tenantId,
        customer: customerId,
        ...vehicleFilter,
        isArchived: { $ne: true },
        amountDue: { $gt: 0 },
        dueDate: { $lt: new Date() }
      }),
      Payment.find({
        tenant: tenantId,
        customer: customerId
      })
        .sort({ paymentDate: -1 })
        .limit(5)
        .populate('oilChange', 'mileage price')
        .populate('service', 'serviceName totalPrice')
        .lean(),
      OilChange.find({
        tenant: tenantId,
        customer: customerId,
        ...vehicleFilter,
        isArchived: { $ne: true },
        amountDue: { $gt: 0 }
      })
        .select('_id mileage amountDue createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      Service.find({
        tenant: tenantId,
        customer: customerId,
        ...vehicleFilter,
        isArchived: { $ne: true },
        amountDue: { $gt: 0 }
      })
        .select('_id serviceName amountDue createdAt')
        .sort({ createdAt: -1 })
        .lean()
    ]);

    return {
      totalDebt,
      unpaidServices: unpaidOilChanges + unpaidServices,
      overdueServices: overdueOilChanges + overdueServices,
      recentPayments,
      unpaidOilChanges: unpaidOilChangesList,
      unpaidServicesList
    };
  }

  /**
   * Get payment history (ledger) for a customer
   * Includes both oil changes and services
   */
  async getCustomerPaymentHistory(
    tenantId: string, 
    customerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ transactions: any[], total: number, page: number, totalPages: number }> {
    // Calculate skip
    const skip = (page - 1) * limit;

    // Get all oil changes, services, and payments
    const [oilChanges, services, payments] = await Promise.all([
      OilChange.find({
        tenant: tenantId,
        customer: customerId
      })
        .select('price amountPaid amountDue paymentStatus createdAt mileage')
        .sort({ createdAt: -1 })
        .lean(),
      Service.find({
        tenant: tenantId,
        customer: customerId
      })
        .select('serviceName totalPrice amountPaid amountDue paymentStatus createdAt mileage')
        .sort({ createdAt: -1 })
        .lean(),
      Payment.find({
        tenant: tenantId,
        customer: customerId
      })
        .populate('oilChange', 'mileage')
        .populate('service', 'serviceName mileage')
        .sort({ paymentDate: -1 })
        .lean()
    ]);

    // Combine and sort by date
    const allTransactions: any[] = [];

    // Add oil changes with service type indicator
    oilChanges.forEach(oc => {
      allTransactions.push({
        type: 'service',
        serviceType: 'oilChange',
        date: oc.createdAt,
        amount: oc.price,
        amountDue: oc.amountDue,
        paymentStatus: oc.paymentStatus,
        mileage: oc.mileage,
        _id: oc._id
      });
    });

    // Add services with service type indicator
    services.forEach(s => {
      allTransactions.push({
        type: 'service',
        serviceType: 'service',
        serviceName: s.serviceName,
        date: s.createdAt,
        amount: s.totalPrice,
        amountDue: s.amountDue,
        paymentStatus: s.paymentStatus,
        mileage: s.mileage,
        _id: s._id
      });
    });

    // Add payments with service type indicator
    payments.forEach(p => {
      allTransactions.push({
        type: 'payment',
        serviceType: p.serviceType,
        date: p.paymentDate,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        notes: p.notes,
        oilChange: p.oilChange,
        service: p.service,
        _id: p._id
      });
    });

    // Sort by date descending
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate running balance for ALL transactions first
    let runningBalance = 0;
    for (let i = allTransactions.length - 1; i >= 0; i--) {
      if (allTransactions[i].type === 'service') {
        runningBalance += allTransactions[i].amount;
      } else {
        runningBalance -= allTransactions[i].amount;
      }
      allTransactions[i].balance = runningBalance;
    }

    // Apply pagination
    const total = allTransactions.length;
    const totalPages = Math.ceil(total / limit);
    const transactions = allTransactions.slice(skip, skip + limit);

    return {
      transactions,
      total,
      page,
      totalPages
    };
  }
}
