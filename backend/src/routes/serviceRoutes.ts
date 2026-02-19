import { Router } from 'express';
import { AppointmentServiceController } from '../controllers/appointmentServiceController';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { body } from 'express-validator';
import { UserRole } from '../types';

const router = Router();
const serviceController = new AppointmentServiceController();

const serviceValidation = [
  body('name').notEmpty().withMessage('Service name is required'),
  body('type').notEmpty().withMessage('Service type is required'),
  body('description').notEmpty().withMessage('Service description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('duration').isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes')
];

router.get('/', serviceController.getAllServices.bind(serviceController));
router.get('/:id', serviceController.getServiceById.bind(serviceController));
router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(serviceValidation), serviceController.createService.bind(serviceController));
router.put('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), serviceController.updateService.bind(serviceController));
router.patch('/:id/toggle', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), serviceController.toggleServiceStatus.bind(serviceController));
router.delete('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), serviceController.deleteService.bind(serviceController));

export default router;
