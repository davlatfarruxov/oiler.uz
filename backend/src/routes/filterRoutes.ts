import { Router } from 'express';
import { FilterController } from '../controllers/filterController';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();
const filterController = new FilterController();

router.use(authenticate);

router.get('/low-stock', filterController.getLowStockFilters.bind(filterController));
router.get('/', filterController.getAllFilters.bind(filterController));
router.post('/', authorize([UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN]), filterController.createFilter.bind(filterController));
router.post('/bulk-import', authorize([UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN]), filterController.bulkImport.bind(filterController));
router.get('/:id', filterController.getFilterById.bind(filterController));
router.put('/:id', authorize([UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN]), filterController.updateFilter.bind(filterController));
router.patch('/:id/stock', authorize([UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN]), filterController.updateStock.bind(filterController));
router.delete('/:id', authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), filterController.deleteFilter.bind(filterController));

export default router;
