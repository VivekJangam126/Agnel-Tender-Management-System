/**
 * PDF Analysis Routes
 * Handles PDF upload and analysis endpoints
 */
import { Router } from 'express';
import multer from 'multer';
import { PDFAnalysisController } from '../controllers/pdfAnalysis.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Configure multer for memory storage (buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// All routes require authentication
router.use(requireAuth);

/**
 * POST /api/pdf/analyze
 * Upload and analyze a PDF tender document
 * Returns: Summary, sections, metadata, and proposal draft
 */
router.post('/analyze', upload.single('file'), PDFAnalysisController.analyzePDF);

/**
 * POST /api/pdf/evaluate
 * Evaluate a proposal against tender requirements
 * Body: { proposal: {sections: [...]}, tenderAnalysis: {...} }
 */
router.post('/evaluate', PDFAnalysisController.evaluateProposal);

/**
 * POST /api/pdf/regenerate-section
 * Regenerate a specific proposal section with AI
 * Body: { sectionId, sectionTitle, tenderContext, currentContent, instructions }
 */
router.post('/regenerate-section', PDFAnalysisController.regenerateSection);

export default router;
