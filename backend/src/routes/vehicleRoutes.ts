import { Router } from 'express';
import { VehicleController } from '../controllers/vehicleController';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { body } from 'express-validator';
import { UserRole } from '../types';

const router = Router();
const vehicleController = new VehicleController();

const vehicleValidation = [
  body('plateNumber').notEmpty().withMessage('Plate number is required'),
  body('brand').notEmpty().withMessage('Vehicle brand is required'),
  body('vehicleModel').notEmpty().withMessage('Vehicle model is required'),
  body('engineType').notEmpty().withMessage('Engine type is required'),
  body('customerName').notEmpty().withMessage('Customer name is required'),
  body('customerPhone').notEmpty().withMessage('Customer phone is required')
];

// Search vehicle by plate number
router.get('/search/:plateNumber', authenticate, vehicleController.searchByPlateNumber.bind(vehicleController));

// Get archived vehicles
router.get('/archived', authenticate, vehicleController.getArchivedVehicles.bind(vehicleController));

// Get vehicle count
router.get('/count', authenticate, vehicleController.getVehiclesCount.bind(vehicleController));

// Get all vehicles
router.get('/', authenticate, vehicleController.getAllVehicles.bind(vehicleController));

// Get vehicle with oil change history
router.get('/:id/history', authenticate, vehicleController.getVehicleWithHistory.bind(vehicleController));

// Get unified vehicle history (oil changes + services)
router.get('/:id/unified-history', authenticate, vehicleController.getUnifiedVehicleHistory.bind(vehicleController));

// Get vehicle change history (archive)
router.get('/:id/archive-history', authenticate, vehicleController.getVehicleHistory.bind(vehicleController));

// Get single vehicle
router.get('/:id', authenticate, vehicleController.getVehicleById.bind(vehicleController));

// Create new vehicle
router.post('/', authenticate, validate(vehicleValidation), vehicleController.createVehicle.bind(vehicleController));

// Update vehicle
router.put('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), vehicleController.updateVehicle.bind(vehicleController));

// Archive vehicle
router.post('/:id/archive', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), vehicleController.archiveVehicle.bind(vehicleController));

// Restore vehicle
router.post('/:id/restore', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), vehicleController.restoreVehicle.bind(vehicleController));

// Delete vehicle
router.delete('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), vehicleController.deleteVehicle.bind(vehicleController));

export default router;
