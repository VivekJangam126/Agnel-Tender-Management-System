import { Router } from 'express';
import { TenderService } from '../services/tender.service.js';
import { ProposalService } from '../services/proposal.service.js';
import { AIService } from '../services/ai.service.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { aiRateLimiter } from '../middlewares/rate-limit.middleware.js';
import { pool } from '../config/db.js';

const router = Router();

// ==========================================
// BIDDER TENDER ENDPOINTS
// ==========================================

/**
 * GET /api/bidder/tenders
 * List published tenders for bidder
 */
router.get('/tenders', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const tenders = await TenderService.listTenders(req.user, { status: 'PUBLISHED' });
    // Transform to Omkar's expected format (_id instead of tender_id, organizationId object)
    const transformedTenders = tenders.map(t => ({
      _id: t.tender_id,
      title: t.title,
      description: t.description,
      status: t.status,
      deadline: t.submission_deadline,
      value: t.estimated_value,
      currency: 'INR', // Default currency
      category: t.sector,
      organizationId: {
        organizationName: t.organization_name,
        industryDomain: t.sector || 'General'
      },
      createdAt: t.created_at
    }));
    res.json({ tenders: transformedTenders });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/bidder/tenders/:id
 * Get tender details with sections (read-only for bidder)
 */
router.get('/tenders/:id', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenderData = await TenderService.getTenderById(id, req.user);
    
    // Ensure tender is published
    if (tenderData.status !== 'PUBLISHED') {
      return res.status(403).json({ error: 'This tender is not available' });
    }
    
    // Transform to Omkar's expected format
    const tender = {
      _id: tenderData.tender_id,
      title: tenderData.title,
      description: tenderData.description,
      status: tenderData.status,
      deadline: tenderData.submission_deadline,
      value: tenderData.estimated_value,
      currency: 'INR', // Default currency
      category: tenderData.sector,
      organizationId: {
        organizationName: tenderData.organization_name,
        industryDomain: tenderData.sector || 'General'
      },
      createdAt: tenderData.created_at
    };
    
    // Transform sections to Omkar's format
    const sections = (tenderData.sections || []).map((s, index) => ({
      _id: s.section_id,
      sectionOrder: s.order_index || (index + 1),
      title: s.title,
      sectionTitle: s.title,
      content: s.content || s.description || '',
      description: s.description || s.content || '',
      keyPoints: [],  // Can be populated from AI analysis later
      complexity: 'Medium',  // Default complexity
      tenderId: id
    }));
    
    // Check if bidder already has a proposal for this tender
    const existingProposalQuery = await pool.query(
      `SELECT proposal_id FROM proposal WHERE tender_id = $1 AND organization_id = $2 LIMIT 1`,
      [id, req.user.organizationId]
    );
    
    const existingProposal = existingProposalQuery.rows.length > 0 
      ? { proposalId: existingProposalQuery.rows[0].proposal_id }
      : null;
    
    res.json({ 
      data: {
        tender,
        sections,
        existingProposal
      }
    });
  } catch (err) {
    if (err.message === 'Tender not found') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

/**
 * POST /api/bidder/tenders/:id/analyze
 * AI analysis of tender (advisory only)
 * Body: { question?: string }
 */
router.post('/tenders/:id/analyze', requireAuth, requireRole('BIDDER'), aiRateLimiter, async (req, res, next) => {
  try {
    const { id: tenderId } = req.params;
    const { question } = req.body;
    
    // Verify tender exists and is published
    const tender = await TenderService.getTenderById(tenderId, req.user);
    if (tender.status !== 'PUBLISHED') {
      return res.status(403).json({ error: 'This tender is not available' });
    }
    
    // Use AI to analyze tender
    const analysis = await AIService.queryTender(
      tenderId,
      question || 'Analyze this tender for risks, eligibility requirements, and key considerations.',
      req.user
    );
    
    res.json({ 
      tenderId,
      analysis,
      advisory: true,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    if (err.message === 'Tender not found') {
      return res.status(404).json({ error: err.message });
    }
    if (err.message?.includes('rate limit')) {
      return res.status(429).json({ error: 'Too many requests, please try again later' });
    }
    next(err);
  }
});

// ==========================================
// BIDDER PROPOSAL ENDPOINTS
// ==========================================

/**
 * POST /api/bidder/proposals
 * Create a new proposal draft for a tender
 * Body: { tenderId }
 */
router.post('/proposals', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const { tenderId } = req.body;
    console.log('[POST /api/bidder/proposals] Request body:', req.body);
    console.log('[POST /api/bidder/proposals] tenderId:', tenderId);
    
    if (!tenderId) {
      console.log('[POST /api/bidder/proposals] ERROR: tenderId is missing');
      return res.status(400).json({ error: 'tenderId is required' });
    }

    const proposalData = await ProposalService.createProposalDraft(tenderId, req.user);
    
    // Transform to Omkar's expected format
    const proposal = {
      _id: proposalData.proposal_id,
      tenderId: proposalData.tender_id,
      status: proposalData.status,
      createdAt: proposalData.created_at
    };
    
    console.log('[POST /api/bidder/proposals] SUCCESS: Created proposal', proposal._id);
    res.status(201).json({ data: { proposal } });
  } catch (err) {
    console.log('[POST /api/bidder/proposals] ERROR:', err.message);
    if (err.message === 'Tender not found') return res.status(404).json({ error: err.message });
    if (err.message.includes('non-published')) return res.status(403).json({ error: err.message });
    if (err.message.includes('already exists')) return res.status(400).json({ error: err.message });
    next(err);
  }
});

/**
 * GET /api/bidder/proposals/my-proposals
 * List bidder's own proposals (alias for /proposals)
 */
router.get('/proposals/my-proposals', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const proposalsData = await ProposalService.listForBidder(req.user);
    
    // Transform to Omkar's expected format with tender details
    const proposals = proposalsData.map(p => ({
      _id: p.proposal_id,
      tenderId: p.tender_id,
      tenderTitle: p.tender_title || 'Tender',
      status: p.status,
      completedSections: parseInt(p.completed_sections) || 0,
      totalSections: parseInt(p.total_sections) || 0,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));
    
    res.json({ data: { proposals } });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/bidder/proposals/tender/:tenderId
 * Get proposal by tender ID (creates if doesn't exist)
 */
router.get('/proposals/tender/:tenderId', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const { tenderId } = req.params;
    
    // Try to find existing proposal for this tender
    const existingProposalQuery = await pool.query(
      `SELECT p.proposal_id, p.tender_id, p.status, p.created_at, p.updated_at,
              t.title as tender_name,
              COUNT(DISTINCT ts.section_id) as total_sections,
              COUNT(DISTINCT CASE WHEN psr.content IS NOT NULL AND LENGTH(TRIM(psr.content)) >= 50 THEN psr.section_id END) as completed_sections
       FROM proposal p
       JOIN tender t ON p.tender_id = t.tender_id
       LEFT JOIN tender_section ts ON t.tender_id = ts.tender_id
       LEFT JOIN proposal_section_response psr ON p.proposal_id = psr.proposal_id AND ts.section_id = psr.section_id
       WHERE p.tender_id = $1 AND p.organization_id = $2
       GROUP BY p.proposal_id, p.tender_id, p.status, p.created_at, p.updated_at, t.title
       LIMIT 1`,
      [tenderId, req.user.organizationId]
    );
    
    if (existingProposalQuery.rows.length > 0) {
      const p = existingProposalQuery.rows[0];
      
      // Fetch section responses
      const responsesQuery = await pool.query(
        `SELECT psr.section_id, psr.content, ts.title as section_name
         FROM proposal_section_response psr
         JOIN tender_section ts ON psr.section_id = ts.section_id
         WHERE psr.proposal_id = $1
         ORDER BY ts.order_index`,
        [p.proposal_id]
      );
      
      const proposal = {
        _id: p.proposal_id,
        tenderId: p.tender_id,
        tenderTitle: p.tender_name,
        status: p.status,
        completedSections: parseInt(p.completed_sections) || 0,
        totalSections: parseInt(p.total_sections) || 0,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        sections: responsesQuery.rows.map(r => ({
          sectionId: r.section_id,
          sectionName: r.section_name,
          content: r.content || ''
        }))
      };
      
      return res.json({ data: { proposal } });
    }
    
    // If no proposal exists, return 404 (frontend will create one)
    return res.status(404).json({ error: 'Proposal not found' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/bidder/proposals/:id
 * Get proposal details (bidder can only see their own)
 */
router.get('/proposals/:id', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const proposalData = await ProposalService.getProposal(id, req.user);
    
    // Ensure bidder only sees their own proposals
    if (proposalData.organization_id !== req.user.organizationId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Transform to Omkar's expected format
    const proposal = {
      _id: proposalData.proposal_id,
      tenderId: {
        title: proposalData.tender_name || 'Tender'
      },
      status: proposalData.status,
      createdAt: proposalData.created_at
    };
    
    // Transform section responses to Omkar's format
    const sections = (proposalData.responses || []).map((resp, index) => ({
      _id: resp.section_id,
      sectionOrder: index + 1,
      sectionName: resp.section_name || '',
      content: resp.content || ''
    }));
    
    res.json({ 
      data: {
        proposal,
        sections
      }
    });
  } catch (err) {
    if (err.message === 'Proposal not found') return res.status(404).json({ error: err.message });
    if (err.message === 'Forbidden') return res.status(403).json({ error: err.message });
    next(err);
  }
});

/**
 * PUT /api/bidder/proposals/:id/sections/:sectionId
 * Update proposal section response (draft only)
 * Body: { content }
 */
router.put('/proposals/:id/sections/:sectionId', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const { id, sectionId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }

    const response = await ProposalService.upsertSectionResponse(id, sectionId, content, req.user);
    res.json(response);
  } catch (err) {
    if (err.message === 'Proposal not found') return res.status(404).json({ error: err.message });
    if (err.message === 'Section does not belong to this tender') return res.status(400).json({ error: err.message });
    if (err.message === 'Forbidden') return res.status(403).json({ error: err.message });
    if (err.message === 'Cannot edit a non-draft proposal') return res.status(403).json({ error: err.message });
    next(err);
  }
});

/**
 * POST /api/bidder/proposals/:id/submit
 * Submit a draft proposal (DRAFT → SUBMITTED)
 */
router.post('/proposals/:id/submit', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const proposalData = await ProposalService.submitProposal(id, req.user);
    
    // Transform to Omkar's expected format
    const proposal = {
      _id: proposalData.proposal_id,
      tenderId: proposalData.tender_id,
      status: proposalData.status,
      createdAt: proposalData.created_at
    };
    
    res.json({ data: { proposal } });
  } catch (err) {
    if (err.message === 'Proposal not found') return res.status(404).json({ error: err.message });
    if (err.message === 'Forbidden') return res.status(403).json({ error: err.message });
    if (err.message === 'Only draft proposals can be submitted') return res.status(400).json({ error: err.message });
    next(err);
  }
});

/**
 * POST /api/bidder/proposals/:id/sections/:sectionId/analyze
 * Get AI analysis for a proposal section (advisory only)
 * Body: { draftContent, tenderRequirement, sectionType, userQuestion }
 */
router.post('/proposals/:id/sections/:sectionId/analyze', requireAuth, requireRole('BIDDER'), aiRateLimiter, async (req, res, next) => {
  try {
    const { id: proposalId, sectionId } = req.params;
    const { draftContent, tenderRequirement, sectionType, userQuestion } = req.body;

    if (!draftContent || !sectionType) {
      return res.status(400).json({ error: 'draftContent and sectionType are required' });
    }

    // Verify proposal ownership
    const proposalCheck = await pool.query(
      'SELECT organization_id FROM proposal WHERE proposal_id = $1',
      [proposalId]
    );
    if (proposalCheck.rows.length === 0 || proposalCheck.rows[0].organization_id !== req.user.organizationId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get AI analysis with fallback
    const analysis = await AIService.analyzeProposalSection(
      sectionType,
      draftContent,
      tenderRequirement || '',
      userQuestion || ''
    );

    res.json({ data: { analysis } });
  } catch (err) {
    // Log error but return graceful fallback response
    console.error('AI analysis error:', err.message);
    
    // Return rule-based fallback guidance
    const fallbackGuidance = {
      observation: 'Unable to fetch live AI analysis',
      suggestedText: 'Review your draft against the tender requirements and government guidelines',
      reason: 'Live AI analysis temporarily unavailable. Please review your content manually or try again.',
      isFallback: true
    };
    
    res.json({ data: { analysis: fallbackGuidance } });
  }
});

export default router;
