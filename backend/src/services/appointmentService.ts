import Appointment, { IAppointmentDocument } from '../models/Appointment';
import ServiceHistory from '../models/ServiceHistory';
import Vehicle from '../models/Vehicle';
import Service from '../models/Service';
import { ApiError } from '../utils/ApiError';
import { AppointmentStatus, UserRole } from '../types';

interface CreateAppointmentData {
  vehicleId: string;
  serviceId: string;
  scheduledDate: Date;
  notes?: string;
}

export class AppointmentService {
  async createAppointment(customerId: string, data: CreateAppointmentData): Promise<IAppointmentDocument> {
    const vehicle = await Vehicle.findOne({ _id: data.vehicleId, owner: customerId });
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found or does not belong to you');
    }

    const service = await Service.findById(data.serviceId);
    if (!service || !service.isActive) {
      throw new ApiError(404, 'Service not found or not available');
    }

    const appointment = await Appointment.create({
      customer: customerId,
      vehicle: data.vehicleId,
      service: data.serviceId,
      scheduledDate: data.scheduledDate,
      notes: data.notes
    });

    return appointment.populate(['customer', 'vehicle', 'service']);
  }

  async getAppointmentsByCustomer(customerId: string): Promise<IAppointmentDocument[]> {
    return Appointment.find({ customer: customerId })
      .populate('vehicle')
      .populate('service')
      .populate('mechanic', 'firstName lastName')
      .sort({ scheduledDate: -1 });
  }

  async getAppointmentsByEmployee(employeeId: string): Promise<IAppointmentDocument[]> {
    return Appointment.find({ mechanic: employeeId })
      .populate('customer', 'firstName lastName phone')
      .populate('vehicle')
      .populate('service')
      .sort({ scheduledDate: -1 });
  }

  async getAllAppointments(filters?: { status?: AppointmentStatus }): Promise<IAppointmentDocument[]> {
    const query: any = {};
    if (filters?.status) {
      query.status = filters.status;
    }

    return Appointment.find(query)
      .populate('customer', 'firstName lastName phone email')
      .populate('vehicle')
      .populate('service')
      .populate('mechanic', 'firstName lastName')
      .sort({ scheduledDate: -1 });
  }

  async getAppointmentById(appointmentId: string, userId: string, userRole: UserRole): Promise<IAppointmentDocument> {
    const appointment = await Appointment.findById(appointmentId)
      .populate('customer', 'firstName lastName phone email')
      .populate('vehicle')
      .populate('service')
      .populate('mechanic', 'firstName lastName');

    if (!appointment) {
      throw new ApiError(404, 'Appointment not found');
    }

    if (userRole === UserRole.EMPLOYEE && appointment.mechanic?._id.toString() !== userId) {
      throw new ApiError(403, 'Access denied');
    }

    return appointment;
  }

  async assignMechanic(appointmentId: string, mechanicId: string): Promise<IAppointmentDocument> {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new ApiError(404, 'Appointment not found');
    }

    appointment.mechanic = mechanicId as any;
    appointment.status = AppointmentStatus.CONFIRMED;
    await appointment.save();

    return appointment.populate(['customer', 'vehicle', 'service', 'mechanic']);
  }

  async updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentStatus,
    userId: string,
    userRole: UserRole,
    mileageAtService?: number
  ): Promise<IAppointmentDocument> {
    const appointment = await Appointment.findById(appointmentId).populate('vehicle');
    if (!appointment) {
      throw new ApiError(404, 'Appointment not found');
    }

    if (userRole === UserRole.EMPLOYEE && appointment.mechanic?.toString() !== userId) {
      throw new ApiError(403, 'You can only update your own appointments');
    }

    appointment.status = status;

    if (status === AppointmentStatus.COMPLETED) {
      appointment.completedAt = new Date();

      if (mileageAtService && appointment.mechanic) {
        await ServiceHistory.create({
          appointment: appointment._id,
          vehicle: appointment.vehicle,
          service: appointment.service,
          mechanic: appointment.mechanic,
          mileageAtService,
          completedAt: new Date()
        });

        const vehicle = await Vehicle.findById(appointment.vehicle);
        if (vehicle && mileageAtService > vehicle.mileage) {
          vehicle.mileage = mileageAtService;
          await vehicle.save();
        }
      }
    }

    await appointment.save();
    return appointment.populate(['customer', 'vehicle', 'service', 'mechanic']);
  }

  async cancelAppointment(appointmentId: string, userId: string, userRole: UserRole): Promise<IAppointmentDocument> {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new ApiError(404, 'Appointment not found');
    }

    if (userRole === UserRole.EMPLOYEE && appointment.customer.toString() !== userId) {
      throw new ApiError(403, 'You can only cancel your own appointments');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new ApiError(400, 'Cannot cancel completed appointment');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    await appointment.save();

    return appointment.populate(['customer', 'vehicle', 'service', 'mechanic']);
  }
}
