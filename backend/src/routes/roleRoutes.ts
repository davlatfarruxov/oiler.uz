import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { RoleController } from '../controllers/roleController';

const router = Router();
const ctrl = new RoleController();

router.use(authenticate);

const createValidation = [
  body('name').notEmpty().withMessage('Name required'),
  body('permissions').isArray({ min: 1 }).withMessage('permissions array required')
];

router.get('/', ctrl.list.bind(ctrl));
router.post('/', validate(createValidation), ctrl.create.bind(ctrl));
router.put('/:id', ctrl.update.bind(ctrl));
router.delete('/:id', ctrl.remove.bind(ctrl));

export default router;
