import Service, { IServiceDocument } from '../models/Service';
import { ApiError } from '../utils/ApiError';
import { ServiceType } from '../types';

interface CreateServiceData {
  name: string;
  type: ServiceType;
  description: string;
  price: number;
  duration: number;
}

export class ServiceService {
  async createService(data: CreateServiceData): Promise<IServiceDocument> {
    const service = await Service.create(data);
    return service;
  }

  async getAllServices(activeOnly = true): Promise<IServiceDocument[]> {
    const query = activeOnly ? { isActive: true } : {};
    return Service.find(query).sort({ type: 1, price: 1 });
  }

  async getServiceById(serviceId: string): Promise<IServiceDocument> {
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new ApiError(404, 'Service not found');
    }
    return service;
  }

  async updateService(serviceId: string, data: Partial<CreateServiceData>): Promise<IServiceDocument> {
    const service = await Service.findByIdAndUpdate(serviceId, data, { new: true, runValidators: true });
    if (!service) {
      throw new ApiError(404, 'Service not found');
    }
    return service;
  }

  async toggleServiceStatus(serviceId: string): Promise<IServiceDocument> {
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    service.isActive = !service.isActive;
    await service.save();

    return service;
  }

  async deleteService(serviceId: string): Promise<void> {
    const service = await Service.findByIdAndDelete(serviceId);
    if (!service) {
      throw new ApiError(404, 'Service not found');
    }
  }
}
