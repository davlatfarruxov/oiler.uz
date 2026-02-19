import { Router } from 'express';
import { generalServiceController } from '../controllers/generalServiceController';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { body } from 'express-validator';
import { UserRole } from '../types';

const router = Router();

const serviceValidation = [
  body('vehicleId').notEmpty().withMessage('Vehicle ID is required'),
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('services').isArray({ min: 1 }).withMessage('At least one service is required'),
  body('services.*.serviceName').notEmpty().withMessage('Service name is required'),
  body('services.*.items').isArray().withMessage('Service items must be an array'),
  body('services.*.items.*.itemName').notEmpty().withMessage('Item name is required'),
  body('services.*.items.*.itemType').isIn(['inventory', 'custom']).withMessage('Item type must be inventory or custom'),
  body('services.*.items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be positive'),
  body('services.*.items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('services.*.laborCost').optional().isFloat({ min: 0 }).withMessage('Labor cost must be non-negative'),
  body('services.*.employees').isArray().withMessage('Service employees must be an array'),
  body('mileage').optional().isInt({ min: 0 }).withMessage('Mileage must be non-negative'),
  body('paymentStatus').optional().isIn(['paid', 'partial', 'unpaid']).withMessage('Invalid payment status'),
  body('amountPaid').optional().isFloat({ min: 0 }).withMessage('Amount paid must be non-negative')
];

// All routes require authentication
router.use(authenticate);

// List services with filters
router.get('/', generalServiceController.listServices.bind(generalServiceController));

// Get single service
router.get('/:id', generalServiceController.getService.bind(generalServiceController));

// Get service archive history
router.get('/:id/archive-history', generalServiceController.getServiceHistory.bind(generalServiceController));

// Create new service
router.post(
  '/',
  authorize(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(serviceValidation),
  generalServiceController.createService.bind(generalServiceController)
);

// Update service
router.put(
  '/:id',
  authorize(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  generalServiceController.updateService.bind(generalServiceController)
);

// Archive service
router.post(
  '/:id/archive',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  generalServiceController.archiveService.bind(generalServiceController)
);

// Delete service (soft delete via archive)
router.delete(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  generalServiceController.deleteService.bind(generalServiceController)
);

export default router;
