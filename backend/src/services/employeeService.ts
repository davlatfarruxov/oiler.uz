import Employee, { IEmployeeDocument } from '../models/Employee';
import OilChange from '../models/OilChange';
import Service from '../models/Service';
import Settings from '../models/Settings';
import EmployeePayment from '../models/EmployeePayment';
import { ApiError } from '../utils/ApiError';
import { UserRole } from '../types';
import mongoose from 'mongoose';

interface CreateEmployeeData {
  name: string;
  email: string;
  phone: string;
  role?: UserRole;
  commissionRate?: number;
  startDate?: Date;
}

interface EmployeeWithStats extends IEmployeeDocument {
  servicesThisMonth: number;
  totalRevenue: number;
  avgRating: number;
}

export class EmployeeService {
  private getEmployeeCommissionAmount(employeeId: string, employeeCommissions: any[] = []): number {
    const matchedCommission = employeeCommissions.find((commission: any) => {
      const commissionEmployeeId =
        typeof commission.employee === 'string'
          ? commission.employee
          : commission.employee?._id?.toString?.() || commission.employee?.toString?.();
      return commissionEmployeeId === employeeId;
    });

    return matchedCommission?.commissionAmount || 0;
  }

  async createEmployee(tenantId: string, data: CreateEmployeeData): Promise<IEmployeeDocument> {
    // Check if email already exists within this tenant
    const existingEmployee = await Employee.findOne({ 
      tenant: tenantId,
      email: data.email 
    });
    
    if (existingEmployee) {
      throw new ApiError(409, 'Employee with this email already exists');
    }

    const employee = await Employee.create({
      tenant: tenantId,
      ...data
    });
    
    return employee;
  }

  async getAllEmployees(tenantId: string): Promise<IEmployeeDocument[]> {
    return Employee.find({ tenant: tenantId, isArchived: { $ne: true } }).sort({ createdAt: -1 });
  }

  async getAllEmployeesWithStats(tenantId: string): Promise<any[]> {
    const employees = await Employee.find({ tenant: tenantId, isArchived: { $ne: true } }).sort({ createdAt: -1 }).lean();
    
    // Get current month start and end
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get stats for all employees
    const employeesWithStats = await Promise.all(
      employees.map(async (employee) => {
        const stats = await this.calculateEmployeeStats(tenantId, employee._id.toString(), monthStart, monthEnd);
        return {
          ...employee,
          ...stats
        };
      })
    );

    return employeesWithStats;
  }

  async getEmployeeById(tenantId: string, employeeId: string): Promise<IEmployeeDocument> {
    const employee = await Employee.findOne({ 
      _id: employeeId,
      tenant: tenantId 
    });
    
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }
    return employee;
  }

  async getEmployeeWithPerformance(tenantId: string, employeeId: string): Promise<any> {
    const employee = await this.getEmployeeById(tenantId, employeeId);
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const stats = await this.calculateEmployeeStats(tenantId, employeeId, monthStart, monthEnd);

    return {
      ...employee.toObject(),
      ...stats
    };
  }

  async updateEmployee(tenantId: string, employeeId: string, data: Partial<CreateEmployeeData> & { commissionRate?: number }): Promise<IEmployeeDocument> {
    // Check if email is being changed and if it conflicts within this tenant
    if (data.email) {
      const existingEmployee = await Employee.findOne({
        tenant: tenantId,
        _id: { $ne: employeeId },
        email: data.email
      });

      if (existingEmployee) {
        throw new ApiError(409, 'Employee with this email already exists');
      }
    }

    // Validate commission rate
    if (data.commissionRate !== undefined) {
      if (data.commissionRate < 0 || data.commissionRate > 100) {
        throw new ApiError(400, 'Commission rate must be between 0 and 100');
      }
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: employeeId, tenant: tenantId },
      data,
      { new: true, runValidators: true }
    );

    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    return employee;
  }

  async toggleEmployeeStatus(tenantId: string, employeeId: string): Promise<IEmployeeDocument> {
    const employee = await Employee.findOne({ 
      _id: employeeId,
      tenant: tenantId 
    });
    
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    employee.active = !employee.active;
    await employee.save();

    return employee;
  }

  async deleteEmployee(tenantId: string, employeeId: string): Promise<void> {
    const employee = await Employee.findOneAndDelete({ 
      _id: employeeId,
      tenant: tenantId 
    });
    
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }
  }

  async getEmployeeStats(tenantId: string): Promise<any> {
    const totalEmployees = await Employee.countDocuments({ tenant: tenantId });
    const activeEmployees = await Employee.countDocuments({ tenant: tenantId, active: true });
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthlyStats = await OilChange.aggregate([
      {
        $match: {
          tenant: new mongoose.Types.ObjectId(tenantId),
          createdAt: { $gte: monthStart, $lte: monthEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalServices: { $sum: 1 },
          totalRevenue: { $sum: '$price' }
        }
      }
    ]);

    return {
      totalEmployees,
      activeEmployees,
      totalServices: monthlyStats[0]?.totalServices || 0,
      totalRevenue: monthlyStats[0]?.totalRevenue || 0
    };
  }

  async getEmployeePerformance(tenantId: string, employeeId: string): Promise<any> {
    const employee = await this.getEmployeeById(tenantId, employeeId);
    
    // Get last 6 months performance
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const stats = await this.calculateEmployeeStats(tenantId, employeeId, monthStart, monthEnd);
      
      months.push({
        month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        services: stats.servicesThisMonth,
        revenue: stats.totalRevenue
      });
    }

    return {
      employee: employee.toObject(),
      performance: months
    };
  }

  private async calculateEmployeeStats(tenantId: string, employeeId: string, startDate: Date, endDate: Date): Promise<any> {
    const stats = await OilChange.aggregate([
      {
        $match: {
          tenant: new mongoose.Types.ObjectId(tenantId),
          employees: new mongoose.Types.ObjectId(employeeId),
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $unwind: '$employeeCommissions'
      },
      {
        $match: {
          'employeeCommissions.employee': new mongoose.Types.ObjectId(employeeId)
        }
      },
      {
        $group: {
          _id: null,
          servicesThisMonth: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
          totalCommission: { $sum: '$employeeCommissions.commissionAmount' }
        }
      }
    ]);

    return {
      servicesThisMonth: stats[0]?.servicesThisMonth || 0,
      totalRevenue: stats[0]?.totalRevenue || 0,
      totalCommission: stats[0]?.totalCommission || 0,
      avgRating: 0 // TODO: Implement rating system
    };
  }

  async getActiveEmployees(tenantId: string): Promise<IEmployeeDocument[]> {
    return Employee.find({ tenant: tenantId, active: true }).sort({ name: 1 });
  }

  async getTopPerformer(tenantId: string): Promise<any> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const topPerformers = await OilChange.aggregate([
      {
        $match: {
          tenant: new mongoose.Types.ObjectId(tenantId),
          createdAt: { $gte: monthStart, $lte: monthEnd }
        }
      },
      {
        $unwind: '$employees'
      },
      {
        $group: {
          _id: '$employees',
          servicesCount: { $sum: 1 },
          totalRevenue: { $sum: '$price' }
        }
      },
      {
        $sort: { servicesCount: -1 }
      },
      {
        $limit: 1
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: '$employee'
      }
    ]);

    return topPerformers[0] || null;
  }

  async archiveEmployee(tenantId: string, employeeId: string, userId: string, reason?: string): Promise<void> {
    const employee = await Employee.findOne({ 
      _id: employeeId,
      tenant: tenantId 
    });
    
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    if (employee.isArchived) {
      throw new ApiError(400, 'Employee is already archived');
    }

    employee.isArchived = true;
    employee.archivedAt = new Date();
    employee.archivedBy = userId as any;
    employee.active = false; // Also deactivate
    await employee.save();
  }

  async restoreEmployee(tenantId: string, employeeId: string): Promise<IEmployeeDocument> {
    const employee = await Employee.findOne({ 
      _id: employeeId,
      tenant: tenantId 
    });
    
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    if (!employee.isArchived) {
      throw new ApiError(400, 'Employee is not archived');
    }

    employee.isArchived = false;
    employee.archivedAt = undefined;
    employee.archivedBy = undefined;
    employee.active = true; // Reactivate
    await employee.save();

    return employee;
  }

  async getArchivedEmployees(tenantId: string, page: number = 1, limit: number = 100) {
    const skip = (page - 1) * limit;
    
    const filter = { tenant: tenantId, isArchived: true };
    
    const [data, totalItems] = await Promise.all([
      Employee.find(filter)
        .populate('archivedBy', 'name email')
        .sort({ archivedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Employee.countDocuments(filter)
    ]);
    
    return {
      data,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems
    };
  }

  async getEmployeeServices(
    tenantId: string, 
    employeeId: string, 
    filters: {
      startDate?: Date;
      endDate?: Date;
      serviceType?: 'oilChange' | 'service' | 'all';
      paymentStatus?: 'paid' | 'partial' | 'unpaid' | 'all';
      page?: number;
      limit?: number;
    }
  ): Promise<any> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Verify employee exists
    await this.getEmployeeById(tenantId, employeeId);

    const Service = require('../models/Service').default;

    // Build match query
    const matchQuery: any = {
      tenant: new mongoose.Types.ObjectId(tenantId),
      employees: new mongoose.Types.ObjectId(employeeId),
      isArchived: { $ne: true }
    };

    if (filters.startDate || filters.endDate) {
      matchQuery.createdAt = {};
      if (filters.startDate) matchQuery.createdAt.$gte = filters.startDate;
      if (filters.endDate) matchQuery.createdAt.$lte = filters.endDate;
    }

    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      matchQuery.paymentStatus = filters.paymentStatus;
    }

    // Fetch oil changes
    let oilChanges: any[] = [];
    if (!filters.serviceType || filters.serviceType === 'all' || filters.serviceType === 'oilChange') {
      oilChanges = await OilChange.find(matchQuery)
        .populate('vehicle', 'plateNumber brand vehicleModel')
        .populate('customer', 'name phone')
        .populate('employees', 'name')
        .sort({ createdAt: -1 })
        .lean();
    }

    // Fetch general services
    let generalServices: any[] = [];
    if (!filters.serviceType || filters.serviceType === 'all' || filters.serviceType === 'service') {
      const serviceMatchQuery = {
        tenant: new mongoose.Types.ObjectId(tenantId),
        'services.employees': new mongoose.Types.ObjectId(employeeId),
        isArchived: { $ne: true }
      };

      if (filters.startDate || filters.endDate) {
        serviceMatchQuery['createdAt'] = {};
        if (filters.startDate) serviceMatchQuery['createdAt'].$gte = filters.startDate;
        if (filters.endDate) serviceMatchQuery['createdAt'].$lte = filters.endDate;
      }

      if (filters.paymentStatus && filters.paymentStatus !== 'all') {
        serviceMatchQuery['paymentStatus'] = filters.paymentStatus;
      }

      generalServices = await Service.find(serviceMatchQuery)
        .populate('vehicle', 'plateNumber brand vehicleModel')
        .populate('customer', 'name phone')
        .populate('services.employees', 'name')
        .sort({ createdAt: -1 })
        .lean();
    }

    // Format oil changes
    const formattedOilChanges = oilChanges.map((service: any) => {
      const commission = this.getEmployeeCommissionAmount(employeeId, service.employeeCommissions || []);
      const employeeCommission = (service.employeeCommissions || []).find((item: any) => {
        const id = typeof item.employee === 'string' ? item.employee : item.employee?._id?.toString?.() || item.employee?.toString?.();
        return id === employeeId;
      });

      return {
        _id: service._id,
        type: 'oilChange',
        date: service.createdAt,
        vehicle: service.vehicle,
        customer: service.customer,
        serviceName: 'Moy almashtirish',
        price: service.price,
        paymentStatus: service.paymentStatus,
        amountPaid: service.amountPaid,
        amountDue: service.amountDue,
        employees: service.employees,
        commission: Math.round(commission),
        commissionRate: employeeCommission?.commissionRate || 0
      };
    });

    // Format general services
    const formattedGeneralServices = generalServices.map((service: any) => {
      // Count how many services this employee participated in
      let employeeServiceCount = 0;
      let totalCommission = 0;

      service.services.forEach((s: any) => {
        const isInService = s.employees.some((e: any) => e._id.toString() === employeeId);
        if (isInService) {
          employeeServiceCount++;
          const serviceCommission = this.getEmployeeCommissionAmount(employeeId, s.employeeCommissions || []);
          totalCommission += serviceCommission;
        }
      });

      return {
        _id: service._id,
        type: 'service',
        date: service.createdAt,
        vehicle: service.vehicle,
        customer: service.customer,
        serviceName: `Ish sessiyasi (${employeeServiceCount} ta xizmat)`,
        price: service.totalPrice,
        paymentStatus: service.paymentStatus,
        amountPaid: service.amountPaid,
        amountDue: service.amountDue,
        status: service.status,
        services: service.services,
        employeeServiceCount,
        commission: Math.round(totalCommission),
        commissionRate: null
      };
    });

    // Merge and sort
    const allServices = [...formattedOilChanges, ...formattedGeneralServices]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Paginate
    const paginatedServices = allServices.slice(skip, skip + limit);
    const totalItems = allServices.length;

    // Calculate totals
    const totalServices = allServices.length;
    const totalRevenue = allServices.reduce((sum, s) => sum + s.price, 0);
    const totalCommission = allServices.reduce((sum, s) => sum + s.commission, 0);

    return {
      services: paginatedServices,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit),
        totalItems
      },
      summary: {
        totalServices,
        totalRevenue,
        totalCommission
      }
    };
  }

  async getEmployeeStatistics(tenantId: string, employeeId: string): Promise<any> {
    await this.getEmployeeById(tenantId, employeeId);

    const Service = require('../models/Service').default;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // All time stats
    const allTimeOilChanges = await OilChange.countDocuments({
      tenant: new mongoose.Types.ObjectId(tenantId),
      employees: new mongoose.Types.ObjectId(employeeId),
      isArchived: { $ne: true }
    });

    const allTimeGeneralServices = await Service.countDocuments({
      tenant: new mongoose.Types.ObjectId(tenantId),
      'services.employees': new mongoose.Types.ObjectId(employeeId),
      isArchived: { $ne: true }
    });

    // This month stats
    const monthOilChanges = await OilChange.find({
      tenant: new mongoose.Types.ObjectId(tenantId),
      employees: new mongoose.Types.ObjectId(employeeId),
      createdAt: { $gte: monthStart, $lte: monthEnd },
      isArchived: { $ne: true }
    }).lean();

    const monthGeneralServices = await Service.find({
      tenant: new mongoose.Types.ObjectId(tenantId),
      'services.employees': new mongoose.Types.ObjectId(employeeId),
      createdAt: { $gte: monthStart, $lte: monthEnd },
      isArchived: { $ne: true }
    }).lean();

    // Calculate month revenue and commission
    let monthRevenue = 0;
    let monthCommission = 0;

    monthOilChanges.forEach((service: any) => {
      monthRevenue += service.price;
      monthCommission += this.getEmployeeCommissionAmount(employeeId, service.employeeCommissions || []);
    });

    monthGeneralServices.forEach((service: any) => {
      monthRevenue += service.totalPrice;
      service.services.forEach((s: any) => {
        const isInService = s.employees.some((e: any) => e.toString() === employeeId);
        if (isInService) {
          monthCommission += this.getEmployeeCommissionAmount(employeeId, s.employeeCommissions || []);
        }
      });
    });

    // All time revenue and commission
    const allOilChanges = await OilChange.find({
      tenant: new mongoose.Types.ObjectId(tenantId),
      employees: new mongoose.Types.ObjectId(employeeId),
      isArchived: { $ne: true }
    }).lean();

    const allGeneralServices = await Service.find({
      tenant: new mongoose.Types.ObjectId(tenantId),
      'services.employees': new mongoose.Types.ObjectId(employeeId),
      isArchived: { $ne: true }
    }).lean();

    let allTimeRevenue = 0;
    let allTimeCommission = 0;

    allOilChanges.forEach((service: any) => {
      allTimeRevenue += service.price;
      allTimeCommission += this.getEmployeeCommissionAmount(employeeId, service.employeeCommissions || []);
    });

    allGeneralServices.forEach((service: any) => {
      allTimeRevenue += service.totalPrice;
      service.services.forEach((s: any) => {
        const isInService = s.employees.some((e: any) => e.toString() === employeeId);
        if (isInService) {
          allTimeCommission += this.getEmployeeCommissionAmount(employeeId, s.employeeCommissions || []);
        }
      });
    });

    return {
      allTime: {
        totalServices: allTimeOilChanges + allTimeGeneralServices,
        totalRevenue: Math.round(allTimeRevenue),
        totalCommission: Math.round(allTimeCommission)
      },
      thisMonth: {
        totalServices: monthOilChanges.length + monthGeneralServices.length,
        totalRevenue: Math.round(monthRevenue),
        totalCommission: Math.round(monthCommission)
      }
    };
  }

  async getTotalEmployeeDebt(tenantId: string): Promise<any> {
    const employees = await Employee.find({
      tenant: new mongoose.Types.ObjectId(tenantId),
      isArchived: { $ne: true }
    }).lean();

    let totalCommission = 0;
    let totalPaid = 0;

    for (const employee of employees) {
      // Calculate commission from oil changes
      const oilChanges = await OilChange.find({
        tenant: new mongoose.Types.ObjectId(tenantId),
        employees: employee._id,
        isArchived: { $ne: true }
      }).lean();

      oilChanges.forEach((service: any) => {
        totalCommission += this.getEmployeeCommissionAmount(employee._id.toString(), service.employeeCommissions || []);
      });

      // Calculate commission from general services
      const generalServices = await Service.find({
        tenant: new mongoose.Types.ObjectId(tenantId),
        'services.employees': employee._id,
        isArchived: { $ne: true }
      }).lean();

      generalServices.forEach((service: any) => {
        service.services.forEach((s: any) => {
          const isInService = s.employees.some((e: any) => e.toString() === employee._id.toString());
          if (isInService) {
            totalCommission += this.getEmployeeCommissionAmount(employee._id.toString(), s.employeeCommissions || []);
          }
        });
      });

      // Get payments for this employee
      const payments = await EmployeePayment.find({
        tenant: new mongoose.Types.ObjectId(tenantId),
        employee: employee._id
      }).lean();

      payments.forEach((payment: any) => {
        totalPaid += payment.amount;
      });
    }

    return {
      totalCommission: Math.round(totalCommission),
      totalPaid: Math.round(totalPaid),
      totalDebt: Math.round(totalCommission - totalPaid),
      employeeCount: employees.length
    };
  }
}
