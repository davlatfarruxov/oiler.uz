import { Router } from 'express';
import { OilChangeController } from '../controllers/oilChangeController';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();
const oilChangeController = new OilChangeController();

router.get('/today-count', authenticate, oilChangeController.getTodayCount.bind(oilChangeController));
router.get('/monthly-revenue', authenticate, oilChangeController.getMonthlyRevenue.bind(oilChangeController));
router.get('/recent', authenticate, oilChangeController.getRecentServices.bind(oilChangeController));
router.get('/employee/:employeeId/commissions', authenticate, oilChangeController.getEmployeeCommissions.bind(oilChangeController));
router.get('/', authenticate, oilChangeController.getAllOilChanges.bind(oilChangeController));
router.post('/', authenticate, oilChangeController.createOilChange.bind(oilChangeController));

export default router;
