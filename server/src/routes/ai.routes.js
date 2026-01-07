import { Router } from 'express';
import { queryTenderAI, generateTenderAI } from '../controllers/ai.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { aiRateLimiter } from '../middlewares/rate-limit.middleware.js';

const router = Router();

// Both AUTHORITY and BIDDER can query published tenders
router.post('/query', requireAuth, aiRateLimiter, queryTenderAI);

// Admin assistance (no embeddings), AUTHORITY only
router.post('/generate', requireAuth, requireRole('AUTHORITY'), aiRateLimiter, generateTenderAI);

export default router;
