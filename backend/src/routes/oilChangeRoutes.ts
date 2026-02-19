import { Router } from 'express';
import { OilChangeController } from '../controllers/oilChangeController';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();
const oilChangeController = new OilChangeController();

router.get('/archived', authenticate, oilChangeController.getArchivedOilChanges.bind(oilChangeController));
router.get('/today-count', authenticate, oilChangeController.getTodayCount.bind(oilChangeController));
router.get('/monthly-revenue', authenticate, oilChangeController.getMonthlyRevenue.bind(oilChangeController));
router.get('/recent', authenticate, oilChangeController.getRecentServices.bind(oilChangeController));
router.get('/employee/:employeeId/commissions', authenticate, oilChangeController.getEmployeeCommissions.bind(oilChangeController));
router.get('/:id/archive-history', authenticate, oilChangeController.getOilChangeHistory.bind(oilChangeController));
router.get('/:id', authenticate, oilChangeController.getOilChangeById.bind(oilChangeController));
router.get('/', authenticate, oilChangeController.getAllOilChanges.bind(oilChangeController));
router.post('/', authenticate, oilChangeController.createOilChange.bind(oilChangeController));
router.put('/:id', authenticate, oilChangeController.updateOilChange.bind(oilChangeController));
router.post('/:id/archive', authenticate, oilChangeController.archiveOilChange.bind(oilChangeController));
router.post('/:id/restore', authenticate, oilChangeController.restoreOilChange.bind(oilChangeController));

export default router;
