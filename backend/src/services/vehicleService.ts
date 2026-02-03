import Vehicle, { IVehicleDocument } from '../models/Vehicle';
import Customer from '../models/Customer';
import { ApiError } from '../utils/ApiError';
import { EngineType } from '../types';

interface CreateVehicleData {
  plateNumber: string;
  brand: string;
  model: string;
  engineType: EngineType;
  customerName: string;
  customerPhone: string;
}

export class VehicleService {
  async createVehicle(data: CreateVehicleData): Promise<IVehicleDocument> {
    const existingVehicle = await Vehicle.findOne({ plateNumber: data.plateNumber });
    if (existingVehicle) {
      throw new ApiError(409, 'Vehicle with this plate number already exists');
    }

    // Find or create customer
    let customer = await Customer.findOne({ phone: data.customerPhone });
    if (!customer) {
      try {
        customer = await Customer.create({
          name: data.customerName,
          phone: data.customerPhone,
          vehicles: []
        });
      } catch (error: any) {
        // Handle duplicate key error (in case of race condition or unique index)
        if (error.code === 11000) {
          // Try to find the customer again
          customer = await Customer.findOne({ phone: data.customerPhone });
          if (!customer) {
            throw new ApiError(500, 'Failed to create or find customer');
          }
        } else {
          throw error;
        }
      }
    }

    const vehicle = await Vehicle.create({
      plateNumber: data.plateNumber,
      brand: data.brand,
      model: data.model,
      engineType: data.engineType,
      customer: customer._id
    });

    // Add vehicle to customer's vehicles array
    customer.vehicles.push(vehicle._id as any);
    await customer.save();

    return vehicle.populate('customer');
  }

  async getAllVehicles(query?: string): Promise<IVehicleDocument[]> {
    const filter: any = {};
    
    if (query) {
      filter.$or = [
        { plateNumber: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { model: { $regex: query, $options: 'i' } }
      ];
    }
    
    return Vehicle.find(filter).populate('customer').sort({ createdAt: -1 });
  }

  async getVehicleById(vehicleId: string): Promise<IVehicleDocument> {
    const vehicle = await Vehicle.findById(vehicleId).populate('customer');
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }
    return vehicle;
  }

  async updateVehicle(vehicleId: string, data: Partial<CreateVehicleData>): Promise<IVehicleDocument> {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }

    if (data.plateNumber && data.plateNumber !== vehicle.plateNumber) {
      const existingVehicle = await Vehicle.findOne({ plateNumber: data.plateNumber });
      if (existingVehicle) {
        throw new ApiError(409, 'Vehicle with this plate number already exists');
      }
    }

    Object.assign(vehicle, data);
    await vehicle.save();

    return vehicle.populate('customer');
  }

  async deleteVehicle(vehicleId: string): Promise<void> {
    const vehicle = await Vehicle.findByIdAndDelete(vehicleId);
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }
  }

  async getVehiclesCount(): Promise<number> {
    return Vehicle.countDocuments();
  }

  async searchByPlateNumber(plateNumber: string): Promise<IVehicleDocument | null> {
    const vehicle = await Vehicle.findOne({ 
      plateNumber: plateNumber.toUpperCase() 
    }).populate('customer');
    
    return vehicle;
  }

  async getVehicleWithHistory(vehicleId: string): Promise<any> {
    const vehicle = await Vehicle.findById(vehicleId).populate('customer');
    
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }

    // Import OilChange here to avoid circular dependency
    const OilChange = (await import('../models/OilChange')).default;

    // Get oil change history
    const oilChanges = await OilChange.find({ vehicle: vehicleId })
      .populate('employees', 'name commissionRate')
      .populate('employeeCommissions.employee', 'name')
      .populate('oilProduct')
      .populate('oilFilter')
      .populate('additionalProducts.product')
      .sort({ createdAt: -1 });

    return {
      vehicle,
      oilChanges,
      totalServices: oilChanges.length,
      lastService: oilChanges[0] || null
    };
  }
}
