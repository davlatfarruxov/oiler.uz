import { Router } from 'express';
import authRoutes from './authRoutes';
import vehicleRoutes from './vehicleRoutes';
import inventoryRoutes from './inventoryRoutes';
import oilChangeRoutes from './oilChangeRoutes';
import employeeRoutes from './employeeRoutes';
import adminRoutes from './adminRoutes';
import settingsRoutes from './settingsRoutes';
import oilProductRoutes from './oilProductRoutes';
import oilBrandRoutes from './oilBrandRoutes';
import filterRoutes from './filterRoutes';
import filterBrandRoutes from './filterBrandRoutes';
import archiveRoutes from './archiveRoutes';
import paymentRoutes from './paymentRoutes';
import generalServiceRoutes from './generalServiceRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/oil-changes', oilChangeRoutes);
router.use('/employees', employeeRoutes);
router.use('/admin', adminRoutes); // TEMPORARY - Remove after use
router.use('/settings', settingsRoutes);
router.use('/oil-products', oilProductRoutes);
router.use('/oil-brands', oilBrandRoutes);
router.use('/filters', filterRoutes);
router.use('/filter-brands', filterBrandRoutes);
router.use('/archives', archiveRoutes);
router.use('/payments', paymentRoutes);
router.use('/services', generalServiceRoutes);

export default router;
