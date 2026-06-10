import OilChange, { IOilChangeDocument } from '../models/OilChange';
import Vehicle from '../models/Vehicle';
import Employee from '../models/Employee';
import Inventory from '../models/Inventory';
import OilProduct from '../models/OilProduct';
import Filter from '../models/Filter';
import Customer from '../models/Customer';
import { ApiError } from '../utils/ApiError';
import { ArchiveService } from './archiveService';

const archiveService = new ArchiveService();

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
  airFilterId?: string;
  airFilterCustomerProvided?: boolean;
  airFilterCustomerProvidedDetails?: string;
  cabinFilterId?: string;
  cabinFilterCustomerProvided?: boolean;
  cabinFilterCustomerProvidedDetails?: string;
  fuelFilterId?: string;
  fuelFilterCustomerProvided?: boolean;
  fuelFilterCustomerProvidedDetails?: string;
  additionalProducts?: { productId: string; quantity: number }[];
  customProducts?: { name: string; quantity?: number; price: number }[];
  mileage: number;
  nextServiceMileage: number;
  laborCost?: number;
  price: number;
  // Payment fields
  paymentStatus?: 'paid' | 'partial' | 'unpaid';
  amountPaid?: number;
  dueDate?: Date;
}

export class OilChangeService {
  async createOilChange(tenantId: string, data: CreateOilChangeData): Promise<IOilChangeDocument> {
    const vehicle = await Vehicle.findOne({ _id: data.vehicleId, tenant: tenantId });
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }

    // Validate and fetch all employees within this tenant
    if (!data.employeeIds || data.employeeIds.length === 0) {
      throw new ApiError(400, 'At least one employee is required');
    }

    const employees = await Employee.find({ 
      _id: { $in: data.employeeIds },
      tenant: tenantId 
    });
    
    if (employees.length !== data.employeeIds.length) {
      throw new ApiError(404, 'One or more employees not found');
    }

    let oilProduct = null;
    // Only fetch and decrease stock if NOT customer provided
    if (!data.oilProductCustomerProvided) {
      if (!data.oilProductId) {
        throw new ApiError(400, 'Oil product is required');
      }
      oilProduct = await OilProduct.findOne({ _id: data.oilProductId, tenant: tenantId });
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

    // Optional oil filter: decrease stock only when selected from inventory
    if (!data.oilFilterCustomerProvided && data.oilFilterId) {
      const oilFilter = await Filter.findOne({ _id: data.oilFilterId, tenant: tenantId });
      if (!oilFilter) {
        throw new ApiError(404, 'Oil filter not found');
      }
      // Decrease oil filter stock
      oilFilter.stock -= 1;
      await oilFilter.save();
    }

    if (!data.airFilterCustomerProvided && data.airFilterId) {
      const airFilter = await Filter.findOne({ _id: data.airFilterId, tenant: tenantId });
      if (!airFilter) {
        throw new ApiError(404, 'Air filter not found');
      }
      airFilter.stock -= 1;
      await airFilter.save();
    }

    if (!data.cabinFilterCustomerProvided && data.cabinFilterId) {
      const cabinFilter = await Filter.findOne({ _id: data.cabinFilterId, tenant: tenantId });
      if (!cabinFilter) {
        throw new ApiError(404, 'Cabin filter not found');
      }
      cabinFilter.stock -= 1;
      await cabinFilter.save();
    }

    if (!data.fuelFilterCustomerProvided && data.fuelFilterId) {
      const fuelFilter = await Filter.findOne({ _id: data.fuelFilterId, tenant: tenantId });
      if (!fuelFilter) {
        throw new ApiError(404, 'Fuel filter not found');
      }
      fuelFilter.stock -= 1;
      await fuelFilter.save();
    }

    // Prepare additional products
    const additionalProducts = [];
    if (data.additionalProducts) {
      for (const item of data.additionalProducts) {
        const product = await Inventory.findOne({ _id: item.productId, tenant: tenantId });
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

    const customProducts = (data.customProducts || [])
      .filter((item: any) => item?.name && Number(item?.price) > 0)
      .map((item: any) => ({
        name: String(item.name).trim(),
        quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
        price: Number(item.price)
      }));

    // Calculate employee commissions
    const laborCost = data.laborCost || 0;
    const employeeCount = employees.length || 1;
    const totalDefaultRate = employees.reduce((sum, emp) => sum + (emp.commissionRate || 0), 0);
    const sharedDefaultRate = Math.round(((totalDefaultRate / employeeCount) / employeeCount) * 100) / 100;
    const employeeCommissions = employees.map(emp => {
      const commissionAmount = (laborCost * sharedDefaultRate) / 100;
      return {
        employee: emp._id,
        commissionRate: sharedDefaultRate,
        commissionAmount: commissionAmount
      };
    });

    // Calculate payment fields
    const paymentStatus = data.paymentStatus || 'unpaid';
    const amountPaid = data.amountPaid || 0;
    const amountDue = data.price - amountPaid;
    
    // Set default due date (7 days from now) if not provided
    const dueDate = data.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Set paidAt if fully paid
    const paidAt = paymentStatus === 'paid' ? new Date() : undefined;

    const oilChange = await OilChange.create({
      tenant: tenantId,
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
      airFilter: data.airFilterId || undefined,
      airFilterCustomerProvided: data.airFilterCustomerProvided || false,
      airFilterCustomerProvidedDetails: data.airFilterCustomerProvidedDetails,
      cabinFilter: data.cabinFilterId || undefined,
      cabinFilterCustomerProvided: data.cabinFilterCustomerProvided || false,
      cabinFilterCustomerProvidedDetails: data.cabinFilterCustomerProvidedDetails,
      fuelFilter: data.fuelFilterId || undefined,
      fuelFilterCustomerProvided: data.fuelFilterCustomerProvided || false,
      fuelFilterCustomerProvidedDetails: data.fuelFilterCustomerProvidedDetails,
      additionalProducts,
      customProducts,
      mileage: data.mileage,
      nextServiceMileage: data.nextServiceMileage,
      laborCost: laborCost,
      price: data.price,
      // Payment fields
      paymentStatus,
      amountPaid,
      amountDue,
      dueDate,
      paidAt
    });

    // Update customer total debt
    await this.updateCustomerDebt(tenantId, data.customerId);

    return oilChange.populate([
      'vehicle',
      'customer',
      'employees',
      'employeeCommissions.employee',
      'oilProduct',
      'oilFilter',
      'airFilter',
      'cabinFilter',
      'fuelFilter',
      'additionalProducts.product'
    ]);
  }

  /**
   * Update customer's total debt
   */
  private async updateCustomerDebt(tenantId: string, customerId: string): Promise<void> {
    const result = await OilChange.aggregate([
      {
        $match: {
          tenant: new (require('mongoose').Types.ObjectId)(tenantId),
          customer: new (require('mongoose').Types.ObjectId)(customerId),
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

    const totalDebt = result.length > 0 ? result[0].totalDebt : 0;

    await Customer.findOneAndUpdate(
      { _id: customerId, tenant: tenantId },
      { totalDebt }
    );
  }

  /**
   * Calculate amount due based on price and amount paid
   */
  calculateAmountDue(price: number, amountPaid: number): number {
    return Math.max(0, price - amountPaid);
  }

  async getAllOilChanges(tenantId: string, page: number = 1, limit: number = 10, includeArchived: boolean = false) {
    const skip = (page - 1) * limit;
    
    const filter: any = { tenant: tenantId };
    
    // By default, exclude archived oil changes
    if (!includeArchived) {
      filter.isArchived = { $ne: true };
    }
    
    const [data, totalItems] = await Promise.all([
      OilChange.find(filter)
        .populate('vehicle', 'plateNumber brand vehicleModel')
        .populate('customer', 'name phone')
        .populate('employees', 'name')
        .populate('archivedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OilChange.countDocuments(filter)
    ]);
    
    // Add totalCost field (same as price for now)
    const dataWithTotalCost = data.map(item => ({
      ...item,
      totalCost: item.price || 0
    }));
    
    return {
      data: dataWithTotalCost,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems
    };
  }

  async getArchivedOilChanges(tenantId: string, page: number = 1, limit: number = 100) {
    const skip = (page - 1) * limit;
    
    const filter = { tenant: tenantId, isArchived: true };
    
    const [data, totalItems] = await Promise.all([
      OilChange.find(filter)
        .populate('vehicle', 'plateNumber brand vehicleModel')
        .populate('customer', 'name phone')
        .populate('employees', 'name')
        .populate('archivedBy', 'name email')
        .sort({ archivedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OilChange.countDocuments(filter)
    ]);
    
    // Add totalCost field (same as price for now)
    const dataWithTotalCost = data.map(item => ({
      ...item,
      totalCost: item.price || 0
    }));
    
    return {
      data: dataWithTotalCost,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems
    };
  }

  async getOilChangeById(tenantId: string, oilChangeId: string) {
    const oilChange = await OilChange.findOne({ _id: oilChangeId, tenant: tenantId })
      .populate('vehicle', 'plateNumber brand vehicleModel engineType')
      .populate('customer', 'name phone')
      .populate('employees', 'name')
      .populate('employeeCommissions.employee', 'name')
      .populate({
        path: 'oilProduct',
        select: 'brand viscosity apiGrade volume price',
        populate: {
          path: 'brand',
          select: 'name'
        }
      })
      .populate('oilFilter', 'brandName partNumber price')
      .populate('airFilter', 'brandName partNumber price')
      .populate('cabinFilter', 'brandName partNumber price')
      .populate('fuelFilter', 'brandName partNumber price')
      .populate('additionalProducts.product')
      .lean();
    
    if (!oilChange) {
      throw new ApiError(404, 'Oil change not found');
    }
    
    // Transform oilProduct.brand to string for frontend
    if (oilChange.oilProduct && typeof oilChange.oilProduct === 'object') {
      const oilProduct = oilChange.oilProduct as any;
      if (oilProduct.brand && typeof oilProduct.brand === 'object' && oilProduct.brand.name) {
        oilProduct.brandName = oilProduct.brand.name;
        oilProduct.brand = oilProduct.brand.name; // Replace object with string
      }
    }
    
    console.log('Backend - Oil change oilProduct after transform:', oilChange.oilProduct);
    
    return oilChange;
  }

  async getOilChangeByIdPublic(oilChangeId: string) {
    const oilChange = await OilChange.findOne({ _id: oilChangeId })
      .populate('vehicle', 'plateNumber brand vehicleModel engineType')
      .populate('employees', 'name')
      .populate({
        path: 'oilProduct',
        select: 'brand viscosity apiGrade volume price',
        populate: {
          path: 'brand',
          select: 'name'
        }
      })
      .populate('oilFilter', 'brandName partNumber price')
      .populate('airFilter', 'brandName partNumber price')
      .populate('cabinFilter', 'brandName partNumber price')
      .populate('fuelFilter', 'brandName partNumber price')
      .lean();
    
    if (!oilChange) {
      throw new ApiError(404, 'Oil change not found');
    }
    
    // Transform oilProduct.brand to string for frontend
    if (oilChange.oilProduct && typeof oilChange.oilProduct === 'object') {
      const oilProduct = oilChange.oilProduct as any;
      if (oilProduct.brand && typeof oilProduct.brand === 'object' && oilProduct.brand.name) {
        oilProduct.brand = oilProduct.brand.name;
      }
    }
    
    // Remove sensitive data
    const publicData = {
      _id: oilChange._id,
      vehicle: oilChange.vehicle,
      employees: oilChange.employees,
      oilProduct: oilChange.oilProduct,
      oilProductCustomerProvided: oilChange.oilProductCustomerProvided,
      oilProductCustomerProvidedDetails: oilChange.oilProductCustomerProvidedDetails,
      oilQuantityUsed: oilChange.oilQuantityUsed,
      oilFilter: oilChange.oilFilter,
      oilFilterCustomerProvided: oilChange.oilFilterCustomerProvided,
      oilFilterCustomerProvidedDetails: oilChange.oilFilterCustomerProvidedDetails,
      airFilter: oilChange.airFilter,
      airFilterCustomerProvided: oilChange.airFilterCustomerProvided,
      airFilterCustomerProvidedDetails: oilChange.airFilterCustomerProvidedDetails,
      cabinFilter: oilChange.cabinFilter,
      cabinFilterCustomerProvided: oilChange.cabinFilterCustomerProvided,
      cabinFilterCustomerProvidedDetails: oilChange.cabinFilterCustomerProvidedDetails,
      fuelFilter: oilChange.fuelFilter,
      fuelFilterCustomerProvided: oilChange.fuelFilterCustomerProvided,
      fuelFilterCustomerProvidedDetails: oilChange.fuelFilterCustomerProvidedDetails,
      additionalProducts: oilChange.additionalProducts,
      customProducts: oilChange.customProducts,
      mileage: oilChange.mileage,
      nextServiceMileage: oilChange.nextServiceMileage,
      createdAt: oilChange.createdAt
    };
    
    return publicData;
  }

  async getTodayCount(tenantId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return OilChange.countDocuments({
      tenant: tenantId,
      createdAt: { $gte: today }
    });
  }

  async getMonthlyRevenue(tenantId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await OilChange.aggregate([
      {
        $match: {
          tenant: tenantId as any,
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

  async getRecentServices(tenantId: string, limit: number = 5): Promise<IOilChangeDocument[]> {
    return OilChange.find({ tenant: tenantId })
      .populate(['vehicle', 'customer', 'employees', 'employeeCommissions.employee', 'oilProduct'])
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getEmployeeCommissions(tenantId: string, employeeId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const match: any = {
      tenant: tenantId as any,
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

  async archiveOilChange(tenantId: string, oilChangeId: string, userId: string, reason?: string): Promise<void> {
    console.log('archiveOilChange called with:', { tenantId, oilChangeId, userId, reason });
    
    const oilChange = await OilChange.findOne({ 
      _id: oilChangeId,
      tenant: tenantId 
    });
    
    console.log('Found oil change:', oilChange ? 'Yes' : 'No');
    
    if (!oilChange) {
      throw new ApiError(404, 'Oil change not found');
    }

    console.log('Oil change isArchived:', oilChange.isArchived);
    
    if (oilChange.isArchived) {
      throw new ApiError(400, 'Oil change is already archived');
    }

    console.log('Creating archive entry...');
    
    await archiveService.createArchiveEntry(
      tenantId,
      'OilChange',
      oilChangeId,
      'archived',
      oilChange.toObject(),
      userId,
      [],
      reason
    );

    console.log('Archive entry created, updating oil change...');

    oilChange.isArchived = true;
    oilChange.archivedAt = new Date();
    oilChange.archivedBy = userId as any;
    await oilChange.save();
    
    console.log('Oil change archived successfully');
  }

  async restoreOilChange(tenantId: string, oilChangeId: string, userId: string) {
    const oilChange = await OilChange.findOne({ 
      _id: oilChangeId,
      tenant: tenantId 
    });
    
    if (!oilChange) {
      throw new ApiError(404, 'Oil change not found');
    }

    if (!oilChange.isArchived) {
      throw new ApiError(400, 'Oil change is not archived');
    }

    await archiveService.createArchiveEntry(
      tenantId,
      'OilChange',
      oilChangeId,
      'updated',
      oilChange.toObject(),
      userId,
      [{ field: 'isArchived', oldValue: true, newValue: false }],
      'Restored from archive'
    );

    oilChange.isArchived = false;
    oilChange.archivedAt = undefined;
    oilChange.archivedBy = undefined;
    await oilChange.save();

    return oilChange;
  }

  async getOilChangeHistory(tenantId: string, oilChangeId: string) {
    const oilChange = await OilChange.findOne({ 
      _id: oilChangeId,
      tenant: tenantId 
    });
    
    if (!oilChange) {
      throw new ApiError(404, 'Oil change not found');
    }

    return archiveService.getEntityHistory(tenantId, 'OilChange', oilChangeId);
  }

  async updateOilChange(tenantId: string, oilChangeId: string, data: any, userId: string) {
    const oilChange = await OilChange.findOne({ 
      _id: oilChangeId,
      tenant: tenantId 
    }).populate('oilProduct oilFilter airFilter cabinFilter fuelFilter employees');
    
    if (!oilChange) {
      throw new ApiError(404, 'Oil change not found');
    }

    // Track changes for archive
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    
    // Update employees if changed
    if (data.employeeIds && Array.isArray(data.employeeIds)) {
      const oldEmployeeIds = oilChange.employees.map((e: any) => e._id.toString()).sort();
      const newEmployeeIds = data.employeeIds.sort();
      
      if (JSON.stringify(oldEmployeeIds) !== JSON.stringify(newEmployeeIds)) {
        // Validate all employees exist
        const newEmployees = await Employee.find({ 
          _id: { $in: newEmployeeIds },
          tenant: tenantId 
        });
        
        if (newEmployees.length !== newEmployeeIds.length) {
          throw new ApiError(404, 'One or more employees not found');
        }
        
        // Use provided commissions if available, otherwise use default rates
        let employeeCommissions;
        if (data.employeeCommissions && Array.isArray(data.employeeCommissions)) {
          employeeCommissions = data.employeeCommissions;
        } else {
          // Recalculate commissions using default rates
          const laborCost = data.laborCost !== undefined ? data.laborCost : oilChange.laborCost;
          const employeeCount = newEmployees.length || 1;
          const totalDefaultRate = newEmployees.reduce((sum, emp) => sum + (emp.commissionRate || 0), 0);
          const sharedDefaultRate = Math.round(((totalDefaultRate / employeeCount) / employeeCount) * 100) / 100;
          employeeCommissions = newEmployees.map(emp => {
            return ({
            employee: emp._id,
            commissionRate: sharedDefaultRate,
            commissionAmount: (laborCost * sharedDefaultRate) / 100
          });
          });
        }
        
        changes.push({ 
          field: 'employees', 
          oldValue: oldEmployeeIds.join(', '),
          newValue: newEmployeeIds.join(', ')
        });
        
        oilChange.employees = newEmployeeIds as any;
        oilChange.employeeCommissions = employeeCommissions as any;
      }
    }
    
    // Update employee commissions if provided (even without employee changes)
    if (data.employeeCommissions && Array.isArray(data.employeeCommissions)) {
      const oldCommissions = JSON.stringify(oilChange.employeeCommissions);
      const newCommissions = JSON.stringify(data.employeeCommissions);
      
      if (oldCommissions !== newCommissions) {
        changes.push({ 
          field: 'employeeCommissions', 
          oldValue: oilChange.employeeCommissions,
          newValue: data.employeeCommissions
        });
        
        oilChange.employeeCommissions = data.employeeCommissions as any;
      }
    }

    // Update additional products if changed
    if (data.additionalProducts && Array.isArray(data.additionalProducts)) {
      const incoming = data.additionalProducts
        .filter((ap: any) => ap?.productId)
        .map((ap: any) => ({
          productId: String(ap.productId),
          quantity: Number(ap.quantity) > 0 ? Number(ap.quantity) : 1
        }));

      const oldList = (oilChange.additionalProducts || []).map((ap: any) => ({
        productId: String(ap.product),
        quantity: Number(ap.quantity) || 1
      }));

      const normalize = (arr: Array<{ productId: string; quantity: number }>) =>
        arr
          .slice()
          .sort((a, b) => a.productId.localeCompare(b.productId))
          .map((x) => `${x.productId}:${x.quantity}`)
          .join('|');

      if (normalize(oldList) !== normalize(incoming)) {
        // Return old additional products to stock
        for (const oldItem of oldList) {
          const inv = await Inventory.findOne({ _id: oldItem.productId, tenant: tenantId });
          if (inv) {
            inv.stock += oldItem.quantity;
            await inv.save();
          }
        }

        const nextAdditionalProducts: Array<{ product: any; quantity: number; price: number }> = [];
        for (const newItem of incoming) {
          const inv = await Inventory.findOne({ _id: newItem.productId, tenant: tenantId });
          if (!inv) {
            throw new ApiError(404, 'Additional product not found');
          }
          if ((inv.stock || 0) < newItem.quantity) {
            throw new ApiError(400, `${inv.name || 'Additional product'} stock yetarli emas`);
          }
          inv.stock -= newItem.quantity;
          await inv.save();

          nextAdditionalProducts.push({
            product: inv._id,
            quantity: newItem.quantity,
            price: (inv.price || 0) * newItem.quantity
          });
        }

        changes.push({
          field: 'additionalProducts',
          oldValue: oldList,
          newValue: incoming
        });

        oilChange.additionalProducts = nextAdditionalProducts as any;
      }
    }

    if (data.customProducts && Array.isArray(data.customProducts)) {
      const incomingCustom = data.customProducts
        .filter((cp: any) => cp?.name && Number(cp?.price) > 0)
        .map((cp: any) => ({
          name: String(cp.name).trim(),
          quantity: Number(cp.quantity) > 0 ? Number(cp.quantity) : 1,
          price: Number(cp.price)
        }));

      const oldCustom = (oilChange.customProducts || []).map((cp: any) => ({
        name: String(cp.name || '').trim(),
        quantity: Number(cp.quantity) || 1,
        price: Number(cp.price) || 0
      }));

      const normalizeCustom = (arr: Array<{ name: string; quantity: number; price: number }>) =>
        arr
          .slice()
          .sort((a, b) => `${a.name}:${a.price}`.localeCompare(`${b.name}:${b.price}`))
          .map((x) => `${x.name}:${x.quantity}:${x.price}`)
          .join('|');

      if (normalizeCustom(oldCustom) !== normalizeCustom(incomingCustom)) {
        changes.push({
          field: 'customProducts',
          oldValue: oldCustom,
          newValue: incomingCustom
        });
        oilChange.customProducts = incomingCustom as any;
      }
    }
    
    // Update oil product if changed
    if (data.oilProductId !== undefined) {
      const oldProductId = oilChange.oilProduct?._id?.toString();
      const newProductId = data.oilProductId;
      
      if (oldProductId !== newProductId) {
        const oldProduct = oldProductId ? await OilProduct.findById(oldProductId) : null;
        
        // Return old product to stock if it exists
        if (oldProduct) {
          oldProduct.stock += 1;
          await oldProduct.save();
        }
        
        // Handle new product
        if (newProductId) {
          const newProduct = await OilProduct.findOne({ _id: newProductId, tenant: tenantId });
          
          if (!newProduct) {
            throw new ApiError(404, 'New oil product not found');
          }
          
          if (newProduct.stock < 1) {
            throw new ApiError(400, 'New oil product out of stock');
          }
          
          // Decrease new product stock
          newProduct.stock -= 1;
          await newProduct.save();
          
          changes.push({ 
            field: 'oilProduct', 
            oldValue: oldProduct ? `${oldProduct.brand} ${oldProduct.viscosity}` : 'None',
            newValue: `${newProduct.brand} ${newProduct.viscosity}`
          });
          oilChange.oilProduct = newProduct._id as any;
        } else {
          // Changing to customer provided (null)
          changes.push({ 
            field: 'oilProduct', 
            oldValue: oldProduct ? `${oldProduct.brand} ${oldProduct.viscosity}` : 'None',
            newValue: 'Customer Provided'
          });
          oilChange.oilProduct = undefined;
        }
      }
    }
    
    // Update oil filter if changed
    if (data.oilFilterId !== undefined) {
      const oldFilterId = oilChange.oilFilter?._id?.toString();
      const newFilterId = data.oilFilterId || null;
      
      if (oldFilterId !== newFilterId) {
        // Return old filter to stock
        if (oldFilterId) {
          const oldFilter = await Filter.findById(oldFilterId);
          if (oldFilter) {
            oldFilter.stock += 1;
            await oldFilter.save();
          }
        }
        
        // Decrease new filter stock
        if (newFilterId) {
          const newFilter = await Filter.findOne({ _id: newFilterId, tenant: tenantId });
          if (!newFilter) {
            throw new ApiError(404, 'New oil filter not found');
          }
          newFilter.stock -= 1;
          await newFilter.save();
          oilChange.oilFilter = newFilter._id as any;
        } else {
          oilChange.oilFilter = undefined;
        }
        
        changes.push({ 
          field: 'oilFilter', 
          oldValue: oldFilterId || 'None',
          newValue: newFilterId || 'None'
        });
      }
    }
    
    // Update air filter if changed
    if (data.airFilterId !== undefined) {
      const oldFilterId = oilChange.airFilter?._id?.toString();
      const newFilterId = data.airFilterId || null;
      
      if (oldFilterId !== newFilterId) {
        if (oldFilterId) {
          const oldFilter = await Filter.findById(oldFilterId);
          if (oldFilter) {
            oldFilter.stock += 1;
            await oldFilter.save();
          }
        }
        
        if (newFilterId) {
          const newFilter = await Filter.findOne({ _id: newFilterId, tenant: tenantId });
          if (!newFilter) {
            throw new ApiError(404, 'New air filter not found');
          }
          newFilter.stock -= 1;
          await newFilter.save();
          oilChange.airFilter = newFilter._id as any;
        } else {
          oilChange.airFilter = undefined;
        }
        
        changes.push({ 
          field: 'airFilter', 
          oldValue: oldFilterId || 'None',
          newValue: newFilterId || 'None'
        });
      }
    }
    
    // Update cabin filter if changed
    if (data.cabinFilterId !== undefined) {
      const oldFilterId = oilChange.cabinFilter?._id?.toString();
      const newFilterId = data.cabinFilterId || null;
      
      if (oldFilterId !== newFilterId) {
        if (oldFilterId) {
          const oldFilter = await Filter.findById(oldFilterId);
          if (oldFilter) {
            oldFilter.stock += 1;
            await oldFilter.save();
          }
        }
        
        if (newFilterId) {
          const newFilter = await Filter.findOne({ _id: newFilterId, tenant: tenantId });
          if (!newFilter) {
            throw new ApiError(404, 'New cabin filter not found');
          }
          newFilter.stock -= 1;
          await newFilter.save();
          oilChange.cabinFilter = newFilter._id as any;
        } else {
          oilChange.cabinFilter = undefined;
        }
        
        changes.push({ 
          field: 'cabinFilter', 
          oldValue: oldFilterId || 'None',
          newValue: newFilterId || 'None'
        });
      }
    }
    
    // Update fuel filter if changed
    if (data.fuelFilterId !== undefined) {
      const oldFilterId = oilChange.fuelFilter?._id?.toString();
      const newFilterId = data.fuelFilterId || null;
      
      if (oldFilterId !== newFilterId) {
        if (oldFilterId) {
          const oldFilter = await Filter.findById(oldFilterId);
          if (oldFilter) {
            oldFilter.stock += 1;
            await oldFilter.save();
          }
        }
        
        if (newFilterId) {
          const newFilter = await Filter.findOne({ _id: newFilterId, tenant: tenantId });
          if (!newFilter) {
            throw new ApiError(404, 'New fuel filter not found');
          }
          newFilter.stock -= 1;
          await newFilter.save();
          oilChange.fuelFilter = newFilter._id as any;
        } else {
          oilChange.fuelFilter = undefined;
        }
        
        changes.push({ 
          field: 'fuelFilter', 
          oldValue: oldFilterId || 'None',
          newValue: newFilterId || 'None'
        });
      }
    }
    
    if (data.mileage !== undefined && data.mileage !== oilChange.mileage) {
      changes.push({ field: 'mileage', oldValue: oilChange.mileage, newValue: data.mileage });
      oilChange.mileage = data.mileage;
    }
    
    if (data.nextServiceMileage !== undefined && data.nextServiceMileage !== oilChange.nextServiceMileage) {
      changes.push({ field: 'nextServiceMileage', oldValue: oilChange.nextServiceMileage, newValue: data.nextServiceMileage });
      oilChange.nextServiceMileage = data.nextServiceMileage;
    }
    
    if (data.laborCost !== undefined && data.laborCost !== oilChange.laborCost) {
      changes.push({ field: 'laborCost', oldValue: oilChange.laborCost, newValue: data.laborCost });
      oilChange.laborCost = data.laborCost;
    }

    if (data.oilQuantityUsed !== undefined && data.oilQuantityUsed !== oilChange.oilQuantityUsed) {
      changes.push({ field: 'oilQuantityUsed', oldValue: oilChange.oilQuantityUsed, newValue: data.oilQuantityUsed });
      oilChange.oilQuantityUsed = data.oilQuantityUsed;
    }

    // Update customer provided fields
    if (data.oilProductCustomerProvided !== undefined && data.oilProductCustomerProvided !== oilChange.oilProductCustomerProvided) {
      changes.push({ field: 'oilProductCustomerProvided', oldValue: oilChange.oilProductCustomerProvided, newValue: data.oilProductCustomerProvided });
      oilChange.oilProductCustomerProvided = data.oilProductCustomerProvided;
    }

    if (data.oilProductCustomerProvidedDetails !== undefined && data.oilProductCustomerProvidedDetails !== oilChange.oilProductCustomerProvidedDetails) {
      changes.push({ field: 'oilProductCustomerProvidedDetails', oldValue: oilChange.oilProductCustomerProvidedDetails, newValue: data.oilProductCustomerProvidedDetails });
      oilChange.oilProductCustomerProvidedDetails = data.oilProductCustomerProvidedDetails;
    }

    if (data.oilFilterCustomerProvided !== undefined && data.oilFilterCustomerProvided !== oilChange.oilFilterCustomerProvided) {
      changes.push({ field: 'oilFilterCustomerProvided', oldValue: oilChange.oilFilterCustomerProvided, newValue: data.oilFilterCustomerProvided });
      oilChange.oilFilterCustomerProvided = data.oilFilterCustomerProvided;
    }

    if (data.oilFilterCustomerProvidedDetails !== undefined && data.oilFilterCustomerProvidedDetails !== oilChange.oilFilterCustomerProvidedDetails) {
      changes.push({ field: 'oilFilterCustomerProvidedDetails', oldValue: oilChange.oilFilterCustomerProvidedDetails, newValue: data.oilFilterCustomerProvidedDetails });
      oilChange.oilFilterCustomerProvidedDetails = data.oilFilterCustomerProvidedDetails;
    }

    if (data.airFilterCustomerProvided !== undefined && data.airFilterCustomerProvided !== oilChange.airFilterCustomerProvided) {
      changes.push({ field: 'airFilterCustomerProvided', oldValue: oilChange.airFilterCustomerProvided, newValue: data.airFilterCustomerProvided });
      oilChange.airFilterCustomerProvided = data.airFilterCustomerProvided;
    }

    if (data.airFilterCustomerProvidedDetails !== undefined && data.airFilterCustomerProvidedDetails !== oilChange.airFilterCustomerProvidedDetails) {
      changes.push({ field: 'airFilterCustomerProvidedDetails', oldValue: oilChange.airFilterCustomerProvidedDetails, newValue: data.airFilterCustomerProvidedDetails });
      oilChange.airFilterCustomerProvidedDetails = data.airFilterCustomerProvidedDetails;
    }

    if (data.cabinFilterCustomerProvided !== undefined && data.cabinFilterCustomerProvided !== oilChange.cabinFilterCustomerProvided) {
      changes.push({ field: 'cabinFilterCustomerProvided', oldValue: oilChange.cabinFilterCustomerProvided, newValue: data.cabinFilterCustomerProvided });
      oilChange.cabinFilterCustomerProvided = data.cabinFilterCustomerProvided;
    }

    if (data.cabinFilterCustomerProvidedDetails !== undefined && data.cabinFilterCustomerProvidedDetails !== oilChange.cabinFilterCustomerProvidedDetails) {
      changes.push({ field: 'cabinFilterCustomerProvidedDetails', oldValue: oilChange.cabinFilterCustomerProvidedDetails, newValue: data.cabinFilterCustomerProvidedDetails });
      oilChange.cabinFilterCustomerProvidedDetails = data.cabinFilterCustomerProvidedDetails;
    }

    if (data.fuelFilterCustomerProvided !== undefined && data.fuelFilterCustomerProvided !== oilChange.fuelFilterCustomerProvided) {
      changes.push({ field: 'fuelFilterCustomerProvided', oldValue: oilChange.fuelFilterCustomerProvided, newValue: data.fuelFilterCustomerProvided });
      oilChange.fuelFilterCustomerProvided = data.fuelFilterCustomerProvided;
    }

    if (data.fuelFilterCustomerProvidedDetails !== undefined && data.fuelFilterCustomerProvidedDetails !== oilChange.fuelFilterCustomerProvidedDetails) {
      changes.push({ field: 'fuelFilterCustomerProvidedDetails', oldValue: oilChange.fuelFilterCustomerProvidedDetails, newValue: data.fuelFilterCustomerProvidedDetails });
      oilChange.fuelFilterCustomerProvidedDetails = data.fuelFilterCustomerProvidedDetails;
    }

    // Update payment fields
    if (data.paymentStatus !== undefined && data.paymentStatus !== oilChange.paymentStatus) {
      changes.push({ field: 'paymentStatus', oldValue: oilChange.paymentStatus, newValue: data.paymentStatus });
      oilChange.paymentStatus = data.paymentStatus;
      
      if (data.paymentStatus === 'paid') {
        oilChange.paidAt = new Date();
      }
    }

    if (data.amountPaid !== undefined && data.amountPaid !== oilChange.amountPaid) {
      changes.push({ field: 'amountPaid', oldValue: oilChange.amountPaid, newValue: data.amountPaid });
      oilChange.amountPaid = data.amountPaid;
      
      // Recalculate amountDue
      const newPrice = data.price !== undefined ? data.price : oilChange.price;
      oilChange.amountDue = newPrice - data.amountPaid;
      
      // Update payment status based on amounts
      if (oilChange.amountDue === 0) {
        oilChange.paymentStatus = 'paid';
        oilChange.paidAt = new Date();
      } else if (oilChange.amountPaid > 0 && oilChange.amountDue > 0) {
        oilChange.paymentStatus = 'partial';
      } else if (oilChange.amountPaid === 0) {
        oilChange.paymentStatus = 'unpaid';
      }
    }

    if (data.dueDate !== undefined && data.dueDate !== oilChange.dueDate) {
      changes.push({ field: 'dueDate', oldValue: oilChange.dueDate, newValue: data.dueDate });
      oilChange.dueDate = data.dueDate;
    }

    // If price changed, recalculate amountDue
    if (data.price !== undefined) {
      console.log('Price update:', {
        oldPrice: oilChange.price,
        newPrice: data.price,
        paymentStatus: oilChange.paymentStatus,
        amountPaid: oilChange.amountPaid
      });
      
      const oldPrice = oilChange.price;
      const oldAmountDue = oilChange.amountDue;
      
      // Update price
      oilChange.price = data.price;
      
      // Recalculate amountDue based on payment status
      if (oilChange.paymentStatus === 'paid') {
        oilChange.amountDue = 0;
      } else if (oilChange.paymentStatus === 'partial') {
        oilChange.amountDue = data.price - oilChange.amountPaid;
      } else { // unpaid
        oilChange.amountDue = data.price;
      }
      
      console.log('After calculation:', {
        newPrice: oilChange.price,
        newAmountDue: oilChange.amountDue
      });
      
      if (oldPrice !== data.price) {
        changes.push({ field: 'price', oldValue: oldPrice, newValue: data.price });
      }
      
      if (oldAmountDue !== oilChange.amountDue) {
        changes.push({ field: 'amountDue', oldValue: oldAmountDue, newValue: oilChange.amountDue });
      }
    }
    
    // If price not provided, recalculate from products and labor
    if (data.price === undefined) {
      const oldPrice = oilChange.price;
      let calculatedPrice = oilChange.laborCost || 0;
      
      // Add oil product price
      if (oilChange.oilProduct && !oilChange.oilProductCustomerProvided) {
        const oilProduct = await OilProduct.findById(oilChange.oilProduct);
        if (oilProduct && oilChange.oilQuantityUsed) {
          const pricePerLiter = oilProduct.price / oilProduct.volume;
          calculatedPrice += pricePerLiter * oilChange.oilQuantityUsed;
        }
      }
      
      // Add filter prices
      if (oilChange.oilFilter && !oilChange.oilFilterCustomerProvided) {
        const filter = await Filter.findById(oilChange.oilFilter);
        if (filter) calculatedPrice += filter.price;
      }
      if (oilChange.airFilter && !oilChange.airFilterCustomerProvided) {
        const filter = await Filter.findById(oilChange.airFilter);
        if (filter) calculatedPrice += filter.price;
      }
      if (oilChange.cabinFilter && !oilChange.cabinFilterCustomerProvided) {
        const filter = await Filter.findById(oilChange.cabinFilter);
        if (filter) calculatedPrice += filter.price;
      }
      if (oilChange.fuelFilter && !oilChange.fuelFilterCustomerProvided) {
        const filter = await Filter.findById(oilChange.fuelFilter);
        if (filter) calculatedPrice += filter.price;
      }
      
      // Add additional products
      if (oilChange.additionalProducts && oilChange.additionalProducts.length > 0) {
        for (const ap of oilChange.additionalProducts) {
          calculatedPrice += ap.price * ap.quantity;
        }
      }

      if (oilChange.customProducts && oilChange.customProducts.length > 0) {
        for (const cp of oilChange.customProducts as any[]) {
          calculatedPrice += (Number(cp.price) || 0) * (Number(cp.quantity) || 1);
        }
      }
      
      // Update price if changed
      if (oldPrice !== calculatedPrice) {
        oilChange.price = calculatedPrice;
        changes.push({ field: 'price', oldValue: oldPrice, newValue: calculatedPrice });
        
        // Recalculate amountDue
        const oldAmountDue = oilChange.amountDue;
        if (oilChange.paymentStatus === 'paid') {
          oilChange.amountDue = 0;
        } else if (oilChange.paymentStatus === 'partial') {
          oilChange.amountDue = calculatedPrice - oilChange.amountPaid;
        } else {
          oilChange.amountDue = calculatedPrice;
        }
        
        if (oldAmountDue !== oilChange.amountDue) {
          changes.push({ field: 'amountDue', oldValue: oldAmountDue, newValue: oilChange.amountDue });
        }
      }
    }

    await oilChange.save();

    // Update customer debt if payment-related fields changed
    const paymentFieldsChanged = changes.some(c => 
      ['paymentStatus', 'amountPaid', 'amountDue', 'price'].includes(c.field)
    );
    
    if (paymentFieldsChanged) {
      await this.updateCustomerDebt(tenantId, oilChange.customer.toString());
    }

    // Create archive entry if there were changes
    if (changes.length > 0) {
      await archiveService.createArchiveEntry(
        tenantId,
        'OilChange',
        oilChangeId,
        'updated',
        oilChange.toObject(),
        userId,
        changes
      );
    }

    return oilChange;
  }

  async completeOilChange(tenantId: string, oilChangeId: string, userId: string): Promise<IOilChangeDocument> {
    const oilChange = await OilChange.findOne({ 
      _id: oilChangeId,
      tenant: tenantId 
    });
    
    if (!oilChange) {
      throw new ApiError(404, 'Oil change not found');
    }

    if (oilChange.status === 'completed') {
      throw new ApiError(400, 'Oil change is already completed');
    }

    const oldStatus = oilChange.status;
    oilChange.status = 'completed';
    oilChange.completedAt = new Date();
    
    await oilChange.save();

    // Create archive entry for status change
    await archiveService.createArchiveEntry(
      tenantId,
      'OilChange',
      oilChangeId,
      'updated',
      oilChange.toObject(),
      userId,
      [{ field: 'status', oldValue: oldStatus, newValue: 'completed' }],
      'Oil change completed'
    );

    return oilChange.populate(['vehicle', 'customer', 'employees', 'employeeCommissions.employee', 'oilProduct', 'oilFilter']);
  }
}
