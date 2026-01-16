# RAG System - Quick Reference & Commands

## 🚀 Getting Started (5 Minutes)

### Step 1: Install Dependencies
```bash
cd server
npm install pdf-parse node-fetch
```

### Step 2: Create Data Directories
```bash
mkdir -p data/global_pdfs data/sessions
```

### Step 3: Set Environment Variables
```bash
# Add to .env (in server directory)
DATABASE_URL=your_supabase_connection_string
GROQ_API_KEY=your_groq_api_key
```

### Step 4: Start Server
```bash
npm run dev
# Server will auto-create rag_embeddings table
```

### Step 5: Validate Setup
```bash
node setup-rag-system.js
```

---

## 📋 Command Reference

### Database Operations

#### Create rag_embeddings Table Manually
```bash
node -e "
import('./src/db/migrations/009-rag-embeddings.js').then(m => 
  m.migrateRagEmbeddings()
)
"
```

#### Check Embeddings Count
```bash
psql -d \$DATABASE_URL -c "SELECT COUNT(*) FROM rag_embeddings;"
```

#### View Recent Embeddings
```bash
psql -d \$DATABASE_URL -c "
SELECT id, scope, source_pdf, created_at 
FROM rag_embeddings 
ORDER BY created_at DESC LIMIT 10;
"
```

#### Drop Table (Development Only)
```bash
node -e "
import('./src/db/migrations/009-rag-embeddings.js').then(m => 
  m.dropRagEmbeddings()
)
"
```

---

### Testing

#### Run All Tests
```bash
node src/db/test-rag-system.js
```

#### Test Individual Components
```javascript
// Test embeddings
import { generateEmbedding } from './src/services/rag/embedding.service.js';
const emb = await generateEmbedding('test');
console.log('Dimension:', emb.length);

// Test chunking
import { chunkText } from './src/services/rag/text-chunker.js';
const chunks = chunkText('Sample text here...');
console.log('Chunks:', chunks.length);

// Test PDF extraction
import { extractPdfText } from './src/services/rag/pdf-extractor.js';
const text = await extractPdfText('path/to/file.pdf');
console.log('Text length:', text.length);
```

---

### API Endpoints

#### Base URL
```
http://localhost:5175/api/rag
```

#### Authorization
```bash
# All endpoints require Bearer token in header
-H "Authorization: Bearer YOUR_TOKEN"
```

#### 1. Analyze Tender
```bash
curl -X POST http://localhost:5175/api/rag/analyze \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the requirements?",
    "session_id": "session-123",
    "tender_id": "tender-456"
  }'
```

**Parameters:**
- `query` (required): User question
- `session_id` (required): Session identifier
- `tender_id` (optional): Tender document ID

**Response:**
```json
{
  "analysis": "Based on...",
  "citations": {
    "tender_chunks": 8,
    "reference_chunks": 2
  },
  "sources": {
    "tender": ["file.pdf"],
    "reference": ["standard.pdf"]
  }
}
```

---

#### 2. Draft Proposal
```bash
curl -X POST http://localhost:5175/api/rag/draft-proposal \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Draft technical section",
    "session_id": "session-123",
    "proposal_id": "prop-789",
    "section_name": "Technical Approach",
    "company_info": "We are..."
  }'
```

**Parameters:**
- `query` (required): Draft request
- `session_id` (required): Session ID
- `proposal_id` (optional): Proposal ID
- `section_name` (optional): Section name
- `company_info` (optional): Company information

**Response:**
```json
{
  "draft": "Our approach...",
  "suggestions": ["Add detail on...", "Consider..."],
  "alignment_score": 0.87
}
```

---

#### 3. Evaluate Proposal
```bash
curl -X POST http://localhost:5175/api/rag/evaluate-proposal \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proposal_text": "Our company...",
    "session_id": "session-123",
    "tender_id": "tender-456",
    "evaluation_criteria": "Compliance, Cost, Timeline"
  }'
```

**Parameters:**
- `proposal_text` (required): Full proposal text
- `session_id` (required): Session ID
- `tender_id` (required): Tender ID
- `evaluation_criteria` (optional): Criteria string

**Response:**
```json
{
  "evaluation": {
    "compliance_score": 0.92,
    "cost_score": 0.78
  },
  "overall_score": 0.86,
  "strengths": ["..."],
  "gaps": ["..."]
}
```

---

#### 4. Assess Risks
```bash
curl -X POST http://localhost:5175/api/rag/assess-risks \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session-123",
    "tender_id": "tender-456",
    "tender_summary": "Build IoT system..."
  }'
```

**Parameters:**
- `session_id` (required): Session ID
- `tender_id` (required): Tender ID
- `tender_summary` (required): Tender description

**Response:**
```json
{
  "risks": [
    {
      "risk": "Timeline compression",
      "severity": "high",
      "probability": 0.6,
      "mitigation": "Allocate resources..."
    }
  ]
}
```

---

#### 5. Ingest Session PDFs
```bash
curl -X POST http://localhost:5175/api/rag/ingest-session \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session-123",
    "pdf_paths": [
      "data/uploads/tender.pdf",
      "data/uploads/annexure.pdf"
    ]
  }'
```

**Parameters:**
- `session_id` (required): Session ID
- `pdf_paths` (required): Array of file paths

**Response:**
```json
{
  "success": true,
  "total_embeddings": 45,
  "chunks": 45,
  "duration_ms": 1234
}
```

---

#### 6. Ingest Global PDFs (Admin Only)
```bash
curl -X POST http://localhost:5175/api/rag/ingest-global \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Parameters:** None (reads from `data/global_pdfs/`)

**Response:**
```json
{
  "success": true,
  "total_embeddings": 250,
  "documents": 5,
  "duration_ms": 5678
}
```

---

#### 7. Get System Statistics
```bash
curl http://localhost:5175/api/rag/stats \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "total_embeddings": 2500,
  "active_sessions": 12,
  "global_embeddings": 250,
  "session_embeddings": 2250,
  "source_documents": 17,
  "database_size_mb": 45.2
}
```

---

#### 8. Get Session Statistics
```bash
curl http://localhost:5175/api/rag/session/session-123/stats \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "session_id": "session-123",
  "embeddings": 45,
  "documents": 2,
  "created_at": "2024-01-15T10:00:00Z",
  "last_accessed": "2024-01-15T10:30:00Z",
  "storage_size_kb": 150,
  "expires_at": "2024-01-16T10:00:00Z"
}
```

---

#### 9. Delete Session
```bash
curl -X DELETE http://localhost:5175/api/rag/session/session-123 \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "success": true,
  "deleted_embeddings": 45,
  "deleted_pdfs": 2
}
```

---

#### 10. Manual Cleanup (Admin Only)
```bash
curl -X POST http://localhost:5175/api/rag/cleanup \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "sessions_cleaned": 3,
  "embeddings_deleted": 120,
  "pdfs_deleted": 6
}
```

---

## 🔧 Configuration Examples

### Development Configuration
```bash
# .env
DATABASE_URL=postgresql://localhost/tender_dev
GROQ_API_KEY=gsk_test_key
OLLAMA_URL=http://localhost:11434
LOG_LEVEL=debug
SESSION_TIMEOUT=3600000        # 1 hour for testing
CLEANUP_INTERVAL=60000         # Check every 1 minute
```

### Production Configuration
```bash
# .env
DATABASE_URL=postgresql://prod-user:password@prod-db.com/tender_prod
GROQ_API_KEY=gsk_prod_key_here
OLLAMA_URL=http://ollama-server:11434
LOG_LEVEL=info
SESSION_TIMEOUT=86400000       # 24 hours
CLEANUP_INTERVAL=3600000       # 1 hour
MAX_CHUNK_SIZE=500
CHUNK_OVERLAP=50
TOP_K_RETRIEVAL=10
SESSION_WEIGHT=0.7
GLOBAL_WEIGHT=0.3
```

---

## 📝 Code Examples

### JavaScript/Node.js

#### Ingest PDFs Programmatically
```javascript
import { ingestSessionPdfs } from './src/services/rag/session-ingestion.js';

const sessionId = 'user-session-123';
const pdfPaths = [
  './data/uploads/tender-request.pdf',
  './data/uploads/appendix-a.pdf'
];

const result = await ingestSessionPdfs(sessionId, pdfPaths);
console.log(`Ingested ${result.total_embeddings} embeddings`);
```

#### Retrieve Similar Chunks
```javascript
import { retrieveSimilar } from './src/services/rag/embedding.service.js';

const query = 'eligibility criteria';
const sessionId = 'user-session-123';

const chunks = await retrieveSimilar(query, sessionId, 5);
chunks.forEach(chunk => {
  console.log(chunk.text);
  console.log('Similarity:', chunk.similarity);
});
```

#### Manual Session Cleanup
```javascript
import { cleanupExpiredSessions } from './src/services/rag/cleanup.service.js';

// Cleanup sessions older than 24 hours
await cleanupExpiredSessions(24 * 60 * 60 * 1000);
console.log('Cleanup complete');
```

#### Get Hybrid Context
```javascript
import { hybridRetrieve } from './src/services/rag/hybrid-retrieval.js';

const query = 'budget constraints';
const context = await hybridRetrieve(query, 'session-123', 10);

console.log('Session context:', context.session);
console.log('Reference context:', context.global);
console.log('Combined:', context.combined);
```

---

### cURL Examples by Use Case

#### 1. Bidder - Analyzing a Tender
```bash
#!/bin/bash
SESSION_ID="bidder-session-$(date +%s)"
TOKEN="YOUR_BIDDER_TOKEN"

# First, ingest tender documents
curl -X POST http://localhost:5175/api/rag/ingest-session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"pdf_paths\": [\"uploads/tender.pdf\", \"uploads/requirements.pdf\"]
  }"

# Then, analyze tender
curl -X POST http://localhost:5175/api/rag/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"What are the main requirements and timelines?\",
    \"session_id\": \"$SESSION_ID\",
    \"tender_id\": \"TENDER-2024-001\"
  }"
```

#### 2. Authority - Evaluating Proposals
```bash
#!/bin/bash
SESSION_ID="eval-session-$(date +%s)"
TOKEN="YOUR_ADMIN_TOKEN"

# Setup session with tender documents
curl -X POST http://localhost:5175/api/rag/ingest-session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"pdf_paths\": [\"tenders/RFP-2024.pdf\"]
  }"

# Evaluate a proposal
curl -X POST http://localhost:5175/api/rag/evaluate-proposal \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"proposal_text\": \"Our company will deliver...\",
    \"session_id\": \"$SESSION_ID\",
    \"tender_id\": \"TENDER-2024-001\",
    \"evaluation_criteria\": \"Technical, Cost, Compliance, Schedule\"
  }"
```

#### 3. System Admin - One-Time Global Ingestion
```bash
#!/bin/bash
ADMIN_TOKEN="YOUR_ADMIN_TOKEN"

# Place 5 reference PDFs in server/data/global_pdfs/

# Ingest once
curl -X POST http://localhost:5175/api/rag/ingest-global \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Check status
curl http://localhost:5175/api/rag/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 🐛 Debugging

### Enable Verbose Logging
```bash
DEBUG=rag:* npm run dev
```

### Check Service Logs
```bash
# Watch logs in real-time
tail -f server/logs/rag-system.log

# Search for errors
grep ERROR server/logs/rag-system.log

# Count requests
grep POST server/logs/rag-system.log | wc -l
```

### Database Diagnostics
```sql
-- Check table structure
\d rag_embeddings

-- Check index status
SELECT * FROM pg_stat_user_indexes WHERE relname = 'rag_embeddings';

-- Check disk usage
SELECT pg_size_pretty(pg_total_relation_size('rag_embeddings'));

-- Check active sessions
SELECT DISTINCT session_id, COUNT(*) as embeddings 
FROM rag_embeddings 
WHERE scope = 'session'
GROUP BY session_id;
```

### Network Diagnostics
```bash
# Test Ollama
curl http://localhost:11434/api/tags

# Test Groq API
curl -X POST https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"mixtral-8x7b-32768","messages":[{"role":"user","content":"test"}],"max_tokens":10}'

# Test database
psql -h localhost -U postgres -d tender_db -c "SELECT NOW();"
```

---

## ✅ Verification Checklist

Before going to production:

- [ ] All dependencies installed (`npm install`)
- [ ] Environment variables set (`.env`)
- [ ] Data directories created (`data/global_pdfs`, `data/sessions`)
- [ ] Setup script passes (`node setup-rag-system.js`)
- [ ] Test suite passes (`node src/db/test-rag-system.js`)
- [ ] Ollama service running (`ollama serve`)
- [ ] Groq API key valid
- [ ] Database connection working
- [ ] rag_embeddings table created
- [ ] Global PDFs ingested
- [ ] API endpoints responding
- [ ] Cleanup service running
- [ ] Logs configured and working
- [ ] Monitoring alerts set up

---

## 📞 Quick Support

| Issue | Quick Fix |
|-------|-----------|
| `pdf-parse not found` | `npm install pdf-parse` |
| `Can't connect to DB` | Check `DATABASE_URL` in `.env` |
| `Groq API error` | Verify `GROQ_API_KEY` is valid and has quota |
| `Ollama timeout` | Run `ollama serve` in separate terminal |
| `Table doesn't exist` | Restart server to auto-migrate |
| `No embeddings generated` | Check if Ollama is running or enable mock mode |
| `Cleanup not working` | Check if cleanup service is scheduled (see app.js) |

---

## 📚 More Information

- **Setup Guide**: `server/RAG_SETUP_GUIDE.md`
- **Deployment Guide**: `server/RAG_DEPLOYMENT_GUIDE.md`
- **API Implementation**: `server/src/routes/rag.routes.js`
- **Service Modules**: `server/src/services/rag/`
- **Tests**: `server/src/db/test-rag-system.js`

