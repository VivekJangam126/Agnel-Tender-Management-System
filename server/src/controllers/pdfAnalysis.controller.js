/**
 * PDF Analysis Controller
 * Handles PDF upload, analysis, and proposal evaluation
 * UPDATED: Multi-step evaluation with minimal payload
 */
import { PDFAnalysisService } from '../services/pdfAnalysis.service.js';
import { MultiStepEvaluationService } from '../services/multiStepEvaluation.service.js';

export const PDFAnalysisController = {
  /**
   * Upload and analyze a PDF tender document
   * POST /api/pdf/analyze
   */
  async analyzePDF(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded. Please upload a PDF file.',
        });
      }

      // Validate file type
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({
          success: false,
          error: 'Invalid file type. Only PDF files are accepted.',
        });
      }

      // Validate file size (max 15MB)
      if (req.file.size > 15 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'File too large. Maximum size is 15MB.',
        });
      }

      console.log(`[PDF Analysis] Processing: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)}KB)`);

      // Analyze the PDF
      const analysis = await PDFAnalysisService.analyzeUploadedPDF(
        req.file.buffer,
        req.file.originalname
      );

      if (!analysis.success) {
        return res.status(422).json({
          success: false,
          error: analysis.error || 'Failed to analyze PDF',
          stage: analysis.stage,
        });
      }

      console.log(`[PDF Analysis] Complete: ${analysis.parsed.sections.length} sections, ${analysis.parsed.stats.totalWords} words`);

      return res.json({
        success: true,
        data: analysis,
      });
    } catch (err) {
      console.error('[PDF Analysis] Error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal server error during PDF analysis',
      });
    }
  },

  /**
   * Evaluate a proposal against tender requirements
   * POST /api/pdf/evaluate
   * UPDATED: Accepts minimal payload {sessionId, proposal: {sections}}
   */
  async evaluateProposal(req, res) {
    try {
      const { sessionId, proposal, tenderId } = req.body;

      // Validate sessionId (required for backend-driven evaluation)
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required for evaluation.',
        });
      }

      // Validate minimal proposal data
      if (!proposal || !proposal.sections || !Array.isArray(proposal.sections)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid proposal data. Expected sections array.',
        });
      }

      // Check payload size (should be minimal now)
      const payloadSize = JSON.stringify(req.body).length;
      console.log(`[Proposal Evaluation] Payload size: ${(payloadSize / 1024).toFixed(1)}KB`);

      if (payloadSize > 500000) { // 500KB warning threshold
        console.warn(`[Proposal Evaluation] Large payload detected: ${(payloadSize / 1024).toFixed(1)}KB`);
      }

      console.log(`[Proposal Evaluation] Session: ${sessionId}, Sections: ${proposal.sections.length}`);

      // Use multi-step evaluation service
      const evaluation = await MultiStepEvaluationService.evaluateProposal(
        sessionId,
        proposal,
        tenderId
      );

      return res.json({
        success: true,
        data: evaluation,
      });
    } catch (err) {
      console.error('[Proposal Evaluation] Error:', err);
      
      // Check for specific error types
      if (err.message?.includes('token limit')) {
        return res.status(422).json({
          success: false,
          error: 'Content too large for evaluation. Please reduce proposal size.',
        });
      }

      return res.status(500).json({
        success: false,
        error: err.message || 'Internal server error during evaluation',
      });
    }
  },

  /**
   * Re-generate a specific proposal section
   * POST /api/pdf/regenerate-section
   */
  async regenerateSection(req, res) {
    try {
      const { sectionId, sectionTitle, tenderContext, currentContent, instructions } = req.body;

      if (!sectionId || !sectionTitle) {
        return res.status(400).json({
          success: false,
          error: 'Section ID and title are required.',
        });
      }

      // Use GROQ to regenerate the section
      const systemPrompt = `You are an expert proposal writer for government tenders. Regenerate the specified proposal section based on the user's instructions.

Write professional, detailed content suitable for a government tender proposal. Use placeholders like [BIDDER_NAME], [COMPANY_INFO] where specific bidder information is needed.`;

      const userPrompt = `Regenerate this proposal section:

SECTION: ${sectionTitle}

TENDER CONTEXT: ${tenderContext || 'Government tender'}

CURRENT CONTENT:
${currentContent || 'Empty'}

USER INSTRUCTIONS: ${instructions || 'Improve and make more detailed'}

Write the improved section content directly (no JSON, just the content).`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          temperature: 0.4,
          max_tokens: 2000,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate section');
      }

      const data = await response.json();
      const newContent = data?.choices?.[0]?.message?.content?.trim() || currentContent;

      return res.json({
        success: true,
        data: {
          sectionId,
          title: sectionTitle,
          content: newContent,
          wordCount: newContent.split(/\s+/).filter(w => w).length,
          regeneratedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error('[Section Regenerate] Error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to regenerate section',
      });
    }
  },
};
