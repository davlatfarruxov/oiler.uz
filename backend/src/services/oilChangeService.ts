import OilChange, { IOilChangeDocument } from '../models/OilChange';
import Vehicle from '../models/Vehicle';
import Employee from '../models/Employee';
import Inventory from '../models/Inventory';
import OilProduct from '../models/OilProduct';
import Filter from '../models/Filter';
import { ApiError } from '../utils/ApiError';

interface CreateOilChangeData {
  vehicleId: string;
  customerId: string;
  employeeIds: string[];
  oilProductId?: string;
  oilProductCustomerProvided?: boolean;
  oilProductCustomerProvidedDetails?: string;
  oilQuantityUsed: number;
  oilFilterId?: string;
  oilFilterCustomerProvided?: boolean;
  oilFilterCustomerProvidedDetails?: string;
  additionalProducts?: { productId: string; quantity: number }[];
  mileage: number;
  nextServiceMileage: number;
  laborCost?: number;
  price: number;
}

export class OilChangeService {
  async createOilChange(data: CreateOilChangeData): Promise<IOilChangeDocument> {
    const vehicle = await Vehicle.findById(data.vehicleId);
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }

    // Validate and fetch all employees
    if (!data.employeeIds || data.employeeIds.length === 0) {
      throw new ApiError(400, 'At least one employee is required');
    }

    const employees = await Employee.find({ _id: { $in: data.employeeIds } });
    if (employees.length !== data.employeeIds.length) {
      throw new ApiError(404, 'One or more employees not found');
    }

    let oilProduct = null;
    // Only fetch and decrease stock if NOT customer provided
    if (!data.oilProductCustomerProvided) {
      if (!data.oilProductId) {
        throw new ApiError(400, 'Oil product is required');
      }
      oilProduct = await OilProduct.findById(data.oilProductId);
      if (!oilProduct) {
        throw new ApiError(404, 'Oil product not found');
      }
      if (oilProduct.stock < 1) {
        throw new ApiError(400, 'Oil product out of stock');
      }
      // Decrease oil product stock
      oilProduct.stock -= 1;
      await oilProduct.save();
    }

    let oilFilter = null;
    // Only fetch and decrease stock if NOT customer provided
    if (!data.oilFilterCustomerProvided) {
      if (!data.oilFilterId) {
        throw new ApiError(400, 'Oil filter is required');
      }
      oilFilter = await Filter.findById(data.oilFilterId);
      if (!oilFilter) {
        throw new ApiError(404, 'Oil filter not found');
      }
      // Decrease oil filter stock
      oilFilter.stock -= 1;
      await oilFilter.save();
    }

    // Prepare additional products
    const additionalProducts = [];
    if (data.additionalProducts) {
      for (const item of data.additionalProducts) {
        const product = await Inventory.findById(item.productId);
        if (product) {
          additionalProducts.push({
            product: product._id,
            quantity: item.quantity,
            price: product.price * item.quantity
          });
          // Decrease stock
          product.stock -= item.quantity;
          await product.save();
        }
      }
    }

    // Calculate employee commissions
    const laborCost = data.laborCost || 0;
    const employeeCommissions = employees.map(emp => {
      const commissionAmount = (laborCost * emp.commissionRate) / 100;
      return {
        employee: emp._id,
        commissionRate: emp.commissionRate,
        commissionAmount: commissionAmount
      };
    });

    const oilChange = await OilChange.create({
      vehicle: data.vehicleId,
      customer: data.customerId,
      employees: data.employeeIds,
      employeeCommissions,
      oilProduct: data.oilProductId || undefined,
      oilProductCustomerProvided: data.oilProductCustomerProvided || false,
      oilProductCustomerProvidedDetails: data.oilProductCustomerProvidedDetails,
      oilQuantityUsed: data.oilQuantityUsed,
      oilFilter: data.oilFilterId || undefined,
      oilFilterCustomerProvided: data.oilFilterCustomerProvided || false,
      oilFilterCustomerProvidedDetails: data.oilFilterCustomerProvidedDetails,
      additionalProducts,
      mileage: data.mileage,
      nextServiceMileage: data.nextServiceMileage,
      laborCost: laborCost,
      price: data.price
    });

    return oilChange.populate(['vehicle', 'customer', 'employees', 'employeeCommissions.employee', 'oilProduct', 'oilFilter']);
  }

  async getAllOilChanges(): Promise<IOilChangeDocument[]> {
    return OilChange.find()
      .populate(['vehicle', 'customer', 'employees', 'employeeCommissions.employee', 'oilProduct', 'oilFilter'])
      .sort({ createdAt: -1 });
  }

  async getTodayCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return OilChange.countDocuments({
      createdAt: { $gte: today }
    });
  }

  async getMonthlyRevenue(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await OilChange.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$price' }
        }
      }
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  async getRecentServices(limit: number = 5): Promise<IOilChangeDocument[]> {
    return OilChange.find()
      .populate(['vehicle', 'customer', 'employees', 'employeeCommissions.employee', 'oilProduct'])
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getEmployeeCommissions(employeeId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const match: any = {
      employees: employeeId
    };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    const services = await OilChange.find(match)
      .populate(['vehicle', 'customer'])
      .sort({ createdAt: -1 });

    let totalCommission = 0;
    const commissionDetails = services.map(service => {
      const empCommission = service.employeeCommissions.find(
        ec => ec.employee.toString() === employeeId
      );
      
      if (empCommission) {
        totalCommission += empCommission.commissionAmount;
        return {
          serviceId: service._id,
          date: service.createdAt,
          vehicle: service.vehicle,
          customer: service.customer,
          laborCost: service.laborCost,
          commissionRate: empCommission.commissionRate,
          commissionAmount: empCommission.commissionAmount
        };
      }
      return null;
    }).filter(Boolean);

    return {
      totalCommission,
      servicesCount: commissionDetails.length,
      commissions: commissionDetails
    };
  }
}
