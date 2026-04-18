import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { body } from 'express-validator';

const router = Router();
const authController = new AuthController();

/** Kompaniya egasi — email + parol (telefon shart emas) */
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('companyName').notEmpty().withMessage('companyName is required')
];

/** Eski egalar: email; tenant admin tomonidan qo‘shilganlar: telefon */
const loginValidation = [
  body('identifier').notEmpty().withMessage('Email yoki telefon kerak'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/register', validate(registerValidation), authController.register.bind(authController));
router.post('/login', validate(loginValidation), authController.login.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));
router.post('/logout', authController.logout.bind(authController));

router.get('/profile', authenticate, authController.getProfile.bind(authController));

router.get('/sessions', authenticate, authController.listMySessions.bind(authController));
router.delete('/sessions/:id', authenticate, authController.revokeMySession.bind(authController));
router.post('/sessions/revoke-others', authenticate, authController.revokeMyOtherSessions.bind(authController));

router.get('/tenant-sessions', authenticate, authController.listTenantSessions.bind(authController));
router.delete('/tenant-sessions/:id', authenticate, authController.revokeTenantSession.bind(authController));

export default router;
