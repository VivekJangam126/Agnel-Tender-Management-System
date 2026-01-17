/**
 * Reviewer Routes
 * Handles reviewer-specific endpoints:
 * - Get all assignments for the logged-in reviewer
 * - Access section content based on permissions
 */

import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { pool } from '../config/db.js';

const router = Router();

/**
 * GET /api/reviewer/assignments
 * Get all section assignments for the current reviewer
 */
router.get('/assignments', requireAuth, requireRole('REVIEWER'), async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get platform tender assignments
    const platformAssignments = await pool.query(
      `SELECT
        pc.collaborator_id,
        pc.section_id,
        pc.permission,
        pc.assigned_at,
        'platform' as tender_type,
        p.proposal_id,
        p.status as proposal_status,
        t.title as tender_title,
        ts.title as section_title,
        o.name as organization_name,
        NULL as uploaded_tender_id,
        NULL as section_key
       FROM proposal_collaborator pc
       JOIN proposal p ON pc.proposal_id = p.proposal_id
       JOIN tender t ON p.tender_id = t.tender_id
       JOIN tender_section ts ON pc.section_id = ts.section_id
       JOIN organization o ON p.organization_id = o.organization_id
       WHERE pc.user_id = $1
       ORDER BY pc.assigned_at DESC`,
      [userId]
    );

    // Get uploaded tender assignments
    const uploadedAssignments = await pool.query(
      `SELECT
        upc.collaborator_id,
        upc.section_key as section_id,
        upc.permission,
        upc.assigned_at,
        'uploaded' as tender_type,
        NULL as proposal_id,
        ut.status as proposal_status,
        ut.title as tender_title,
        upc.section_key as section_title,
        o.name as organization_name,
        upc.uploaded_tender_id,
        upc.section_key
       FROM uploaded_proposal_collaborator upc
       JOIN uploaded_tender ut ON upc.uploaded_tender_id = ut.uploaded_tender_id
       JOIN organization o ON ut.organization_id = o.organization_id
       WHERE upc.user_id = $1
       ORDER BY upc.assigned_at DESC`,
      [userId]
    );

    // Combine assignments
    const allAssignments = [
      ...platformAssignments.rows,
      ...uploadedAssignments.rows,
    ].sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at));

    // Calculate stats
    const stats = {
      total: allAssignments.length,
      canEdit: allAssignments.filter(a => a.permission === 'EDIT').length,
      canComment: allAssignments.filter(a => a.permission === 'READ_AND_COMMENT').length,
      completed: 0, // Would need additional tracking for this
    };

    res.json({
      success: true,
      data: {
        assignments: allAssignments,
        stats,
      },
    });
  } catch (err) {
    console.error('[Reviewer] Get assignments error:', err);
    next(err);
  }
});

/**
 * GET /api/reviewer/proposals/:proposalId/sections/:sectionId
 * Get section content for review (platform tender)
 */
router.get('/proposals/:proposalId/sections/:sectionId', requireAuth, requireRole('REVIEWER'), async (req, res, next) => {
  try {
    const { proposalId, sectionId } = req.params;
    const userId = req.user.id;

    // Check if user has permission for this section
    const permissionCheck = await pool.query(
      `SELECT permission FROM proposal_collaborator
       WHERE proposal_id = $1 AND section_id = $2 AND user_id = $3`,
      [proposalId, sectionId, userId]
    );

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not assigned to this section',
      });
    }

    const permission = permissionCheck.rows[0].permission;

    // Get section content
    const sectionResult = await pool.query(
      `SELECT
        ts.section_id,
        ts.title,
        ts.content as requirements,
        ts.is_mandatory,
        psr.content as draft_content,
        psr.updated_at as last_updated,
        t.title as tender_title,
        p.proposal_id,
        p.status as proposal_status
       FROM tender_section ts
       JOIN tender t ON ts.tender_id = t.tender_id
       JOIN proposal p ON p.tender_id = t.tender_id
       LEFT JOIN proposal_section_response psr ON psr.proposal_id = p.proposal_id AND psr.section_id = ts.section_id
       WHERE p.proposal_id = $1 AND ts.section_id = $2`,
      [proposalId, sectionId]
    );

    if (sectionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Section not found' });
    }

    res.json({
      success: true,
      data: {
        ...sectionResult.rows[0],
        permission,
        canEdit: permission === 'EDIT',
        canComment: true,
      },
    });
  } catch (err) {
    console.error('[Reviewer] Get section error:', err);
    next(err);
  }
});

/**
 * PUT /api/reviewer/proposals/:proposalId/sections/:sectionId
 * Update section content (requires EDIT permission)
 */
router.put('/proposals/:proposalId/sections/:sectionId', requireAuth, requireRole('REVIEWER'), async (req, res, next) => {
  try {
    const { proposalId, sectionId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Check if user has EDIT permission
    const permissionCheck = await pool.query(
      `SELECT permission FROM proposal_collaborator
       WHERE proposal_id = $1 AND section_id = $2 AND user_id = $3`,
      [proposalId, sectionId, userId]
    );

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not assigned to this section',
      });
    }

    if (permissionCheck.rows[0].permission !== 'EDIT') {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'You do not have edit permission for this section',
      });
    }

    // Update or insert section content
    const result = await pool.query(
      `INSERT INTO proposal_section_response (proposal_id, section_id, content, last_edited_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (proposal_id, section_id)
       DO UPDATE SET content = $3, last_edited_by = $4, updated_at = NOW()
       RETURNING *`,
      [proposalId, sectionId, content, userId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Section updated successfully',
    });
  } catch (err) {
    console.error('[Reviewer] Update section error:', err);
    next(err);
  }
});

/**
 * GET /api/reviewer/uploaded-tenders/:uploadedTenderId/sections/:sectionKey
 * Get section content for review (uploaded tender)
 */
router.get('/uploaded-tenders/:uploadedTenderId/sections/:sectionKey', requireAuth, requireRole('REVIEWER'), async (req, res, next) => {
  try {
    const { uploadedTenderId, sectionKey } = req.params;
    const userId = req.user.id;

    // Check permission
    const permissionCheck = await pool.query(
      `SELECT permission FROM uploaded_proposal_collaborator
       WHERE uploaded_tender_id = $1 AND section_key = $2 AND user_id = $3`,
      [uploadedTenderId, sectionKey, userId]
    );

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not assigned to this section',
      });
    }

    const permission = permissionCheck.rows[0].permission;

    // Get uploaded tender info and section content
    const tenderResult = await pool.query(
      `SELECT
        ut.uploaded_tender_id,
        ut.title as tender_title,
        ut.status,
        ut.analysis_data
       FROM uploaded_tender ut
       WHERE ut.uploaded_tender_id = $1`,
      [uploadedTenderId]
    );

    if (tenderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    const tender = tenderResult.rows[0];
    const analysisData = tender.analysis_data || {};

    // Find section in normalizedSections
    const normalizedSections = analysisData.normalizedSections || [];
    const section = normalizedSections.find(s => s.key === sectionKey) || {};

    // Get draft content if exists
    const draftResult = await pool.query(
      `SELECT content, updated_at FROM uploaded_proposal_draft
       WHERE uploaded_tender_id = $1 AND section_key = $2`,
      [uploadedTenderId, sectionKey]
    );

    const draft = draftResult.rows[0] || {};

    res.json({
      success: true,
      data: {
        uploaded_tender_id: uploadedTenderId,
        section_key: sectionKey,
        title: section.name || section.title || sectionKey,
        requirements: section.aiSummary || section.content || '',
        draft_content: draft.content || '',
        last_updated: draft.updated_at,
        tender_title: tender.title,
        permission,
        canEdit: permission === 'EDIT',
        canComment: true,
      },
    });
  } catch (err) {
    console.error('[Reviewer] Get uploaded section error:', err);
    next(err);
  }
});

/**
 * PUT /api/reviewer/uploaded-tenders/:uploadedTenderId/sections/:sectionKey
 * Update uploaded tender section content
 */
router.put('/uploaded-tenders/:uploadedTenderId/sections/:sectionKey', requireAuth, requireRole('REVIEWER'), async (req, res, next) => {
  try {
    const { uploadedTenderId, sectionKey } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Check EDIT permission
    const permissionCheck = await pool.query(
      `SELECT permission FROM uploaded_proposal_collaborator
       WHERE uploaded_tender_id = $1 AND section_key = $2 AND user_id = $3`,
      [uploadedTenderId, sectionKey, userId]
    );

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not assigned to this section',
      });
    }

    if (permissionCheck.rows[0].permission !== 'EDIT') {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'You do not have edit permission for this section',
      });
    }

    // Update or insert draft content
    const result = await pool.query(
      `INSERT INTO uploaded_proposal_draft (uploaded_tender_id, section_key, content, last_edited_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (uploaded_tender_id, section_key)
       DO UPDATE SET content = $3, last_edited_by = $4, updated_at = NOW()
       RETURNING *`,
      [uploadedTenderId, sectionKey, content, userId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Section updated successfully',
    });
  } catch (err) {
    console.error('[Reviewer] Update uploaded section error:', err);
    next(err);
  }
});

export default router;
