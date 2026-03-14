import express from 'express';
import rateLimit from 'express-rate-limit';
import { getPublicService } from '../controllers/publicController';

const router = express.Router();

// Rate limiting for public endpoints
const publicRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Juda ko\'p so\'rov yuborildi. Bir daqiqa kutib turing.',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all public routes
router.use(publicRateLimit);

// GET /api/v1/public/service/:uuid - Get public service information
router.get('/service/:uuid', getPublicService);

export default router;