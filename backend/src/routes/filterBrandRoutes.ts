import { Router } from 'express';
import { FilterBrandController } from '../controllers/filterBrandController';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();
const filterBrandController = new FilterBrandController();

router.use(authenticate);

router.get('/', filterBrandController.getAllFilterBrands.bind(filterBrandController));
router.get('/:id', filterBrandController.getFilterBrandById.bind(filterBrandController));
router.post('/', authorize([UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN]), filterBrandController.createFilterBrand.bind(filterBrandController));
router.put('/:id', authorize([UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN]), filterBrandController.updateFilterBrand.bind(filterBrandController));
router.patch('/:id/toggle-status', authorize([UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN]), filterBrandController.toggleFilterBrandStatus.bind(filterBrandController));
router.delete('/:id', authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), filterBrandController.deleteFilterBrand.bind(filterBrandController));

export default router;
