import { EvaluationService } from '../services/evaluation.service.js';
import { MultiStepEvaluationService } from '../services/multiStepEvaluation.service.js';
import { pool } from '../config/db.js';

/**
 * Get list of tenders ready for evaluation
 */
export async function getTendersForEvaluation(req, res, next) {
  try {
    const tenders = await EvaluationService.getTendersForEvaluation(req.user);
    res.json({ tenders });
  } catch (err) {
    next(err);
  }
}

/**
 * Get bids for a specific tender
 */
export async function getBidsForTender(req, res, next) {
  try {
    const { tenderId } = req.params;
    const bids = await EvaluationService.getBidsForTender(tenderId, req.user);
    res.json({ bids });
  } catch (err) {
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message });
    }
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * Initialize evaluation for a tender
 */
export async function initializeTenderEvaluation(req, res, next) {
  try {
    const { tenderId } = req.params;
    const result = await EvaluationService.initializeTenderEvaluation(tenderId, req.user);
    res.json(result);
  } catch (err) {
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message });
    }
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * Update bid evaluation
 */
export async function updateBidEvaluation(req, res, next) {
  try {
    const { proposalId } = req.params;
    const { technical_status, technical_score, remarks } = req.body;

    if (!technical_status) {
      return res.status(400).json({ error: 'Technical status is required' });
    }

    const result = await EvaluationService.updateBidEvaluation(
      proposalId,
      { technical_status, technical_score, remarks },
      req.user
    );

    res.json(result);
  } catch (err) {
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message });
    }
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * Complete evaluation for a tender
 */
export async function completeEvaluation(req, res, next) {
  try {
    const { tenderId } = req.params;
    const result = await EvaluationService.completeEvaluation(tenderId, req.user);
    res.json(result);
  } catch (err) {
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message });
    }
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * Get evaluation details for a tender
 */
export async function getTenderEvaluationDetails(req, res, next) {
  try {
    const { tenderId } = req.params;
    const details = await EvaluationService.getTenderEvaluationDetails(tenderId, req.user);
    res.json({ details });
  } catch (err) {
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message });
    }
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * Get AI-powered evaluation score for a proposal
 * Uses multi-step evaluation to assess compliance, technical, financial, and risk
 */
export async function getAIEvaluationScore(req, res, next) {
  try {
    const { proposalId } = req.params;

    // Get proposal with sections
    const proposalRes = await pool.query(
      `SELECT p.proposal_id, p.tender_id, p.organization_id, p.status,
              t.title as tender_title, t.organization_id as tender_org_id,
              org.name as bidder_organization
       FROM proposal p
       JOIN tender t ON p.tender_id = t.tender_id
       JOIN organization org ON p.organization_id = org.organization_id
       WHERE p.proposal_id = $1`,
      [proposalId]
    );

    if (proposalRes.rows.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const proposal = proposalRes.rows[0];

    // Verify authority owns the tender
    if (proposal.tender_org_id !== req.user.organization_id) {
      return res.status(403).json({ error: 'Unauthorized: Not your tender' });
    }

    // Get proposal section responses
    const sectionsRes = await pool.query(
      `SELECT psr.response_id, psr.content, ts.title, ts.section_id, ts.is_mandatory
       FROM proposal_section_response psr
       JOIN tender_section ts ON psr.section_id = ts.section_id
       WHERE psr.proposal_id = $1
       ORDER BY ts.order_index`,
      [proposalId]
    );

    // Format sections for evaluation
    const proposalData = {
      sections: sectionsRes.rows.map(row => ({
        id: row.section_id,
        title: row.title,
        content: row.content || '',
        isMandatory: row.is_mandatory,
        wordCount: (row.content || '').split(/\s+/).filter(Boolean).length
      }))
    };

    // Run multi-step AI evaluation
    const sessionId = `eval-${proposalId}-${Date.now()}`;
    const aiEvaluation = await MultiStepEvaluationService.evaluateProposal(
      sessionId,
      proposalData,
      proposal.tender_id
    );

    // Return comprehensive evaluation
    res.json({
      proposalId,
      tenderId: proposal.tender_id,
      bidderOrganization: proposal.bidder_organization,
      tenderTitle: proposal.tender_title,
      aiEvaluation: {
        overallScore: aiEvaluation.overallScore,
        overallAssessment: aiEvaluation.overallAssessment,
        winProbability: aiEvaluation.winProbability,
        winProbabilityReason: aiEvaluation.winProbabilityReason,
        scores: aiEvaluation.scores,
        strengths: aiEvaluation.strengths,
        weaknesses: aiEvaluation.weaknesses,
        missingElements: aiEvaluation.missingElements,
        improvements: aiEvaluation.improvements,
        recommendedActions: aiEvaluation.recommendedActions,
        evaluatedAt: aiEvaluation.evaluatedAt
      }
    });
  } catch (err) {
    console.error('[AI Evaluation] Error:', err.message);
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message });
    }
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}
