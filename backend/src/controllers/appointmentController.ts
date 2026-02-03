import { Response, NextFunction } from 'express';
import { AppointmentService } from '../services/appointmentService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest, UserRole } from '../types';

const appointmentService = new AppointmentService();

export class AppointmentController {
  async createAppointment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await appointmentService.createAppointment(req.user!.id, req.body);
      res.status(201).json(ApiResponse.success('Appointment created successfully', appointment));
    } catch (error) {
      next(error);
    }
  }

  async getMyAppointments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      let appointments;
      if (req.user!.role === UserRole.EMPLOYEE) {
        appointments = await appointmentService.getAppointmentsByEmployee(req.user!.id);
      } else {
        appointments = await appointmentService.getAllAppointments();
      }
      res.status(200).json(ApiResponse.success('Appointments retrieved', appointments));
    } catch (error) {
      next(error);
    }
  }

  async getAppointmentById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await appointmentService.getAppointmentById(
        req.params.id,
        req.user!.id,
        req.user!.role
      );
      res.status(200).json(ApiResponse.success('Appointment retrieved', appointment));
    } catch (error) {
      next(error);
    }
  }

  async assignMechanic(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mechanicId } = req.body;
      const appointment = await appointmentService.assignMechanic(req.params.id, mechanicId);
      res.status(200).json(ApiResponse.success('Mechanic assigned successfully', appointment));
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, mileageAtService } = req.body;
      const appointment = await appointmentService.updateAppointmentStatus(
        req.params.id,
        status,
        req.user!.id,
        req.user!.role,
        mileageAtService
      );
      res.status(200).json(ApiResponse.success('Appointment status updated', appointment));
    } catch (error) {
      next(error);
    }
  }

  async cancelAppointment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await appointmentService.cancelAppointment(
        req.params.id,
        req.user!.id,
        req.user!.role
      );
      res.status(200).json(ApiResponse.success('Appointment cancelled', appointment));
    } catch (error) {
      next(error);
    }
  }

  async getAllAppointments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;
      const appointments = await appointmentService.getAllAppointments({ status: status as any });
      res.status(200).json(ApiResponse.success('All appointments retrieved', appointments));
    } catch (error) {
      next(error);
    }
  }
}
