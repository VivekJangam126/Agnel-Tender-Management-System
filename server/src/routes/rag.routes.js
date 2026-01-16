/**
 * RAG API Routes
 * Endpoints for tender analysis, ingestion, and management
 */

import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { hybridRetrieve, keywordSearch, getContextStats } from '../services/rag/hybrid-retrieval.js';
import {
  buildTenderAnalysisPrompt,
  buildProposalDraftingPrompt,
  buildProposalEvaluationPrompt,
  buildRiskAssessmentPrompt,
  getCitationStats,
} from '../services/rag/prompt-builder.js';
import { ingestSessionPdfs } from '../services/rag/session-ingestion.js';
import { ingestGlobalPdfs, isGlobalPdfsIngested } from '../services/rag/global-ingestion.js';
import { deleteSession, getSessionStats, listActiveSessions, cleanupExpiredSessions } from '../services/rag/cleanup.service.js';
import { getEmbeddingStats } from '../services/rag/embedding.service.js';
import fetch from 'node-fetch';

const router = Router();
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama2-70b-4096'; // Fast open model

// ==========================================
// TENDER ANALYSIS ENDPOINT
// ==========================================

/**
 * POST /api/rag/analyze
 * Analyze tender using hybrid RAG
 */
router.post('/analyze', requireAuth, async (req, res, next) => {
  try {
    const { query, session_id, tender_id } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    console.log(`[RAG] Analysis request for session ${session_id}`);

    // Hybrid retrieval
    const retrievalResult = await hybridRetrieve(query, session_id);

    // Build prompt
    const systemPrompt = buildTenderAnalysisPrompt(retrievalResult, query);

    // Call Groq LLM
    const analysis = await callGroqLLM(systemPrompt, 'You are a tender analysis expert.');

    const citations = getCitationStats(retrievalResult);

    res.json({
      tender_id,
      session_id,
      query,
      analysis,
      citations,
      context_chunks: retrievalResult.total_chunks,
      sources: {
        tender: retrievalResult.session_context.chunks.map(c => c.source),
        reference: retrievalResult.global_context.chunks.map(c => c.source),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// PROPOSAL DRAFTING ENDPOINT
// ==========================================

/**
 * POST /api/rag/draft-proposal
 * Draft a proposal section using RAG
 */
router.post('/draft-proposal', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const { query, session_id, proposal_id, section_name, company_info } = req.body;

    if (!query || !session_id || !section_name) {
      return res.status(400).json({ error: 'Query, session_id, and section_name are required' });
    }

    console.log(`[RAG] Proposal draft request for section: ${section_name}`);

    // Hybrid retrieval based on query
    const retrievalResult = await hybridRetrieve(query, session_id, { topK: 12 });

    // Build drafting prompt
    const systemPrompt = buildProposalDraftingPrompt(
      retrievalResult,
      section_name,
      company_info || 'Company information not provided'
    );

    // Call Groq LLM
    const draft = await callGroqLLM(systemPrompt, 'You are a professional proposal writer.');

    const citations = getCitationStats(retrievalResult);

    res.json({
      proposal_id,
      section: section_name,
      draft,
      citations,
      context_used: {
        tender_chunks: retrievalResult.session_context.chunks.length,
        reference_chunks: retrievalResult.global_context.chunks.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// PROPOSAL EVALUATION ENDPOINT
// ==========================================

/**
 * POST /api/rag/evaluate-proposal
 * Evaluate a proposal against tender terms
 */
router.post('/evaluate-proposal', requireAuth, requireRole('AUTHORITY'), async (req, res, next) => {
  try {
    const { proposal_text, session_id, tender_id, evaluation_criteria } = req.body;

    if (!proposal_text || !session_id) {
      return res.status(400).json({ error: 'Proposal text and session_id are required' });
    }

    console.log(`[RAG] Proposal evaluation request`);

    // Retrieve context
    const retrievalResult = await hybridRetrieve(
      evaluation_criteria || 'Evaluate proposal completeness and compliance',
      session_id,
      { topK: 15 }
    );

    // Build evaluation prompt
    const systemPrompt = buildProposalEvaluationPrompt(retrievalResult, proposal_text, evaluation_criteria || 'Default evaluation');

    // Call Groq LLM
    const evaluation = await callGroqLLM(systemPrompt, 'You are a tender evaluation expert.');

    res.json({
      tender_id,
      evaluation,
      evaluation_criteria: evaluation_criteria || 'Default',
      context_used: retrievalResult.total_chunks,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// RISK ASSESSMENT ENDPOINT
// ==========================================

/**
 * POST /api/rag/assess-risks
 * Assess risks in a tender
 */
router.post('/assess-risks', requireAuth, async (req, res, next) => {
  try {
    const { session_id, tender_id, tender_summary } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    console.log(`[RAG] Risk assessment request for tender ${tender_id}`);

    // Retrieve context
    const retrievalResult = await hybridRetrieve('Risk assessment and mitigation', session_id, { topK: 12 });

    // Build risk assessment prompt
    const systemPrompt = buildRiskAssessmentPrompt(retrievalResult, tender_summary || 'Tender details');

    // Call Groq LLM
    const riskAssessment = await callGroqLLM(systemPrompt, 'You are a risk assessment specialist.');

    res.json({
      tender_id,
      session_id,
      risks: riskAssessment,
      context_chunks: retrievalResult.total_chunks,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// INGESTION & MANAGEMENT ENDPOINTS
// ==========================================

/**
 * POST /api/rag/ingest-session
 * Ingest PDFs for a specific session
 */
router.post('/ingest-session', requireAuth, async (req, res, next) => {
  try {
    const { session_id, pdf_paths } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const result = await ingestSessionPdfs(session_id, pdf_paths);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/rag/ingest-global
 * Ingest global reference PDFs (admin only)
 */
router.post('/ingest-global', requireAuth, requireRole('AUTHORITY'), async (req, res, next) => {
  try {
    const alreadyIngested = await isGlobalPdfsIngested();
    if (alreadyIngested) {
      return res.status(400).json({
        error: 'Global PDFs already ingested. Clear DB to reingest.',
      });
    }

    const result = await ingestGlobalPdfs();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/rag/stats
 * Get RAG system statistics
 */
router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const embeddingStats = await getEmbeddingStats();
    const sessionStats = await listActiveSessions();
    const contextStats = await getContextStats();

    res.json({
      embeddings: embeddingStats,
      active_sessions: sessionStats.length,
      context: contextStats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/rag/session/:sessionId/stats
 * Get stats for a specific session
 */
router.get('/session/:sessionId/stats', requireAuth, async (req, res, next) => {
  try {
    const stats = await getSessionStats(req.params.sessionId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/rag/session/:sessionId
 * Delete a session and its data
 */
router.delete('/session/:sessionId', requireAuth, async (req, res, next) => {
  try {
    const result = await deleteSession(req.params.sessionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/rag/cleanup
 * Manual cleanup of expired sessions (admin)
 */
router.post('/cleanup', requireAuth, requireRole('AUTHORITY'), async (req, res, next) => {
  try {
    const result = await cleanupExpiredSessions();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// HELPER FUNCTION: GROQ LLM CALL
// ==========================================

/**
 * Call Groq API for LLM inference
 * @param {string} userPrompt - User message/prompt
 * @param {string} systemPrompt - System role/instructions
 * @returns {Promise<string>} - LLM response
 */
async function callGroqLLM(userPrompt, systemPrompt = 'You are a helpful assistant.') {
  try {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('[RAG] LLM call failed:', error.message);
    throw error;
  }
}

export default router;
