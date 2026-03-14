import { Request, Response } from 'express';
import OilChange from '../models/OilChange';
import Service from '../models/Service';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export const getPublicService = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    if (!uuid) {
      throw new ApiError(400, 'UUID is required');
    }

    // Try to find in OilChange first
    let service = await OilChange.findOne({ publicUuid: uuid })
      .populate('vehicle', 'plateNumber brand vehicleModel')
      .populate('customer', 'name')
      .populate('oilProduct', 'brand viscosity apiGrade')
      .populate('oilFilter', 'brandName partNumber')
      .populate('airFilter', 'brandName partNumber')
      .populate('cabinFilter', 'brandName partNumber')
      .populate('fuelFilter', 'brandName partNumber')
      .select('publicUuid vehicle customer mileage nextServiceMileage createdAt oilProduct oilProductCustomerProvided oilProductCustomerProvidedDetails oilQuantityUsed oilFilter oilFilterCustomerProvided airFilter airFilterCustomerProvided cabinFilter cabinFilterCustomerProvided fuelFilter fuelFilterCustomerProvided');

    let serviceType = 'oilChange';

    // If not found in OilChange, try Service
    if (!service) {
      service = await Service.findOne({ publicUuid: uuid })
        .populate('vehicle', 'plateNumber brand vehicleModel')
        .populate('customer', 'name')
        .select('publicUuid vehicle customer mileage createdAt services totalPrice');
      
      serviceType = 'service';
    }

    if (!service) {
      throw new ApiError(404, 'Xizmat topilmadi');
    }

    // Prepare safe public data
    const publicData = {
      uuid: service.publicUuid,
      plateNumber: service.vehicle?.plateNumber || 'N/A',
      vehicleBrand: service.vehicle?.brand || 'N/A',
      vehicleModel: service.vehicle?.vehicleModel || 'N/A',
      customerName: service.customer?.name || 'N/A',
      serviceDate: service.createdAt,
      serviceType: serviceType === 'oilChange' ? 'Moy almashtirish' : 'Umumiy xizmat',
      currentMileage: Number(service.mileage) || 0,
      nextServiceMileage: Number(service.nextServiceMileage) || 0,
      companyName: 'OILER.UZ',
      companyPhone: '+998 78 888 0 111'
    };

    // Add oil change specific data
    if (serviceType === 'oilChange') {
      const oilChangeService = service as any;
      publicData['oilInfo'] = {
        hasOil: !!(oilChangeService.oilProduct || oilChangeService.oilProductCustomerProvided),
        oilDetails: oilChangeService.oilProductCustomerProvided 
          ? oilChangeService.oilProductCustomerProvidedDetails 
          : oilChangeService.oilProduct 
            ? `${oilChangeService.oilProduct.brand} ${oilChangeService.oilProduct.viscosity} ${oilChangeService.oilProduct.apiGrade || ''}`.trim()
            : null,
        oilQuantity: Number(oilChangeService.oilQuantityUsed) || 0
      };

      publicData['filters'] = {
        oilFilter: !!(oilChangeService.oilFilter || oilChangeService.oilFilterCustomerProvided),
        airFilter: !!(oilChangeService.airFilter || oilChangeService.airFilterCustomerProvided),
        cabinFilter: !!(oilChangeService.cabinFilter || oilChangeService.cabinFilterCustomerProvided),
        fuelFilter: !!(oilChangeService.fuelFilter || oilChangeService.fuelFilterCustomerProvided)
      };
    } else {
      // General service data
      const generalService = service as any;
      publicData['services'] = generalService.services?.map((s: any) => s.serviceName) || [];
    }

    res.json(ApiResponse.success('Xizmat ma\'lumotlari', publicData));
  } catch (error) {
    console.error('Get public service error:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(ApiResponse.error(error.message));
    } else {
      res.status(500).json(ApiResponse.error('Server xatosi'));
    }
  }
};