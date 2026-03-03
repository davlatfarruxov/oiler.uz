import Vehicle, { IVehicleDocument } from '../models/Vehicle';
import Customer from '../models/Customer';
import OilChange from '../models/OilChange';
import { ApiError } from '../utils/ApiError';
import { EngineType } from '../types';
import { ArchiveService } from './archiveService';

const archiveService = new ArchiveService();

interface CreateVehicleData {
  plateNumber: string;
  brand: string;
  vehicleModel: string; // Renamed from 'model'
  engineType: EngineType;
  customerName: string;
  customerPhone: string;
}

export class VehicleService {
  async createVehicle(tenantId: string, data: CreateVehicleData, userId?: string): Promise<IVehicleDocument> {
    // Check if vehicle exists within this tenant (including archived)
    const existingVehicle = await Vehicle.findOne({ 
      tenant: tenantId,
      plateNumber: data.plateNumber 
    });
    
    if (existingVehicle) {
      if (existingVehicle.isArchived) {
        // If archived vehicle exists, mark it as permanently deleted but keep in archive
        console.log(`Marking archived vehicle ${data.plateNumber} as permanently deleted to allow new registration`);
        
        // Change plate number to avoid unique constraint (add timestamp)
        const deletedPlateNumber = `${data.plateNumber}_DELETED_${Date.now()}`;
        existingVehicle.plateNumber = deletedPlateNumber;
        await existingVehicle.save();
        
        // Create archive entry for permanent deletion
        if (userId) {
          await archiveService.createArchiveEntry(
            tenantId,
            'Vehicle',
            existingVehicle._id.toString(),
            'updated',
            existingVehicle.toObject(),
            userId,
            [
              { field: 'status', oldValue: 'archived', newValue: 'permanently_deleted' },
              { field: 'plateNumber', oldValue: data.plateNumber, newValue: deletedPlateNumber }
            ],
            `Permanently deleted to allow new vehicle registration with plate number ${data.plateNumber}`
          );
        }
        
        // Find all oil changes for this vehicle - DO NOT DELETE, just mark in archive
        const oilChanges = await OilChange.find({
          tenant: tenantId,
          vehicle: existingVehicle._id
        });
        
        // Create archive entries for each oil change (marking as related to deleted vehicle)
        if (userId) {
          for (const oilChange of oilChanges) {
            await archiveService.createArchiveEntry(
              tenantId,
              'OilChange',
              oilChange._id.toString(),
              'updated',
              oilChange.toObject(),
              userId,
              [{ field: 'parentVehicleStatus', oldValue: 'active', newValue: 'permanently_deleted' }],
              `Parent vehicle ${data.plateNumber} was permanently deleted for re-registration. Service data preserved in archive.`
            );
          }
        }
        
        console.log(`Archived vehicle ${data.plateNumber} marked as permanently deleted. ${oilChanges.length} services preserved in archive.`);
      } else {
        // Active vehicle exists
        throw new ApiError(409, 'Vehicle with this plate number already exists');
      }
    }

    // Find or create customer within this tenant
    let customer = await Customer.findOne({ 
      tenant: tenantId,
      phone: data.customerPhone 
    });
    
    if (!customer) {
      try {
        customer = await Customer.create({
          tenant: tenantId,
          name: data.customerName,
          phone: data.customerPhone,
          vehicles: []
        });
      } catch (error: any) {
        // Handle duplicate key error (in case of race condition)
        if (error.code === 11000) {
          customer = await Customer.findOne({ 
            tenant: tenantId,
            phone: data.customerPhone 
          });
          if (!customer) {
            throw new ApiError(500, 'Failed to create or find customer');
          }
        } else {
          throw error;
        }
      }
    }

    const vehicle = await Vehicle.create({
      tenant: tenantId,
      plateNumber: data.plateNumber,
      brand: data.brand,
      vehicleModel: data.vehicleModel,
      engineType: data.engineType,
      customer: customer._id
    });

    // Add vehicle to customer's vehicles array
    customer.vehicles.push(vehicle._id as any);
    await customer.save();

    return vehicle.populate('customer');
  }

  async getAllVehicles(tenantId: string, query?: string, page: number = 1, limit: number = 10, includeArchived: boolean = false) {
    const filter: any = { tenant: tenantId };
    
    // By default, exclude archived vehicles
    if (!includeArchived) {
      filter.isArchived = { $ne: true };
    }
    
    if (query) {
      filter.$or = [
        { plateNumber: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { vehicleModel: { $regex: query, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [data, totalItems] = await Promise.all([
      Vehicle.find(filter)
        .populate('customer', 'name phone totalDebt')
        .populate('archivedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vehicle.countDocuments(filter)
    ]);
    
    return {
      data,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems
    };
  }

  async getArchivedVehicles(tenantId: string, page: number = 1, limit: number = 100) {
    const filter = { tenant: tenantId, isArchived: true };
    
    const skip = (page - 1) * limit;
    
    const [data, totalItems] = await Promise.all([
      Vehicle.find(filter)
        .populate('customer', 'name phone')
        .populate('archivedBy', 'name email')
        .sort({ archivedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vehicle.countDocuments(filter)
    ]);
    
    return {
      data,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems
    };
  }

  async getVehicleById(tenantId: string, vehicleId: string): Promise<IVehicleDocument> {
    const vehicle = await Vehicle.findOne({ 
      _id: vehicleId,
      tenant: tenantId 
    }).populate('customer');
    
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }
    return vehicle;
  }

  async updateVehicle(tenantId: string, vehicleId: string, data: Partial<CreateVehicleData>, userId: string): Promise<IVehicleDocument> {
    const vehicle = await Vehicle.findOne({ 
      _id: vehicleId,
      tenant: tenantId 
    });
    
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }

    if (data.plateNumber && data.plateNumber !== vehicle.plateNumber) {
      const existingVehicle = await Vehicle.findOne({ 
        tenant: tenantId,
        plateNumber: data.plateNumber 
      });
      
      if (existingVehicle) {
        throw new ApiError(409, 'Vehicle with this plate number already exists');
      }
    }

    // Track changes for archive
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    const oldSnapshot = vehicle.toObject();

    if (data.plateNumber && data.plateNumber !== vehicle.plateNumber) {
      changes.push({ field: 'plateNumber', oldValue: vehicle.plateNumber, newValue: data.plateNumber });
    }
    if (data.brand && data.brand !== vehicle.brand) {
      changes.push({ field: 'brand', oldValue: vehicle.brand, newValue: data.brand });
    }
    if (data.vehicleModel && data.vehicleModel !== vehicle.vehicleModel) {
      changes.push({ field: 'vehicleModel', oldValue: vehicle.vehicleModel, newValue: data.vehicleModel });
    }
    if (data.engineType && data.engineType !== vehicle.engineType) {
      changes.push({ field: 'engineType', oldValue: vehicle.engineType, newValue: data.engineType });
    }

    Object.assign(vehicle, data);
    await vehicle.save();

    // Create archive entry if there were changes
    if (changes.length > 0) {
      await archiveService.createArchiveEntry(
        tenantId,
        'Vehicle',
        vehicleId,
        'updated',
        vehicle.toObject(),
        userId,
        changes
      );
    }

    return vehicle.populate('customer');
  }

  async deleteVehicle(tenantId: string, vehicleId: string): Promise<void> {
    const vehicle = await Vehicle.findOneAndDelete({ 
      _id: vehicleId,
      tenant: tenantId 
    });
    
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }
  }

  async getVehiclesCount(tenantId: string): Promise<number> {
    return Vehicle.countDocuments({ tenant: tenantId });
  }

  async searchByPlateNumber(tenantId: string, plateNumber: string): Promise<IVehicleDocument | null> {
    // Only search for non-archived vehicles
    const vehicle = await Vehicle.findOne({ 
      tenant: tenantId,
      plateNumber: plateNumber.toUpperCase(),
      isArchived: { $ne: true }
    }).populate('customer');
    
    return vehicle;
  }

  async getVehicleWithHistory(tenantId: string, vehicleId: string): Promise<any> {
    const vehicle = await Vehicle.findOne({ 
      _id: vehicleId,
      tenant: tenantId 
    }).populate('customer');
    
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }

    try {
      // Get oil change history for this tenant's vehicle
      const oilChanges = await OilChange.find({ 
        tenant: tenantId,
        vehicle: vehicleId 
      })
        .populate({
          path: 'employees',
          select: 'name commissionRate',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'employeeCommissions.employee',
          select: 'name',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'oilProduct',
          populate: {
            path: 'brand',
            select: 'name'
          },
          options: { strictPopulate: false }
        })
        .populate({
          path: 'oilFilter',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'airFilter',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'cabinFilter',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'fuelFilter',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'additionalProducts.product',
          options: { strictPopulate: false }
        })
        .sort({ createdAt: -1 })
        .lean();

      // Transform oilProduct to have brand as string
      const transformedOilChanges = oilChanges.map((change: any) => {
        if (change.oilProduct && typeof change.oilProduct === 'object') {
          const brand = change.oilProduct.brand as any;
          return {
            ...change,
            oilProduct: {
              ...change.oilProduct,
              brand: brand?.name || 'Unknown',
              displayName: `${brand?.name || 'Unknown'} ${change.oilProduct.viscosity} ${change.oilProduct.apiGrade} ${change.oilProduct.volume}L`
            }
          };
        }
        return change;
      });

      return {
        vehicle,
        oilChanges: transformedOilChanges,
        totalServices: transformedOilChanges.length,
        lastService: transformedOilChanges[0] || null
      };
    } catch (error: any) {
      console.error('Error fetching vehicle history:', error);
      // Return vehicle with empty history if populate fails
      return {
        vehicle,
        oilChanges: [],
        totalServices: 0,
        lastService: null
      };
    }
  }

  async archiveVehicle(tenantId: string, vehicleId: string, userId: string, reason?: string): Promise<void> {
    const vehicle = await Vehicle.findOne({ 
      _id: vehicleId,
      tenant: tenantId 
    });
    
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }

    if (vehicle.isArchived) {
      throw new ApiError(400, 'Vehicle is already archived');
    }

    console.log('Archiving vehicle:', { vehicleId, userId, tenantId, reason });

    // Create archive entry
    await archiveService.createArchiveEntry(
      tenantId,
      'Vehicle',
      vehicleId,
      'archived',
      vehicle.toObject(),
      userId,
      [],
      reason
    );

    console.log('Archive entry created for vehicle:', vehicleId);

    // Mark as archived
    vehicle.isArchived = true;
    vehicle.archivedAt = new Date();
    vehicle.archivedBy = userId as any;
    await vehicle.save();
    
    console.log('Vehicle marked as archived:', vehicleId);
  }

  async restoreVehicle(tenantId: string, vehicleId: string, userId: string): Promise<IVehicleDocument> {
    const vehicle = await Vehicle.findOne({ 
      _id: vehicleId,
      tenant: tenantId 
    });
    
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }

    if (!vehicle.isArchived) {
      throw new ApiError(400, 'Vehicle is not archived');
    }

    // Create archive entry for restoration
    await archiveService.createArchiveEntry(
      tenantId,
      'Vehicle',
      vehicleId,
      'updated',
      vehicle.toObject(),
      userId,
      [{ field: 'isArchived', oldValue: true, newValue: false }],
      'Restored from archive'
    );

    vehicle.isArchived = false;
    vehicle.archivedAt = undefined;
    vehicle.archivedBy = undefined;
    await vehicle.save();

    return vehicle.populate('customer');
  }

  async getVehicleHistory(tenantId: string, vehicleId: string) {
    const vehicle = await Vehicle.findOne({ 
      _id: vehicleId,
      tenant: tenantId 
    });
    
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }

    return archiveService.getEntityHistory(tenantId, 'Vehicle', vehicleId);
  }

  async getUnifiedVehicleHistory(tenantId: string, vehicleId: string): Promise<any[]> {
    const vehicle = await Vehicle.findOne({ 
      _id: vehicleId,
      tenant: tenantId 
    });
    
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }

    const mongoose = require('mongoose');
    const Service = require('../models/Service').default;

    // Query all oil changes for vehicle
    const oilChanges = await OilChange.find({ 
      tenant: tenantId,
      vehicle: vehicleId,
      isArchived: { $ne: true }
    })
      .populate({
        path: 'employees',
        select: 'name',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'oilProduct',
        populate: {
          path: 'brand',
          select: 'name'
        },
        options: { strictPopulate: false }
      })
      .populate({
        path: 'oilFilter',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'airFilter',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'cabinFilter',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'fuelFilter',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'additionalProducts.product',
        options: { strictPopulate: false }
      })
      .lean();

    // Query all services for vehicle
    const services = await Service.find({ 
      tenant: tenantId,
      vehicle: vehicleId,
      isArchived: { $ne: true }
    })
      .populate({
        path: 'services.employees',
        model: 'Employee',
        select: 'name'
      })
      .populate({
        path: 'services.items.inventoryId',
        model: 'UniversalInventory'
      })
      .lean();

    // Map oil changes to unified format
    const oilChangeHistory = oilChanges.map((change: any) => {
      // Format oil product for display
      let oilProductDisplay = null;
      if (change.oilProduct) {
        const brandName = change.oilProduct.brand?.name || change.oilProduct.brand || 'Unknown';
        oilProductDisplay = {
          ...change.oilProduct,
          brand: brandName,
          displayName: `${brandName} ${change.oilProduct.viscosity} ${change.oilProduct.apiGrade} ${change.oilProduct.volume}L`
        };
      }

      // Format filters for display
      const formatFilter = (filter: any) => {
        if (!filter) return null;
        return {
          ...filter,
          displayName: filter.displayName || `${filter.brandName || filter.brand || ''} ${filter.partNumber || ''}`.trim(),
          name: filter.name || filter.partNumber
        };
      };

      return {
        id: change._id,
        type: 'oilChange',
        date: change.createdAt,
        serviceName: 'Oil Change',
        status: change.status, // Add status field
        completedAt: change.completedAt, // Add completedAt field
        oilProduct: oilProductDisplay,
        oilFilter: formatFilter(change.oilFilter),
        airFilter: formatFilter(change.airFilter),
        cabinFilter: formatFilter(change.cabinFilter),
        fuelFilter: formatFilter(change.fuelFilter),
        items: this.formatOilChangeItems(change),
        price: change.price,
        paymentStatus: change.paymentStatus,
        amountDue: change.amountDue,
        amountPaid: change.amountPaid,
        employees: change.employees || [],
        mileage: change.mileage,
        notes: change.notes
      };
    });

    // Map services to unified format
    const serviceHistory = services.map((service: any) => ({
      id: service._id,
      type: 'service',
      date: service.createdAt,
      status: service.status, // Add status field
      services: service.services, // Include all services in the work session
      price: service.totalPrice,
      paymentStatus: service.paymentStatus,
      amountDue: service.amountDue,
      amountPaid: service.amountPaid,
      mileage: service.mileage,
      notes: service.notes
    }));

    // Merge and sort by date descending
    const unifiedHistory = [...oilChangeHistory, ...serviceHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return unifiedHistory;
  }

  private formatOilChangeItems(oilChange: any): string[] {
    const items: string[] = [];

    // Add oil product
    if (oilChange.oilProduct) {
      const brand = oilChange.oilProduct.brand?.name || 'Unknown';
      items.push(`${brand} ${oilChange.oilProduct.viscosity} ${oilChange.oilProduct.apiGrade} ${oilChange.oilProduct.volume}L`);
    }

    // Add filters
    if (oilChange.oilFilter) {
      items.push(`Oil Filter: ${oilChange.oilFilter.name || oilChange.oilFilter.partNumber}`);
    }
    if (oilChange.airFilter) {
      items.push(`Air Filter: ${oilChange.airFilter.name || oilChange.airFilter.partNumber}`);
    }
    if (oilChange.cabinFilter) {
      items.push(`Cabin Filter: ${oilChange.cabinFilter.name || oilChange.cabinFilter.partNumber}`);
    }
    if (oilChange.fuelFilter) {
      items.push(`Fuel Filter: ${oilChange.fuelFilter.name || oilChange.fuelFilter.partNumber}`);
    }

    // Add additional products
    if (oilChange.additionalProducts && oilChange.additionalProducts.length > 0) {
      oilChange.additionalProducts.forEach((ap: any) => {
        if (ap.product) {
          items.push(`${ap.product.name} (${ap.quantity}x)`);
        }
      });
    }

    return items;
  }

  async getActiveServices(tenantId: string): Promise<any[]> {
    const mongoose = require('mongoose');
    const Service = require('../models/Service').default;

    // Query all active oil changes
    const activeOilChanges = await OilChange.find({ 
      tenant: tenantId,
      status: 'active',
      isArchived: { $ne: true }
    })
      .populate('vehicle', 'plateNumber brand vehicleModel')
      .populate('customer', 'name phone')
      .populate('employees', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Query all active general services
    const activeGeneralServices = await Service.find({ 
      tenant: tenantId,
      status: 'active',
      isArchived: { $ne: true }
    })
      .populate('vehicle', 'plateNumber brand vehicleModel')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .lean();

    // Map oil changes to unified format
    const oilChangeServices = activeOilChanges.map((change: any) => ({
      _id: change._id,
      type: 'oilChange',
      vehicle: change.vehicle,
      customer: change.customer,
      employees: change.employees,
      createdAt: change.createdAt,
      status: change.status,
      paymentStatus: change.paymentStatus,
      price: change.price,
      mileage: change.mileage
    }));

    // Map general services to unified format
    const generalServices = activeGeneralServices.map((service: any) => ({
      _id: service._id,
      type: 'service',
      vehicle: service.vehicle,
      customer: service.customer,
      createdAt: service.createdAt,
      status: service.status,
      paymentStatus: service.paymentStatus,
      totalPrice: service.totalPrice,
      mileage: service.mileage
    }));

    // Merge and sort by date descending
    const allActiveServices = [...oilChangeServices, ...generalServices].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return allActiveServices;
  }
}
