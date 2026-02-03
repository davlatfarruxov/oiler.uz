import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { body } from 'express-validator';
import { UserRole } from '../types';

const router = Router();
const inventoryController = new InventoryController();

const inventoryValidation = [
  body('productType').isIn(['oil', 'filter', 'other']).withMessage('Invalid product type'),
  body('name').notEmpty().withMessage('Product name is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a positive number'),
  body('reorderLevel').optional().isInt({ min: 0 }).withMessage('Reorder level must be a positive number'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number')
];

const stockUpdateValidation = [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive number'),
  body('operation').isIn(['add', 'subtract']).withMessage('Operation must be add or subtract')
];

// All routes require authentication
router.use(authenticate);

// Get all inventory items
router.get('/', inventoryController.getAllItems.bind(inventoryController));

// Get low stock items
router.get('/low-stock', inventoryController.getLowStockItems.bind(inventoryController));

// Get single item
router.get('/:id', inventoryController.getItemById.bind(inventoryController));

// Create new item (Admin/SuperAdmin/Employee)
router.post(
  '/',
  authorize([UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validate(inventoryValidation),
  inventoryController.createItem.bind(inventoryController)
);

// Update item (Admin/SuperAdmin/Employee)
router.put(
  '/:id',
  authorize([UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  inventoryController.updateItem.bind(inventoryController)
);

// Update stock (Admin/SuperAdmin/Employee)
router.patch(
  '/:id/stock',
  authorize([UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validate(stockUpdateValidation),
  inventoryController.updateStock.bind(inventoryController)
);

// Delete item (Admin/SuperAdmin only)
router.delete(
  '/:id',
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  inventoryController.deleteItem.bind(inventoryController)
);

export default router;
