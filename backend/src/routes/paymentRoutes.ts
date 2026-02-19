import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticate } from '../middlewares/auth';

const router = Router();
const paymentController = new PaymentController();

// All routes require authentication
router.use(authenticate);

// Record new payment
router.post('/', paymentController.recordPayment.bind(paymentController));

// Get payments (with filters)
router.get('/', paymentController.getAllPayments.bind(paymentController));

// Get customer payment summary
router.get('/customer/:customerId/summary', paymentController.getCustomerPaymentSummary.bind(paymentController));

// Get customer payment history
router.get('/customer/:customerId/history', paymentController.getCustomerPaymentHistory.bind(paymentController));

// Get overdue payments
router.get('/overdue', paymentController.getOverduePayments.bind(paymentController));

export default router;
