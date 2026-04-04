import Service, { IServiceDocument, IServiceItem, IServiceItemItem } from '../models/Service';
import UniversalInventory from '../models/UniversalInventory';
import Vehicle from '../models/Vehicle';
import Customer from '../models/Customer';
import Employee from '../models/Employee';
import { ApiError } from '../utils/ApiError';
import { ArchiveService } from './archiveService';

// Interface for creating work session with multiple services
interface CreateWorkSessionData {
  vehicleId: string;
  customerId: string;
  services: {
    serviceName: string;
    items: {
      itemName: string;
      itemType: 'inventory' | 'custom';
      inventoryId?: string;
      quantity: number;
      unitPrice: number;
    }[];
    laborCost: number;
    employees: string[]; // Each service has its own employees
  }[];
  employees?: string[]; // Deprecated: kept for backward compatibility
  mileage?: number;
  notes?: string;
  paymentStatus?: 'paid' | 'partial' | 'unpaid';
  amountPaid?: number;
  dueDate?: Date | string; // Accept both Date and string
}

interface UpdateServiceData {
  services?: {
    serviceName: string;
    items: {
      itemName: string;
      itemType: 'inventory' | 'custom';
      inventoryId?: string;
      quantity: number;
      unitPrice: number;
    }[];
    laborCost: number;
    employees: string[];
  }[];
  employees?: string[]; // Deprecated: kept for backward compatibility
  mileage?: number;
  notes?: string;
  paymentStatus?: 'paid' | 'partial' | 'unpaid';
  amountPaid?: number;
  dueDate?: Date | string; // Accept both Date and string
}

interface ListServicesFilters {
  vehicleId?: string;
  customerId?: string;
  paymentStatus?: 'paid' | 'partial' | 'unpaid';
  status?: 'active' | 'completed';
}

export class ServiceService {
  private archiveService: ArchiveService;

  constructor() {
    this.archiveService = new ArchiveService();
  }

  async createWorkSession(
    tenantId: string,
    data: CreateWorkSessionData,
    userId: string
  ): Promise<IServiceDocument> {
    console.log('createWorkSession called with data:', JSON.stringify(data, null, 2));
    
    if (!data.services || data.services.length === 0) {
      throw new ApiError(400, 'Work session must have at least one service');
    }

    for (const service of data.services) {
      if (!service.serviceName || service.serviceName.trim() === '') {
        throw new ApiError(400, 'Service name is required');
      }
      if (!Array.isArray(service.items)) {
        throw new ApiError(400, 'Service items must be an array');
      }
      if (service.items.length === 0 && (!service.laborCost || service.laborCost <= 0)) {
        throw new ApiError(400, `Service "${service.serviceName}" must have at least one item or labor cost`);
      }
      if (!Array.isArray(service.employees)) {
        throw new ApiError(400, 'Service employees must be an array');
      }
    }

    const vehicle = await Vehicle.findOne({ _id: data.vehicleId, tenant: tenantId });
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }

    const customer = await Customer.findOne({ _id: data.customerId, tenant: tenantId });
    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    // Validate employees for each service
    const allEmployeeIds = new Set<string>();
    for (const service of data.services) {
      if (service.employees && service.employees.length > 0) {
        service.employees.forEach(id => allEmployeeIds.add(id));
      }
    }

    if (allEmployeeIds.size > 0) {
      const employees = await Employee.find({
        _id: { $in: Array.from(allEmployeeIds) },
        tenant: tenantId
      });

      if (employees.length !== allEmployeeIds.size) {
        throw new ApiError(404, 'One or more employees not found');
      }
    }

    const services: IServiceItem[] = [];
    for (const serviceData of data.services) {
      await this.validateServiceItems(tenantId, serviceData.items);

      const items: IServiceItemItem[] = serviceData.items.map(item => ({
        itemName: item.itemName,
        itemType: item.itemType,
        inventoryId: item.inventoryId ? item.inventoryId as any : undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      }));

      const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const serviceTotal = itemsTotal + serviceData.laborCost;

      services.push({
        serviceName: serviceData.serviceName,
        items,
        laborCost: serviceData.laborCost,
        employees: serviceData.employees.map(id => id as any),
        employeeCommissions: [],
        totalPrice: serviceTotal
      });

      await this.updateInventoryStock(tenantId, items);
    }

    const paymentStatus = data.paymentStatus || 'unpaid';
    const totalPrice = services.reduce((sum, service) => sum + service.totalPrice, 0);
    const amountPaid = data.amountPaid || 0;
    const amountDue = totalPrice - amountPaid;
    const dueDateValue = data.dueDate 
      ? (typeof data.dueDate === 'string' ? new Date(data.dueDate) : data.dueDate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const paidAt = paymentStatus === 'paid' ? new Date() : undefined;

    const workSession = await Service.create({
      tenant: tenantId,
      vehicle: data.vehicleId,
      customer: data.customerId,
      services,
      mileage: data.mileage,
      notes: data.notes,
      totalPrice,
      paymentStatus,
      amountPaid,
      amountDue,
      dueDate: dueDateValue,
      paidAt
    });

    await this.archiveService.createArchiveEntry(
      tenantId,
      'Service',
      workSession._id.toString(),
      'created',
      workSession.toObject(),
      userId,
      [],
      'Work session created'
    );

    await this.updateCustomerDebt(tenantId, data.customerId);

    return workSession.populate([
      'vehicle',
      'customer',
      { path: 'services.employees', model: 'Employee' },
      { path: 'services.items.inventoryId', model: 'UniversalInventory' }
    ]);
  }

  private async validateServiceItems(
    tenantId: string,
    serviceItems: {
      itemName: string;
      itemType: 'inventory' | 'custom';
      inventoryId?: string;
      quantity: number;
      unitPrice: number;
    }[]
  ): Promise<void> {
    for (const item of serviceItems) {
      if (item.quantity <= 0) {
        throw new ApiError(400, `Quantity must be positive for item: ${item.itemName}`);
      }

      if (item.unitPrice < 0) {
        throw new ApiError(400, `Unit price cannot be negative for item: ${item.itemName}`);
      }

      if (item.itemType === 'inventory') {
        if (!item.inventoryId) {
          throw new ApiError(400, `Inventory ID is required for inventory item: ${item.itemName}`);
        }

        const inventoryItem = await UniversalInventory.findOne({
          _id: item.inventoryId,
          tenant: tenantId
        });

        if (!inventoryItem) {
          throw new ApiError(404, `Inventory item not found: ${item.itemName}`);
        }

        if (inventoryItem.stock < item.quantity) {
          throw new ApiError(
            400,
            `Insufficient stock for ${item.itemName}. Available: ${inventoryItem.stock}, Required: ${item.quantity}`
          );
        }
      } else if (item.itemType === 'custom') {
        if (!item.itemName || item.itemName.trim() === '') {
          throw new ApiError(400, 'Item name is required for custom items');
        }
      }
    }
  }

  private async updateInventoryStock(
    tenantId: string,
    serviceItems: IServiceItemItem[]
  ): Promise<void> {
    for (const item of serviceItems) {
      if (item.itemType === 'inventory' && item.inventoryId) {
        const inventoryItem = await UniversalInventory.findOne({
          _id: item.inventoryId,
          tenant: tenantId
        });

        if (inventoryItem) {
          inventoryItem.stock -= item.quantity;
          await inventoryItem.save();
        }
      }
    }
  }

  private async updateCustomerDebt(tenantId: string, customerId: string): Promise<void> {
    const mongoose = require('mongoose');
    const OilChange = require('../models/OilChange').default;
    
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

    const serviceDebt = serviceResult.length > 0 ? serviceResult[0].totalDebt : 0;

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

    const oilChangeDebt = oilChangeResult.length > 0 ? oilChangeResult[0].totalDebt : 0;
    const totalDebt = serviceDebt + oilChangeDebt;

    await Customer.findOneAndUpdate(
      { _id: customerId, tenant: tenantId },
      { totalDebt }
    );
  }

  async updateService(
    tenantId: string,
    serviceId: string,
    data: UpdateServiceData,
    userId: string
  ): Promise<IServiceDocument> {
    const existingService = await Service.findOne({
      _id: serviceId,
      tenant: tenantId
    });

    if (!existingService) {
      throw new ApiError(404, 'Service not found');
    }

    const changes: any[] = [];

    if (data.services) {
      for (const service of existingService.services) {
        await this.revertInventoryStock(tenantId, service.items);
      }

      const newServices: IServiceItem[] = [];
      for (const serviceData of data.services) {
        await this.validateServiceItems(tenantId, serviceData.items);

        const items: IServiceItemItem[] = serviceData.items.map(item => ({
          itemName: item.itemName,
          itemType: item.itemType,
          inventoryId: item.inventoryId ? item.inventoryId as any : undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        }));

        const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const serviceTotal = itemsTotal + serviceData.laborCost;

        newServices.push({
          serviceName: serviceData.serviceName,
          items,
          laborCost: serviceData.laborCost,
          employees: serviceData.employees.map(id => id as any),
          employeeCommissions: [],
          totalPrice: serviceTotal
        });

        await this.updateInventoryStock(tenantId, items);
      }

      changes.push({
        field: 'services',
        oldValue: existingService.services,
        newValue: newServices
      });

      existingService.services = newServices;
    }

    if (data.employees !== undefined) {
      console.warn('Warning: Top-level employees field is deprecated. Use per-service employees instead.');
    }

    if (data.mileage !== undefined && data.mileage !== existingService.mileage) {
      changes.push({ field: 'mileage', oldValue: existingService.mileage, newValue: data.mileage });
      existingService.mileage = data.mileage;
    }

    if (data.notes !== undefined && data.notes !== existingService.notes) {
      changes.push({ field: 'notes', oldValue: existingService.notes, newValue: data.notes });
      existingService.notes = data.notes;
    }

    if (data.paymentStatus !== undefined && data.paymentStatus !== existingService.paymentStatus) {
      changes.push({ field: 'paymentStatus', oldValue: existingService.paymentStatus, newValue: data.paymentStatus });
      existingService.paymentStatus = data.paymentStatus;
    }

    if (data.amountPaid !== undefined && data.amountPaid !== existingService.amountPaid) {
      changes.push({ field: 'amountPaid', oldValue: existingService.amountPaid, newValue: data.amountPaid });
      existingService.amountPaid = data.amountPaid;
    }

    if (data.dueDate !== undefined) {
      const newDate = typeof data.dueDate === 'string' ? new Date(data.dueDate) : data.dueDate;
      const oldDate = existingService.dueDate?.toISOString();
      const newDateStr = newDate?.toISOString();
      if (oldDate !== newDateStr) {
        changes.push({ field: 'dueDate', oldValue: existingService.dueDate, newValue: newDate });
        existingService.dueDate = newDate;
      }
    }

    await existingService.save();

    if (changes.length > 0) {
      await this.archiveService.createArchiveEntry(
        tenantId,
        'Service',
        serviceId,
        'updated',
        existingService.toObject(),
        userId,
        changes,
        'Work session updated'
      );
    }

    await this.updateCustomerDebt(tenantId, existingService.customer.toString());

    return existingService.populate([
      'vehicle',
      'customer',
      { path: 'services.employees', model: 'Employee' },
      { path: 'services.items.inventoryId', model: 'UniversalInventory' }
    ]);
  }

  async getServiceById(tenantId: string, serviceId: string): Promise<IServiceDocument> {
    const service = await Service.findOne({
      _id: serviceId,
      tenant: tenantId
    }).populate([
      'vehicle',
      'customer',
      { path: 'services.employees', model: 'Employee' },
      { path: 'services.items.inventoryId', model: 'UniversalInventory' }
    ]);

    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    return service;
  }

  async listServices(tenantId: string, filters: ListServicesFilters): Promise<IServiceDocument[]> {
    const query: any = {
      tenant: tenantId,
      isArchived: { $ne: true }
    };

    if (filters.vehicleId) {
      query.vehicle = filters.vehicleId;
    }

    if (filters.customerId) {
      query.customer = filters.customerId;
    }

    if (filters.paymentStatus) {
      query.paymentStatus = filters.paymentStatus;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const services = await Service.find(query)
      .sort({ createdAt: -1 })
      .populate([
        'vehicle',
        'customer',
        { path: 'services.employees', model: 'Employee' },
        { path: 'services.items.inventoryId', model: 'UniversalInventory' }
      ]);

    return services;
  }

  async archiveWorkSession(
    tenantId: string,
    serviceId: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    const service = await Service.findOne({
      _id: serviceId,
      tenant: tenantId
    });

    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    if (service.isArchived) {
      throw new ApiError(400, 'Service is already archived');
    }

    service.isArchived = true;
    service.archivedAt = new Date();
    service.archivedBy = userId as any;

    await service.save();

    await this.archiveService.createArchiveEntry(
      tenantId,
      'Service',
      serviceId,
      'archived',
      service.toObject(),
      userId,
      [],
      reason || 'Work session archived'
    );
  }

  async getServiceHistory(tenantId: string, serviceId: string): Promise<any[]> {
    const service = await Service.findOne({
      _id: serviceId,
      tenant: tenantId
    });

    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    return this.archiveService.getEntityHistory(tenantId, 'Service', serviceId);
  }

  private async revertInventoryStock(
    tenantId: string,
    serviceItems: IServiceItemItem[]
  ): Promise<void> {
    for (const item of serviceItems) {
      if (item.itemType === 'inventory' && item.inventoryId) {
        const inventoryItem = await UniversalInventory.findOne({
          _id: item.inventoryId,
          tenant: tenantId
        });

        if (inventoryItem) {
          inventoryItem.stock += item.quantity;
          await inventoryItem.save();
        }
      }
    }
  }

  async completeService(
    tenantId: string,
    serviceId: string,
    userId: string
  ): Promise<IServiceDocument> {
    const service = await Service.findOne({
      _id: serviceId,
      tenant: tenantId
    });

    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    if (service.status === 'completed') {
      throw new ApiError(400, 'Service is already completed');
    }

    const changes: any[] = [{
      field: 'status',
      oldValue: service.status,
      newValue: 'completed'
    }];

    service.status = 'completed';
    service.completedAt = new Date();

    await service.save();

    await this.archiveService.createArchiveEntry(
      tenantId,
      'Service',
      serviceId,
      'updated',
      service.toObject(),
      userId,
      changes,
      'Service completed'
    );

    return service.populate([
      'vehicle',
      'customer',
      { path: 'services.employees', model: 'Employee' },
      { path: 'services.items.inventoryId', model: 'UniversalInventory' }
    ]);
  }
}

// Export singleton instance
export const serviceService = new ServiceService();
