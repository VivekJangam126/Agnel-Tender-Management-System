/**
 * RAG Routes
 * API endpoints for RAG-powered tender analysis
 */

import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  initAnalysisSession,
  getSessionStatus,
  getTenderOverview,
  getSectionSummaries,
  getAIInsights,
  chatWithTender,
} from '../controllers/rag.controller.js';

const router = Router();

// Session management
router.post('/sessions/init', requireAuth, initAnalysisSession);
router.get('/sessions/:session_id/status', requireAuth, getSessionStatus);

// Analysis endpoints
router.post('/analysis/overview', requireAuth, getTenderOverview);
router.post('/analysis/sections', requireAuth, getSectionSummaries);
router.post('/analysis/insights', requireAuth, getAIInsights);

// Conversational AI
router.post('/chat', requireAuth, chatWithTender);

export default router;
