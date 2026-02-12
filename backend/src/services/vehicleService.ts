import Vehicle, { IVehicleDocument } from '../models/Vehicle';
import Customer from '../models/Customer';
import OilChange from '../models/OilChange';
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

    try {
      // Get oil change history with safe population
      const oilChanges = await OilChange.find({ vehicle: vehicleId })
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

      return {
        vehicle,
        oilChanges,
        totalServices: oilChanges.length,
        lastService: oilChanges[0] || null
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
}
