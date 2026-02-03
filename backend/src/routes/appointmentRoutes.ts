import { Router } from 'express';
import { AppointmentController } from '../controllers/appointmentController';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { body } from 'express-validator';
import { UserRole } from '../types';

const router = Router();
const appointmentController = new AppointmentController();

const appointmentValidation = [
  body('vehicleId').notEmpty().withMessage('Vehicle ID is required'),
  body('serviceId').notEmpty().withMessage('Service ID is required'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required')
];

router.post('/', authenticate, validate(appointmentValidation), appointmentController.createAppointment.bind(appointmentController));
router.get('/', authenticate, appointmentController.getMyAppointments.bind(appointmentController));
router.get('/all', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), appointmentController.getAllAppointments.bind(appointmentController));
router.get('/:id', authenticate, appointmentController.getAppointmentById.bind(appointmentController));
router.patch('/:id/assign', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), appointmentController.assignMechanic.bind(appointmentController));
router.patch('/:id/status', authenticate, appointmentController.updateStatus.bind(appointmentController));
router.patch('/:id/cancel', authenticate, appointmentController.cancelAppointment.bind(appointmentController));

export default router;
