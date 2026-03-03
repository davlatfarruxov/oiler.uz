import { Router } from 'express';
import { EmployeePaymentController } from '../controllers/employeePaymentController';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { body } from 'express-validator';
import { UserRole } from '../types';

const router = Router();
const employeePaymentController = new EmployeePaymentController();

const paymentValidation = [
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('paymentMethod').isIn(['cash', 'card', 'transfer']).withMessage('Invalid payment method'),
  body('paymentDate').optional().isISO8601().withMessage('Invalid date format')
];

// All routes require authentication
router.use(authenticate);

// Get employee payment summary
router.get('/employee/:employeeId/summary', employeePaymentController.getEmployeePaymentSummary.bind(employeePaymentController));

// Get employee payments
router.get('/employee/:employeeId', employeePaymentController.getEmployeePayments.bind(employeePaymentController));

// Get single payment
router.get('/:paymentId', employeePaymentController.getPaymentById.bind(employeePaymentController));

// Create payment (Admin/SuperAdmin only)
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(paymentValidation),
  employeePaymentController.createPayment.bind(employeePaymentController)
);

// Delete payment (SuperAdmin only)
router.delete(
  '/:paymentId',
  authorize(UserRole.SUPER_ADMIN),
  employeePaymentController.deletePayment.bind(employeePaymentController)
);

export default router;
