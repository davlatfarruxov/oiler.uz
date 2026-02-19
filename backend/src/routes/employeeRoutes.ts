import { Router } from 'express';
import { EmployeeController } from '../controllers/employeeController';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { body } from 'express-validator';
import { UserRole } from '../types';

const router = Router();
const employeeController = new EmployeeController();

const employeeValidation = [
  body('name').notEmpty().withMessage('Employee name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('role').optional().isIn(Object.values(UserRole)).withMessage('Invalid role'),
  body('startDate').optional().isISO8601().withMessage('Invalid date format')
];

// All routes require authentication
router.use(authenticate);

// Get archived employees
router.get('/archived', employeeController.getArchivedEmployees.bind(employeeController));

// Get all employees with stats
router.get('/', employeeController.getAllEmployees.bind(employeeController));

// Get employee statistics
router.get('/stats', employeeController.getEmployeeStats.bind(employeeController));

// Get single employee with performance
router.get('/:id', employeeController.getEmployeeById.bind(employeeController));

// Get employee performance
router.get('/:id/performance', employeeController.getEmployeePerformance.bind(employeeController));

// Create new employee (Admin/SuperAdmin only)
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(employeeValidation),
  employeeController.createEmployee.bind(employeeController)
);

// Update employee (Admin/SuperAdmin only)
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  employeeController.updateEmployee.bind(employeeController)
);

// Toggle employee status (Admin/SuperAdmin only)
router.patch(
  '/:id/toggle-status',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  employeeController.toggleEmployeeStatus.bind(employeeController)
);

// Delete employee (SuperAdmin only)
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN),
  employeeController.deleteEmployee.bind(employeeController)
);

// Restore employee (SuperAdmin only)
router.post(
  '/:id/restore',
  authorize(UserRole.SUPER_ADMIN),
  employeeController.restoreEmployee.bind(employeeController)
);

export default router;
