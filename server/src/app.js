import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env, loadEnv } from './config/env.js';
import { pool } from './config/db.js';

// Load environment variables
loadEnv();

// Run migrations on startup
async function runMigrations() {
  try {
    // Add missing columns to tender_section if they don't exist
    await pool.query(`
      ALTER TABLE tender_section
      ADD COLUMN IF NOT EXISTS content TEXT,
      ADD COLUMN IF NOT EXISTS section_key VARCHAR(100),
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);
    console.log('[DB] Migration: Added missing columns to tender_section');
  } catch (err) {
    console.error('[DB] Migration error:', err.message);
  }
}

// Run migrations
runMigrations();

// Routes
import authRoutes from './routes/auth.routes.js';
import tenderRoutes from './routes/tender.routes.js';
import aiRoutes from './routes/ai.routes.js';
import proposalRoutes from './routes/proposal.routes.js';
import evaluationRoutes from './routes/evaluation.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import bidderRoutes from './routes/bidder.routes.js';
import pdfAnalysisRoutes from './routes/pdfAnalysis.routes.js';
import uploadedTenderRoutes from './routes/uploadedTender.routes.js';
import collaborationRoutes from './routes/collaboration.routes.js';
import reviewerRoutes from './routes/reviewer.routes.js'; // Assister routes
import insightsRoutes from './routes/insights.routes.js';

// Services that need initialization
import { AuditLogService } from './services/auditLog.service.js';

// Error handler
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

const allowedOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser tools
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: env.CORS_ALLOW_CREDENTIALS === 'true',
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
// Increase JSON body size limit to accommodate analyzed sections payloads
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/bidder', bidderRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/pdf', pdfAnalysisRoutes);
app.use('/api/uploaded-tender', uploadedTenderRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/assister', reviewerRoutes); // Assister routes (reuses reviewer route handlers)
app.use('/api/insights', insightsRoutes);

// Initialize audit log table on startup
AuditLogService.initializeTable().catch(err => {
  console.error('[App] Failed to initialize audit log table:', err.message);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use(errorHandler);

export default app;
