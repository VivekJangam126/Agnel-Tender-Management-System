import { Router } from 'express';
import { TenderService } from '../services/tender.service.js';
import { ProposalService } from '../services/proposal.service.js';
import { ProposalExportService } from '../services/proposal-export.service.js';
import { ProposalPublishService } from '../services/proposal-publish.service.js';
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
 * List published tenders for bidder with real statistics
 */
router.get('/tenders', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const tenders = await TenderService.listTenders(req.user, { status: 'PUBLISHED' });

    // Get proposal counts for all tenders in one query
    const tenderIds = tenders.map(t => t.tender_id);
    let proposalCounts = {};

    if (tenderIds.length > 0) {
      const countsResult = await pool.query(
        `SELECT tender_id, COUNT(*) as count
         FROM proposal
         WHERE tender_id = ANY($1)
         GROUP BY tender_id`,
        [tenderIds]
      );
      countsResult.rows.forEach(row => {
        proposalCounts[row.tender_id] = parseInt(row.count) || 0;
      });
    }

    // Transform with real statistics
    const transformedTenders = tenders.map(t => {
      const daysRemaining = t.submission_deadline
        ? Math.max(0, Math.ceil((new Date(t.submission_deadline) - new Date()) / (1000 * 60 * 60 * 24)))
        : 30;

      return {
        _id: t.tender_id,
        title: t.title,
        description: t.description,
        status: t.status,
        deadline: t.submission_deadline,
        daysRemaining,
        value: t.estimated_value,
        estimatedValue: t.estimated_value,
        currency: 'INR',
        category: t.sector,
        organizationId: {
          organizationName: t.organization_name,
          industryDomain: t.sector || 'General'
        },
        createdAt: t.created_at,
        // Real proposal count
        proposalCount: proposalCounts[t.tender_id] || 0
      };
    });

    // Calculate aggregate statistics for the discovery page
    const totalValue = tenders.reduce((sum, t) => sum + (parseFloat(t.estimated_value) || 0), 0);
    const avgCompetition = transformedTenders.length > 0
      ? Math.round(transformedTenders.reduce((sum, t) => sum + t.proposalCount, 0) / transformedTenders.length)
      : 0;
    const closingSoon = transformedTenders.filter(t => t.daysRemaining <= 14).length;

    res.json({
      tenders: transformedTenders,
      statistics: {
        totalTenders: transformedTenders.length,
        totalValue,
        avgCompetition,
        closingSoon
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/bidder/tenders/:id
 * Get tender details with sections (read-only for bidder)
 * Includes real statistics: proposal count, section complexity, word counts
 */
router.get('/tenders/:id', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenderData = await TenderService.getTenderById(id, req.user);

    // Ensure tender is published
    if (tenderData.status !== 'PUBLISHED') {
      return res.status(403).json({ error: 'This tender is not available' });
    }

    // Get real proposal count for this tender
    const proposalCountQuery = await pool.query(
      `SELECT COUNT(*) as count FROM proposal WHERE tender_id = $1`,
      [id]
    );
    const proposalCount = parseInt(proposalCountQuery.rows[0].count) || 0;

    // Calculate tender statistics
    const totalContent = (tenderData.description || '') +
      (tenderData.sections || []).map(s => s.content || s.description || '').join(' ');
    const wordCount = totalContent.trim().split(/\s+/).filter(w => w.length > 0).length;
    const sectionCount = (tenderData.sections || []).length;

    // Calculate complexity for each section based on content analysis
    const calculateComplexity = (content) => {
      if (!content) return { level: 'Low', score: 1 };
      const text = content.toLowerCase();
      const words = text.split(/\s+/).length;

      // Complexity factors
      let score = 0;

      // Word count factor
      if (words > 500) score += 3;
      else if (words > 200) score += 2;
      else if (words > 100) score += 1;

      // Technical terms
      const technicalTerms = ['compliance', 'specification', 'requirement', 'mandatory', 'certification',
        'iso', 'standard', 'audit', 'verification', 'validation', 'qualification', 'technical'];
      const techCount = technicalTerms.filter(term => text.includes(term)).length;
      score += Math.min(techCount, 3);

      // Legal/financial terms
      const legalTerms = ['penalty', 'liquidated', 'indemnity', 'liability', 'warranty', 'guarantee',
        'arbitration', 'jurisdiction', 'force majeure', 'termination'];
      const legalCount = legalTerms.filter(term => text.includes(term)).length;
      score += Math.min(legalCount, 2);

      // Numeric requirements (specific numbers usually indicate complexity)
      const numericMatches = text.match(/\d+(\.\d+)?%|\₹\s*\d+|rs\.?\s*\d+|\d+\s*(years?|days?|months?)/gi);
      if (numericMatches && numericMatches.length > 3) score += 2;
      else if (numericMatches && numericMatches.length > 1) score += 1;

      // Determine level
      if (score >= 7) return { level: 'Very High', score };
      if (score >= 5) return { level: 'High', score };
      if (score >= 3) return { level: 'Medium', score };
      return { level: 'Low', score };
    };

    // Transform to expected format with real statistics
    const tender = {
      _id: tenderData.tender_id,
      title: tenderData.title,
      description: tenderData.description,
      status: tenderData.status,
      deadline: tenderData.submission_deadline,
      value: tenderData.estimated_value,
      currency: 'INR',
      category: tenderData.sector,
      organizationId: {
        organizationName: tenderData.organization_name,
        industryDomain: tenderData.sector || 'General'
      },
      createdAt: tenderData.created_at,
      // Real statistics
      statistics: {
        proposalCount,
        wordCount,
        sectionCount,
        estimatedReadTime: Math.ceil(wordCount / 200), // ~200 words per minute
        mandatorySections: (tenderData.sections || []).filter(s => s.is_mandatory).length
      }
    };

    // Transform sections with calculated complexity
    const sections = (tenderData.sections || []).map((s, index) => {
      const content = s.content || s.description || '';
      const complexity = calculateComplexity(content);
      const sectionWords = content.trim().split(/\s+/).filter(w => w.length > 0).length;

      return {
        _id: s.section_id,
        sectionOrder: s.order_index || (index + 1),
        title: s.title,
        sectionTitle: s.title,
        content: content,
        description: s.description || s.content || '',
        keyPoints: [],
        complexity: complexity.level,
        complexityScore: complexity.score,
        wordCount: sectionWords,
        isMandatory: s.is_mandatory || false,
        tenderId: id
      };
    });

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
 * Update proposal section response (draft only - HARD LOCK after submission)
 * Body: { content }
 */
router.put('/proposals/:id/sections/:sectionId', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const { id, sectionId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }

    // HARD LOCK: Check proposal status BEFORE any update
    const statusCheck = await pool.query(
      'SELECT status FROM proposal WHERE proposal_id = $1',
      [id]
    );
    
    if (statusCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (statusCheck.rows[0].status !== 'DRAFT') {
      return res.status(403).json({
        error: 'Proposal locked',
        message: 'Submitted proposals cannot be edited. The proposal is now read-only.'
      });
    }

    const response = await ProposalService.upsertSectionResponse(id, sectionId, content, req.user);
    res.json(response);
  } catch (err) {
    if (err.message === 'Proposal not found') return res.status(404).json({ error: err.message });
    if (err.message === 'Section does not belong to this tender') return res.status(400).json({ error: err.message });
    if (err.message === 'Forbidden') return res.status(403).json({ error: err.message });
    if (err.message === 'Cannot edit a non-draft proposal') return res.status(403).json({ error: err.message, message: 'Submitted proposals cannot be edited.' });
    next(err);
  }
});

/**
 * POST /api/bidder/proposals/:id/submit
 * Submit a draft proposal (DRAFT → SUBMITTED) with full validation
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
      createdAt: proposalData.created_at,
      submittedAt: proposalData.submitted_at
    };
    
    res.json({ data: { proposal } });
  } catch (err) {
    // Validation errors with detailed feedback
    if (err.message === 'Proposal incomplete') {
      return res.status(400).json({
        error: err.message,
        details: err.details,
        incompleteSections: err.incompleteSections || [],
        incompleteIds: err.incompleteIds || []
      });
    }
    
    if (err.message === 'Proposal not found') return res.status(404).json({ error: err.message });
    if (err.message === 'Forbidden') return res.status(403).json({ error: err.message });
    if (err.message === 'Proposal already submitted') return res.status(400).json({ error: err.message, details: err.details });
    
    next(err);
  }
});

/**
 * POST /api/bidder/proposals/:id/sections/:sectionId/analyze
 * AI-powered analysis of proposal section draft (DRAFT only - HARD LOCK after submission)
 * ALWAYS returns HTTP 200 - uses fallback if AI fails
 */
router.post('/proposals/:id/sections/:sectionId/analyze', requireAuth, requireRole('BIDDER'), aiRateLimiter, async (req, res, next) => {
  try {
    const { id: proposalId, sectionId } = req.params;
    const { draftContent, tenderRequirement, userQuestion, sectionType } = req.body;

    if (!draftContent || !sectionType) {
      return res.status(400).json({ error: 'draftContent and sectionType are required' });
    }

    // Verify proposal ownership
    const proposalCheck = await pool.query(
      'SELECT organization_id, status FROM proposal WHERE proposal_id = $1',
      [proposalId]
    );
    
    if (proposalCheck.rows.length === 0 || proposalCheck.rows[0].organization_id !== req.user.organizationId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // HARD LOCK: Prevent AI analysis on submitted proposals
    if (proposalCheck.rows[0].status !== 'DRAFT') {
      return res.status(403).json({
        error: 'Proposal locked',
        message: 'Cannot analyze submitted proposals. The proposal is now read-only.'
      });
    }

    // Get AI analysis with guaranteed fallback (never throws)
    const analysis = await AIService.analyzeProposalSection(
      sectionType,
      draftContent,
      tenderRequirement || '',
      userQuestion || ''
    );

    // ALWAYS return HTTP 200 with structured analysis
    // analysis.mode will be 'ai' or 'fallback'
    res.json({ 
      success: true,
      data: { analysis } 
    });

  } catch (err) {
    // This should rarely execute since AIService has internal error handling
    console.error('[Bidder Routes] Unexpected error in analyze endpoint:', err.message);
    
    // Emergency fallback response
    res.json({ 
      success: true,
      data: { 
        analysis: {
          mode: 'fallback',
          suggestions: [{
            observation: 'Analysis temporarily unavailable',
            suggestedImprovement: 'Review your draft against tender requirements manually',
            reason: 'System is experiencing temporary issues. Please try again or proceed with manual review.'
          }]
        }
      }
    });
  }
});

// ==========================================
// PROPOSAL EXPORT ENDPOINTS
// ==========================================

/**
 * GET /api/bidder/proposals/:id/export
 * Export proposal as PDF or DOCX
 * Query params: format (pdf|docx), template (formal|modern|minimal)
 */
router.get('/proposals/:id/export', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format = 'pdf', template = 'formal' } = req.query;

    // Validate format
    if (!['pdf', 'docx'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Use pdf or docx.' });
    }

    // Validate template
    if (!['formal', 'modern', 'minimal'].includes(template)) {
      return res.status(400).json({ error: 'Invalid template. Use formal, modern, or minimal.' });
    }

    let buffer;
    let contentType;
    let filename;

    if (format === 'pdf') {
      buffer = await ProposalExportService.generatePDF(id, template, req.user);
      contentType = 'application/pdf';
      filename = `proposal_${id}_${template}.pdf`;
    } else {
      buffer = await ProposalExportService.generateDOCX(id, template, req.user);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      filename = `proposal_${id}_${template}.docx`;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    if (err.message === 'Proposal not found') return res.status(404).json({ error: err.message });
    if (err.message === 'Forbidden') return res.status(403).json({ error: err.message });
    next(err);
  }
});

/**
 * GET /api/bidder/proposals/:id/export/preview
 * Get export preview data
 * Query params: template (formal|modern|minimal)
 */
router.get('/proposals/:id/export/preview', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { template = 'formal' } = req.query;

    const preview = await ProposalExportService.getExportPreview(id, template, req.user);
    res.json({ success: true, data: preview });
  } catch (err) {
    if (err.message === 'Proposal not found') return res.status(404).json({ error: err.message });
    if (err.message === 'Forbidden') return res.status(403).json({ error: err.message });
    next(err);
  }
});

// ==========================================
// PROPOSAL PUBLISH WORKFLOW ENDPOINTS
// ==========================================

/**
 * POST /api/bidder/proposals/:id/finalize
 * Finalize a proposal (DRAFT -> FINAL)
 */
router.post('/proposals/:id/finalize', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const proposal = await ProposalPublishService.finalizeProposal(id, req.user);

    res.json({
      success: true,
      data: {
        proposal: {
          _id: proposal.proposal_id,
          tenderId: proposal.tender_id,
          status: proposal.status,
          version: proposal.version,
          finalizedAt: proposal.finalized_at
        }
      },
      message: 'Proposal finalized successfully'
    });
  } catch (err) {
    if (err.message === 'Proposal not found') return res.status(404).json({ error: err.message });
    if (err.message === 'Forbidden') return res.status(403).json({ error: err.message });
    if (err.message.includes('Cannot finalize')) return res.status(400).json({ error: err.message });
    if (err.message.includes('incomplete mandatory')) {
      return res.status(400).json({
        error: err.message,
        incompleteSections: err.incompleteSections || []
      });
    }
    next(err);
  }
});

/**
 * POST /api/bidder/proposals/:id/publish
 * Publish a proposal (FINAL -> PUBLISHED)
 */
router.post('/proposals/:id/publish', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const proposal = await ProposalPublishService.publishProposal(id, req.user);

    res.json({
      success: true,
      data: {
        proposal: {
          _id: proposal.proposal_id,
          tenderId: proposal.tender_id,
          status: proposal.status,
          version: proposal.version,
          publishedAt: proposal.published_at
        }
      },
      message: 'Proposal published successfully'
    });
  } catch (err) {
    if (err.message === 'Proposal not found') return res.status(404).json({ error: err.message });
    if (err.message === 'Forbidden') return res.status(403).json({ error: err.message });
    if (err.message.includes('Cannot publish')) return res.status(400).json({ error: err.message });
    next(err);
  }
});

/**
 * POST /api/bidder/proposals/:id/revert
 * Revert a finalized proposal back to draft (FINAL -> DRAFT)
 */
router.post('/proposals/:id/revert', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const proposal = await ProposalPublishService.revertToDraft(id, req.user);

    res.json({
      success: true,
      data: {
        proposal: {
          _id: proposal.proposal_id,
          tenderId: proposal.tender_id,
          status: proposal.status,
          version: proposal.version
        }
      },
      message: 'Proposal reverted to draft'
    });
  } catch (err) {
    if (err.message === 'Proposal not found') return res.status(404).json({ error: err.message });
    if (err.message === 'Forbidden') return res.status(403).json({ error: err.message });
    if (err.message.includes('Cannot revert')) return res.status(400).json({ error: err.message });
    next(err);
  }
});

// ==========================================
// PROPOSAL VERSIONING ENDPOINTS
// ==========================================

/**
 * POST /api/bidder/proposals/:id/new-version
 * Create a new version of a published proposal
 */
router.post('/proposals/:id/new-version', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const newProposal = await ProposalPublishService.createNewVersion(id, req.user);

    res.status(201).json({
      success: true,
      data: {
        proposal: {
          _id: newProposal.proposal_id,
          tenderId: newProposal.tender_id,
          parentProposalId: newProposal.parent_proposal_id,
          version: newProposal.version,
          status: newProposal.status,
          createdAt: newProposal.created_at
        }
      },
      message: 'New version created successfully'
    });
  } catch (err) {
    if (err.message === 'Proposal not found') return res.status(404).json({ error: err.message });
    if (err.message === 'Forbidden') return res.status(403).json({ error: err.message });
    if (err.message.includes('Cannot create new version')) return res.status(400).json({ error: err.message });
    next(err);
  }
});

/**
 * GET /api/bidder/proposals/:id/versions
 * Get version history for a proposal
 */
router.get('/proposals/:id/versions', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await ProposalPublishService.getVersionHistory(id, req.user);

    res.json({
      success: true,
      data: history
    });
  } catch (err) {
    if (err.message === 'Proposal not found') return res.status(404).json({ error: err.message });
    if (err.message === 'Forbidden') return res.status(403).json({ error: err.message });
    next(err);
  }
});

/**
 * GET /api/bidder/proposals/:id/versions/:versionNumber
 * Get a specific version snapshot
 */
router.get('/proposals/:id/versions/:versionNumber', requireAuth, requireRole('BIDDER'), async (req, res, next) => {
  try {
    const { id, versionNumber } = req.params;
    const snapshot = await ProposalPublishService.getVersionSnapshot(id, parseInt(versionNumber), req.user);

    res.json({
      success: true,
      data: snapshot
    });
  } catch (err) {
    if (err.message === 'Proposal not found') return res.status(404).json({ error: err.message });
    if (err.message === 'Version not found') return res.status(404).json({ error: err.message });
    if (err.message === 'Forbidden') return res.status(403).json({ error: err.message });
    next(err);
  }
});

export default router;
