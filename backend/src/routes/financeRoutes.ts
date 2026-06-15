import { Router } from 'express';
import { FinanceController } from '../controllers/financeController';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();
const ctrl = new FinanceController();

router.use(authenticate);

router.get('/summary', ctrl.getSummary.bind(ctrl));
router.get('/chart', ctrl.getChart.bind(ctrl));
router.get('/inventory-value', ctrl.getInventoryValue.bind(ctrl));
router.get('/expenses', ctrl.getExpenses.bind(ctrl));
router.post('/expenses', authorize([UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN]), ctrl.createExpense.bind(ctrl));
router.put('/expenses/:id', authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), ctrl.updateExpense.bind(ctrl));
router.delete('/expenses/:id', authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), ctrl.deleteExpense.bind(ctrl));

export default router;
