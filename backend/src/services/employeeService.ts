import Employee, { IEmployeeDocument } from '../models/Employee';
import OilChange from '../models/OilChange';
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
}
