import { Router } from 'express';
import { OilProductController } from '../controllers/oilProductController';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();
const oilProductController = new OilProductController();

// All routes require authentication
router.use(authenticate);

// Get all oil products (all users can view)
router.get('/', oilProductController.getAllOilProducts.bind(oilProductController));

// Get low stock products
router.get('/low-stock/list', oilProductController.getLowStockProducts.bind(oilProductController));

// Admin, Super Admin and Employee can manage oil products
router.post('/', authorize([UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN]), oilProductController.createOilProduct.bind(oilProductController));
router.post('/bulk-import', authorize([UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN]), oilProductController.bulkImport.bind(oilProductController));

// Get single oil product (must come after specific routes to avoid catching /low-stock/list and /bulk-import)
router.get('/:id', oilProductController.getOilProductById.bind(oilProductController));
router.put('/:id', authorize([UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN]), oilProductController.updateOilProduct.bind(oilProductController));
router.delete('/:id', authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), oilProductController.deleteOilProduct.bind(oilProductController));
router.patch('/:id/stock', authorize([UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN]), oilProductController.updateStock.bind(oilProductController));

export default router;
