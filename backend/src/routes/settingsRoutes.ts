import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController';
import { authenticate } from '../middlewares/auth';

const router = Router();
const settingsController = new SettingsController();

// All routes require authentication
router.use(authenticate);

// Settings routes
router.get('/', settingsController.getSettings.bind(settingsController));
router.put('/company', settingsController.updateCompanyInfo.bind(settingsController));
router.put('/service-defaults', settingsController.updateServiceDefaults.bind(settingsController));

// Notification preferences routes
router.get('/notifications', settingsController.getNotificationPreferences.bind(settingsController));
router.put('/notifications', settingsController.updateNotificationPreferences.bind(settingsController));

// Password change route
router.post('/change-password', settingsController.changePassword.bind(settingsController));

// Exchange rate route
router.put('/exchange-rate', settingsController.updateExchangeRate.bind(settingsController));

export default router;
