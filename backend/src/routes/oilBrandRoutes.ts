import { Router } from 'express';
import { OilBrandController } from '../controllers/oilBrandController';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();
const oilBrandController = new OilBrandController();

router.use(authenticate);

router.get('/', oilBrandController.getAllOilBrands.bind(oilBrandController));
router.get('/:id', oilBrandController.getOilBrandById.bind(oilBrandController));

router.post('/', authorize([UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN]), oilBrandController.createOilBrand.bind(oilBrandController));
router.put('/:id', authorize([UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN]), oilBrandController.updateOilBrand.bind(oilBrandController));
router.delete('/:id', authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), oilBrandController.deleteOilBrand.bind(oilBrandController));

export default router;
