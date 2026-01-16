# Hybrid RAG System - Setup & Deployment Guide

## Overview

This document explains how to set up and deploy the Hybrid RAG (Retrieval Augmented Generation) system for tender analysis using Node.js, Groq API, and open-source embeddings.

## Architecture

```
┌─────────────────────────────────────────────┐
│           Tender Analysis Platform          │
├─────────────────────────────────────────────┤
│  API Layer (Express Routes)                 │
│  ├─ /api/rag/analyze                        │
│  ├─ /api/rag/draft-proposal                 │
│  ├─ /api/rag/evaluate-proposal              │
│  └─ /api/rag/assess-risks                   │
├─────────────────────────────────────────────┤
│  RAG Engine                                 │
│  ├─ Hybrid Retrieval (Session + Global)     │
│  ├─ Prompt Building                         │
│  └─ Groq LLM Integration                    │
├─────────────────────────────────────────────┤
│  Vector DB (Supabase pgvector)              │
│  ├─ Global PDFs (Reference standards)       │
│  ├─ Session PDFs (User tender documents)    │
│  └─ Embeddings (768-dim vectors)            │
├─────────────────────────────────────────────┤
│  Embedding Service                          │
│  └─ Ollama (nomic-embed-text)               │
└─────────────────────────────────────────────┘
```

## Prerequisites

### 1. Environment Setup

```bash
# Install Node.js v18+
node --version

# Install required npm packages
cd server
npm install pdf-parse node-fetch
```

### 2. External Services

#### A. Ollama (Local Embeddings - Recommended)

```bash
# Download Ollama from https://ollama.ai
# Run with embedding model
ollama pull nomic-embed-text
ollama serve

# Test endpoint
curl -X POST http://localhost:11434/api/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"nomic-embed-text","prompt":"test"}'
```

#### B. Groq API (LLM)

1. Get API key from https://console.groq.com
2. Add to `.env`:
   ```
   GROQ_API_KEY=your_api_key_here
   ```

#### C. Supabase PostgreSQL with pgvector

The system uses your existing Supabase database. The `rag_embeddings` table is created automatically on first request.

## Folder Structure

```
server/
├── data/
│   ├── global_pdfs/              # 5 reference PDFs (one-time)
│   │   ├── tender_standards.pdf
│   │   ├── industry_best_practices.pdf
│   │   ├── compliance_checklist.pdf
│   │   ├── financial_guidelines.pdf
│   │   └── risk_management.pdf
│   └── sessions/                 # User-uploaded PDFs per session
│       ├── {session_id_1}/
│       ├── {session_id_2}/
│       └── {session_id_3}/
│
├── src/
│   ├── services/
│   │   └── rag/
│   │       ├── pdf-extractor.js           # PDF text extraction
│   │       ├── text-chunker.js            # Text chunking (300-500 tokens)
│   │       ├── embedding.service.js       # Vector embeddings
│   │       ├── global-ingestion.js        # One-time global PDF ingestion
│   │       ├── session-ingestion.js       # Per-session PDF ingestion
│   │       ├── hybrid-retrieval.js        # Hybrid retrieval logic
│   │       ├── prompt-builder.js          # RAG prompt construction
│   │       └── cleanup.service.js         # Session lifecycle management
│   │
│   └── routes/
│       └── rag.routes.js                  # API endpoints
```

## Step 1: Prepare Global Reference PDFs

Place your 5 reference PDFs in `server/data/global_pdfs/`:

```bash
mkdir -p server/data/global_pdfs
cp /path/to/reference/pdf1.pdf server/data/global_pdfs/
cp /path/to/reference/pdf2.pdf server/data/global_pdfs/
# ... etc
```

## Step 2: Initialize Global PDFs (One-Time)

Once Ollama and Groq API are configured:

```bash
# Option A: Via API endpoint (requires auth)
curl -X POST http://localhost:5175/api/rag/ingest-global \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Option B: Programmatically in code
import { ingestGlobalPdfs } from './services/rag/global-ingestion.js';
await ingestGlobalPdfs();
```

**Important**: This runs only once. Embeddings are stored permanently in the vector DB.

## Step 3: Using the RAG System

### A. Tender Analysis

```bash
curl -X POST http://localhost:5175/api/rag/analyze \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the key eligibility criteria?",
    "session_id": "abc-123-def",
    "tender_id": "tender-456"
  }'
```

Response:
```json
{
  "analysis": "Based on tender documents and industry standards...",
  "citations": {
    "tender_chunks": 8,
    "reference_chunks": 3,
    "total": 11
  },
  "sources": {
    "tender": ["RFP-2024.pdf"],
    "reference": ["tender_standards.pdf"]
  }
}
```

### B. Proposal Drafting

```bash
curl -X POST http://localhost:5175/api/rag/draft-proposal \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Draft company capabilities section",
    "session_id": "abc-123-def",
    "proposal_id": "prop-789",
    "section_name": "Company Capabilities",
    "company_info": "We are a 20-year-old IT consulting firm..."
  }'
```

### C. Proposal Evaluation (Admin)

```bash
curl -X POST http://localhost:5175/api/rag/evaluate-proposal \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proposal_text": "Our company offers...",
    "session_id": "abc-123-def",
    "tender_id": "tender-456",
    "evaluation_criteria": "Compliance, cost, timeline"
  }'
```

### D. Risk Assessment

```bash
curl -X POST http://localhost:5175/api/rag/assess-risks \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc-123-def",
    "tender_id": "tender-456",
    "tender_summary": "Build IoT infrastructure with 6-month timeline"
  }'
```

## Step 4: Session PDF Ingestion

When a user uploads tender PDFs:

```javascript
import { ingestSessionPdfs } from './services/rag/session-ingestion.js';

// In your file upload handler
const pdfPaths = ['/uploads/tender.pdf'];
const result = await ingestSessionPdfs(sessionId, pdfPaths);

console.log(result);
// { success: true, total_embeddings: 45, chunks: 45 }
```

## Configuration

### Environment Variables

```bash
# .env file
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=postgresql://...  # Your Supabase connection
```

### RAG Parameters (in code)

```javascript
// In hybrid-retrieval.js
const options = {
  topK: 10,              // Number of chunks to retrieve
  sessionWeight: 0.7,    // Priority for session documents
  globalWeight: 0.3      // Priority for reference documents
};

// In text-chunker.js
const chunks = chunkText(text, 400, 50);
// 400 = max tokens per chunk
// 50 = overlap tokens between chunks
```

## API Reference

### Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/rag/analyze` | Analyze tender | User |
| POST | `/api/rag/draft-proposal` | Draft proposal section | Bidder |
| POST | `/api/rag/evaluate-proposal` | Evaluate submission | Authority |
| POST | `/api/rag/assess-risks` | Risk assessment | User |
| POST | `/api/rag/ingest-session` | Ingest session PDFs | User |
| POST | `/api/rag/ingest-global` | Ingest global PDFs | Authority |
| GET | `/api/rag/stats` | System statistics | User |
| GET | `/api/rag/session/:id/stats` | Session statistics | User |
| DELETE | `/api/rag/session/:id` | Delete session | User |
| POST | `/api/rag/cleanup` | Manual cleanup | Authority |

## Performance Optimization

### Caching

```javascript
// Cache embeddings during a session
const cache = new Map();
cache.set(sessionId, retrievalResult);
```

### Batching

```javascript
// Process multiple PDFs in parallel
await Promise.all(pdfPaths.map(path => ingestSessionPdfs(sessionId, [path])));
```

### Indexing

```sql
-- Already created by system
CREATE INDEX idx_rag_scope ON rag_embeddings(scope);
CREATE INDEX idx_rag_session ON rag_embeddings(session_id);
CREATE INDEX idx_rag_source ON rag_embeddings(source_pdf);
```

## Cleanup & Maintenance

### Automatic Cleanup

Sessions older than 24 hours are automatically cleaned up every hour:

```javascript
// Runs automatically via scheduleSessionCleanup()
// Deletes embeddings and PDF files for expired sessions
// Never deletes global PDFs
```

### Manual Cleanup

```bash
# Via API
curl -X POST http://localhost:5175/api/rag/cleanup \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Via code
import { cleanupExpiredSessions } from './services/rag/cleanup.service.js';
await cleanupExpiredSessions(24 * 60 * 60 * 1000);
```

### View Statistics

```bash
# Global statistics
curl http://localhost:5175/api/rag/stats \
  -H "Authorization: Bearer TOKEN"

# Session statistics
curl http://localhost:5175/api/rag/session/abc-123/stats \
  -H "Authorization: Bearer TOKEN"
```

## Troubleshooting

### Issue: "Cannot find package 'pdf-parse'"

```bash
npm install pdf-parse
```

### Issue: Ollama connection refused

```bash
# Ensure Ollama is running
ollama serve

# Check connection
curl http://localhost:11434/api/tags
```

### Issue: GROQ_API_KEY not configured

```bash
# Add to .env
GROQ_API_KEY=your_actual_key

# Restart server
npm run dev
```

### Issue: Embeddings table not found

```javascript
// Table is auto-created, but if needed:
await pool.query(`CREATE TABLE IF NOT EXISTS rag_embeddings (...)`);
```

## Production Deployment

### Before Going Live

1. ✅ Test with real PDFs
2. ✅ Verify Ollama stability (dedicated server)
3. ✅ Load test Groq API (rate limits)
4. ✅ Monitor database growth
5. ✅ Set up automated backups

### Deployment Checklist

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
# Update .env with production values

# 3. Verify connections
npm run test:rag

# 4. Initialize global PDFs (one-time)
node -e "import('./services/rag/global-ingestion.js').then(m => m.ingestGlobalPdfs())"

# 5. Start server
npm start
```

### Monitoring

Monitor these metrics:

- Embedding generation time (should be <2s per chunk)
- Retrieval latency (should be <500ms)
- LLM response time (varies by model)
- Database storage growth
- Session cleanup success

## Next Steps

1. Place your reference PDFs in `server/data/global_pdfs/`
2. Start Ollama service
3. Configure Groq API key
4. Run initial ingestion via `/api/rag/ingest-global`
5. Test with `/api/rag/analyze` endpoint

## Support

For issues or questions about the RAG system, refer to:
- [Ollama Documentation](https://github.com/ollama/ollama)
- [Groq API Reference](https://console.groq.com/docs)
- [Supabase pgvector](https://supabase.com/docs/guides/ai/vector-indexes)
