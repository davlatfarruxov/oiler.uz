import { ApiError } from '../utils/ApiError';
import { UserRole } from '../types';

/** Bron moduli hozircha DBsiz — controllerlar kompilatsiya uchun */
export class AppointmentService {
  async createAppointment(_userId: string, _data: unknown): Promise<never> {
    throw new ApiError(501, 'Bronlar moduli hozircha mavjud emas');
  }

  async getAppointmentsByEmployee(_employeeId: string): Promise<unknown[]> {
    return [];
  }

  async getAllAppointments(_query?: { status?: string }): Promise<unknown[]> {
    return [];
  }

  async getAppointmentById(_id: string, _userId: string, _role: UserRole): Promise<never> {
    throw new ApiError(404, 'Topilmadi');
  }

  async assignMechanic(_id: string, _mechanicId: string): Promise<never> {
    throw new ApiError(501, 'Bronlar moduli hozircha mavjud emas');
  }

  async updateAppointmentStatus(
    _id: string,
    _status: string,
    _userId: string,
    _role: UserRole,
    _mileageAtService?: number
  ): Promise<never> {
    throw new ApiError(501, 'Bronlar moduli hozircha mavjud emas');
  }

  async cancelAppointment(_id: string, _userId: string, _role: UserRole): Promise<never> {
    throw new ApiError(501, 'Bronlar moduli hozircha mavjud emas');
  }
}
