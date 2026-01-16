/**
 * RAG Controller
 * Handles tender analysis using Retrieval Augmented Generation
 * 
 * Flow:
 * 1. Bidder uploads tender PDF → creates session → embeds document
 * 2. Analysis endpoints retrieve from session + global embeddings
 * 3. LLM generates grounded insights from retrieved context
 */

import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db.js';
import { ingestPdf } from '../services/rag/ingestion.service.js';
import { hybridRetrieve } from '../services/rag/retrieval.service.js';
import { callGroqLLM } from '../services/rag/llm.service.js';
import {
  buildTenderOverviewPrompt,
  buildSectionSummaryPrompt,
  buildInsightsPrompt,
  buildConversationalPrompt,
} from '../services/rag/prompt.service.js';

/**
 * Initialize tender analysis session
 * POST /api/rag/sessions/init
 */
export async function initAnalysisSession(req, res, next) {
  try {
    const { tender_id } = req.body;
    const user_id = req.user.id;

    if (!tender_id) {
      return res.status(400).json({ error: 'tender_id is required' });
    }

    // Check if tender exists
    const tenderResult = await pool.query(
      'SELECT id, title, document_url FROM tender WHERE id = $1',
      [tender_id]
    );

    if (tenderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    const tender = tenderResult.rows[0];

    if (!tender.document_url) {
      return res.status(400).json({ error: 'Tender has no PDF document' });
    }

    // Create session
    const session_id = uuidv4();
    
    await pool.query(
      `INSERT INTO rag_sessions (session_id, tender_id, user_id, status, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [session_id, tender_id, user_id, 'PROCESSING']
    );

    // Start ingestion asynchronously
    ingestPdf(tender.document_url, session_id, tender_id)
      .then(async () => {
        await pool.query(
          'UPDATE rag_sessions SET status = $1, updated_at = NOW() WHERE session_id = $2',
          ['READY', session_id]
        );
        console.log(`[RAG] Session ${session_id} ready`);
      })
      .catch(async (err) => {
        console.error(`[RAG] Ingestion failed for session ${session_id}:`, err);
        await pool.query(
          'UPDATE rag_sessions SET status = $1, error_message = $2, updated_at = NOW() WHERE session_id = $3',
          ['FAILED', err.message, session_id]
        );
      });

    res.json({
      session_id,
      tender_id,
      status: 'PROCESSING',
      message: 'Tender analysis initiated. Embedding in progress.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Check session status
 * GET /api/rag/sessions/:session_id/status
 */
export async function getSessionStatus(req, res, next) {
  try {
    const { session_id } = req.params;

    const result = await pool.query(
      `SELECT session_id, tender_id, status, error_message, created_at, updated_at
       FROM rag_sessions WHERE session_id = $1`,
      [session_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = result.rows[0];

    // Get embedding count
    const countResult = await pool.query(
      'SELECT COUNT(*) as chunk_count FROM rag_embeddings WHERE session_id = $1',
      [session_id]
    );

    res.json({
      session_id: session.session_id,
      tender_id: session.tender_id,
      status: session.status,
      error_message: session.error_message,
      chunks_embedded: parseInt(countResult.rows[0].chunk_count),
      created_at: session.created_at,
      updated_at: session.updated_at,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get tender overview (RAG-based summary)
 * POST /api/rag/analysis/overview
 */
export async function getTenderOverview(req, res, next) {
  try {
    const { session_id, tender_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    // Check session is ready
    const sessionCheck = await pool.query(
      'SELECT status FROM rag_sessions WHERE session_id = $1',
      [session_id]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (sessionCheck.rows[0].status !== 'READY') {
      return res.status(400).json({ 
        error: 'Session not ready',
        status: sessionCheck.rows[0].status 
      });
    }

    // Retrieve context for overview
    const queries = [
      'estimated value and budget',
      'eligibility criteria and requirements',
      'submission deadline and timeline',
      'mandatory documents and sections',
    ];

    const retrievalResults = await Promise.all(
      queries.map(q => hybridRetrieve(q, session_id, { topK: 5 }))
    );

    // Combine all contexts
    const combinedContext = {
      session_chunks: retrievalResults.flatMap(r => r.session_chunks),
      global_chunks: retrievalResults.flatMap(r => r.global_chunks),
    };

    // Build prompt
    const prompt = buildTenderOverviewPrompt(combinedContext);

    // Call LLM
    const overview = await callGroqLLM(prompt);

    res.json({
      tender_id,
      session_id,
      overview: JSON.parse(overview), // Expect structured JSON response
      chunks_used: combinedContext.session_chunks.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get section-wise summary
 * POST /api/rag/analysis/sections
 */
export async function getSectionSummaries(req, res, next) {
  try {
    const { session_id, sections } = req.body;

    if (!session_id || !sections || !Array.isArray(sections)) {
      return res.status(400).json({ error: 'session_id and sections array required' });
    }

    const summaries = await Promise.all(
      sections.map(async (section) => {
        const query = `${section} section requirements and details`;
        const retrievalResult = await hybridRetrieve(query, session_id, { topK: 8 });
        
        const prompt = buildSectionSummaryPrompt(retrievalResult, section);
        const summary = await callGroqLLM(prompt);

        return {
          section_name: section,
          summary: JSON.parse(summary),
          chunks_used: retrievalResult.session_chunks.length,
        };
      })
    );

    res.json({
      session_id,
      sections: summaries,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get AI insights (comparative analysis)
 * POST /api/rag/analysis/insights
 */
export async function getAIInsights(req, res, next) {
  try {
    const { session_id, tender_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    // Retrieve comparative context
    const queries = [
      'penalties and liquidated damages',
      'performance guarantees and bonds',
      'payment terms and conditions',
      'technical specifications and standards',
    ];

    const retrievalResults = await Promise.all(
      queries.map(q => hybridRetrieve(q, session_id, { topK: 6 }))
    );

    const combinedContext = {
      session_chunks: retrievalResults.flatMap(r => r.session_chunks),
      global_chunks: retrievalResults.flatMap(r => r.global_chunks),
    };

    const prompt = buildInsightsPrompt(combinedContext);
    const insights = await callGroqLLM(prompt);

    res.json({
      tender_id,
      session_id,
      insights: JSON.parse(insights),
      comparative_sources: combinedContext.global_chunks.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Conversational AI assistant
 * POST /api/rag/chat
 */
export async function chatWithTender(req, res, next) {
  try {
    const { session_id, question, conversation_history } = req.body;

    if (!session_id || !question) {
      return res.status(400).json({ error: 'session_id and question are required' });
    }

    // Retrieve relevant context for the question
    const retrievalResult = await hybridRetrieve(question, session_id, { topK: 10 });

    // Build conversational prompt
    const prompt = buildConversationalPrompt(
      retrievalResult,
      question,
      conversation_history || []
    );

    // Call LLM
    const answer = await callGroqLLM(prompt);

    res.json({
      session_id,
      question,
      answer,
      sources: retrievalResult.session_chunks.map(c => ({
        text: c.text.substring(0, 200) + '...',
        page: c.page_no,
        section: c.section,
      })),
      chunks_used: retrievalResult.session_chunks.length,
    });
  } catch (error) {
    next(error);
  }
}
