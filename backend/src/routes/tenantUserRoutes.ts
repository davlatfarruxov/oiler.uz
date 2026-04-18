import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { TenantUserController } from '../controllers/tenantUserController';

const router = Router();
const ctrl = new TenantUserController();

router.use(authenticate);

const createVal = [
  body('phone').notEmpty().withMessage('phone required'),
  body('password').isLength({ min: 6 }).withMessage('password min 6'),
  body('roleId').notEmpty().withMessage('roleId required')
];

router.get('/', ctrl.list.bind(ctrl));
router.post('/', validate(createVal), ctrl.create.bind(ctrl));
router.patch('/:id', ctrl.update.bind(ctrl));
router.post(
  '/:id/reset-password',
  validate([body('password').isLength({ min: 6 }).withMessage('Parol min 6 belgi')]),
  ctrl.resetPassword.bind(ctrl)
);

export default router;
