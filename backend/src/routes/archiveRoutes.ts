import { Router } from 'express';
import { getArchives, getEntityHistory } from '../controllers/archiveController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', getArchives);
router.get('/:entityType/:entityId', getEntityHistory);

export default router;
