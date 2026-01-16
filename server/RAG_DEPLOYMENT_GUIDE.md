# RAG System - Complete Migration & Integration Guide

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Installation Steps](#installation-steps)
3. [Configuration](#configuration)
4. [Database Setup](#database-setup)
5. [Service Dependencies](#service-dependencies)
6. [Testing & Validation](#testing--validation)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

Before deploying the RAG system, ensure you have:

### Infrastructure
- [ ] Node.js 18+ installed
- [ ] PostgreSQL database (Supabase) with pgvector extension
- [ ] Groq API account with active API key
- [ ] (Optional) Ollama installed for local embeddings
- [ ] 2GB+ disk space for embeddings and session data

### Credentials
- [ ] Supabase `DATABASE_URL`
- [ ] Groq `API_KEY`
- [ ] Admin authentication credentials
- [ ] JWT secret for session tokens

### Files
- [ ] 5 reference PDFs for global ingestion prepared
- [ ] Node.js dependencies cached (for faster installation)

---

## Installation Steps

### 1. Install Server Dependencies

```bash
cd server

# Install base dependencies
npm install

# Install RAG-specific packages
npm install pdf-parse node-fetch

# Verify installation
npm list pdf-parse node-fetch
```

**Expected Output:**
```
├── node-fetch@3.x.x
└── pdf-parse@1.x.x
```

### 2. Create Directory Structure

```bash
# From server root directory
mkdir -p data/global_pdfs
mkdir -p data/sessions
mkdir -p logs

# Verify
ls -la data/
# drwxr-xr-x  global_pdfs
# drwxr-xr-x  sessions
# drwxr-xr-x  logs
```

### 3. Copy Reference PDFs

```bash
# Place your 5 reference PDFs in global_pdfs
cp /source/path/reference_*.pdf server/data/global_pdfs/

# Verify
ls -la server/data/global_pdfs/
# Files should be present
```

---

## Configuration

### Environment Variables

Create or update `.env` file in the server directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Groq API
GROQ_API_KEY=gsk_...your_api_key...

# Ollama (optional)
OLLAMA_URL=http://localhost:11434

# RAG Configuration
SESSION_TIMEOUT=86400000           # 24 hours in milliseconds
CLEANUP_INTERVAL=3600000           # 1 hour in milliseconds
MAX_CHUNK_SIZE=500                 # Tokens per chunk
CHUNK_OVERLAP=50                   # Token overlap
TOP_K_RETRIEVAL=10                 # Number of chunks to retrieve

# Optional
LOG_LEVEL=info                     # debug, info, warn, error
ENABLE_RAG_LOGGING=true
```

### Verify Configuration

```bash
# Test environment setup
node -e "
import { env, loadEnv } from './src/config/env.js';
loadEnv();
console.log({
  database: !!process.env.DATABASE_URL,
  groq: !!process.env.GROQ_API_KEY,
  ollama: process.env.OLLAMA_URL || 'Not configured (will use mock)'
});
"
```

---

## Database Setup

### 1. Enable pgvector Extension

```sql
-- Run this in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 2. Create RAG Embeddings Table

The table is created automatically on server startup, but you can create it manually:

```sql
CREATE TABLE IF NOT EXISTS rag_embeddings (
  id BIGSERIAL PRIMARY KEY,
  embedding vector(768),
  text TEXT NOT NULL,
  scope VARCHAR(50) NOT NULL DEFAULT 'session',
  source_pdf VARCHAR(255) NOT NULL,
  section VARCHAR(255),
  page_no INTEGER,
  session_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_scope CHECK (scope IN ('global', 'session'))
);

-- Create indexes
CREATE INDEX idx_rag_scope ON rag_embeddings(scope);
CREATE INDEX idx_rag_session ON rag_embeddings(session_id);
CREATE INDEX idx_rag_source ON rag_embeddings(source_pdf);
CREATE INDEX idx_rag_created ON rag_embeddings(created_at);

-- Create vector index (HNSW if available, otherwise IVFFLAT)
CREATE INDEX idx_rag_embedding ON rag_embeddings 
USING hnsw (embedding vector_cosine_ops);
```

### 3. Verify Table Creation

```bash
# Test with node
node -e "
import { pool } from './src/config/db.js';
const result = await pool.query(
  'SELECT * FROM rag_embeddings LIMIT 0'
);
console.log('✓ rag_embeddings table exists');
"
```

---

## Service Dependencies

### 1. Ollama Setup (Recommended for Production)

```bash
# Download Ollama
# macOS/Linux/Windows: https://ollama.ai

# Pull embedding model
ollama pull nomic-embed-text

# Start Ollama in background
ollama serve &

# Test connection
curl http://localhost:11434/api/tags

# Expected response:
# { "models": [{ "name": "nomic-embed-text:latest", ... }] }
```

**System Requirements:**
- 5GB+ disk space
- 4GB+ RAM
- Internet connection for first download

### 2. Groq API Setup

```bash
# 1. Go to https://console.groq.com
# 2. Create API key
# 3. Add to .env:
GROQ_API_KEY=gsk_...

# Test connection
curl -X POST https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mixtral-8x7b-32768",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 10
  }'
```

---

## Testing & Validation

### 1. Run Setup Script

```bash
node setup-rag-system.js

# Expected output:
# ✓ Node.js version: v18.x.x
# ✓ pdf-parse installed
# ✓ Created: data/global_pdfs
# ✓ DATABASE_URL set
# ✓ Connected to PostgreSQL
# ✓ Groq API is responding
```

### 2. Run Test Suite

```bash
node src/db/test-rag-system.js

# Expected output:
# ✓ Database Connection
# ✓ RAG Embeddings Table
# ✓ Ollama Embeddings Service
# ✓ Groq API Connection
# ✓ PDF Extraction
# ✓ Text Chunking
# ✓ Embedding Service
```

### 3. Test Individual Components

```javascript
// Test embeddings
import { generateEmbedding } from './src/services/rag/embedding.service.js';
const emb = await generateEmbedding('test text');
console.log('Embedding dimension:', emb.length); // Should be 768
```

### 4. Test API Endpoints

```bash
# After server is running

# 1. Get stats
curl http://localhost:5175/api/rag/stats \
  -H "Authorization: Bearer TOKEN"

# 2. Ingest global PDFs (one-time)
curl -X POST http://localhost:5175/api/rag/ingest-global \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 3. Test analysis
curl -X POST http://localhost:5175/api/rag/analyze \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the key requirements?",
    "session_id": "test-session-1",
    "tender_id": "tender-1"
  }'
```

---

## Deployment

### 1. Production Environment Setup

```bash
# Set production environment
export NODE_ENV=production

# Increase worker threads for Ollama
export OMP_NUM_THREADS=4

# Set resource limits
ulimit -n 65536  # File descriptors
```

### 2. Systemd Service (Linux)

Create `/etc/systemd/system/tender-rag.service`:

```ini
[Unit]
Description=Tender Management RAG Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/app/tender-management-system/server
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

Environment=NODE_ENV=production
Environment=DATABASE_URL=...
Environment=GROQ_API_KEY=...

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable tender-rag
sudo systemctl start tender-rag

# Monitor
sudo journalctl -u tender-rag -f
```

### 3. Docker Deployment (Optional)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Expose port
EXPOSE 5175

# Start server
CMD ["node", "src/server.js"]
```

```bash
# Build and run
docker build -t tender-rag .
docker run -e DATABASE_URL=... -e GROQ_API_KEY=... -p 5175:5175 tender-rag
```

### 4. Deploy Global PDFs

```bash
# One-time setup (after deployment)
curl -X POST https://api.your-domain.com/api/rag/ingest-global \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Verify ingestion
curl https://api.your-domain.com/api/rag/stats \
  -H "Authorization: Bearer TOKEN"
```

---

## Troubleshooting

### Issue 1: "Cannot find module 'pdf-parse'"

```bash
# Solution
npm install pdf-parse

# Or reinstall all
rm -rf node_modules package-lock.json
npm install
```

### Issue 2: "pgvector extension not found"

```sql
-- Solution (run in Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- If error about superuser privileges:
-- Contact Supabase support to enable pgvector
```

### Issue 3: "GROQ_API_KEY not found"

```bash
# Solution
# 1. Verify .env exists
cat .env | grep GROQ

# 2. Verify format
GROQ_API_KEY=gsk_... (no quotes)

# 3. Reload environment
source .env
```

### Issue 4: Ollama connection timeout

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve

# System will fall back to mock embeddings if unavailable
# (but with reduced performance)
```

### Issue 5: Session cleanup not working

```javascript
// Check cleanup service logs
import { listActiveSessions } from './src/services/rag/cleanup.service.js';
const sessions = await listActiveSessions();
console.log('Active sessions:', sessions);

// Manually trigger cleanup
import { cleanupExpiredSessions } from './src/services/rag/cleanup.service.js';
await cleanupExpiredSessions();
```

---

## Monitoring & Maintenance

### 1. Database Monitoring

```sql
-- Check embeddings count
SELECT 
  scope,
  COUNT(*) as count,
  COUNT(DISTINCT session_id) as sessions,
  COUNT(DISTINCT source_pdf) as documents
FROM rag_embeddings
GROUP BY scope;

-- Check disk usage
SELECT pg_size_pretty(pg_total_relation_size('rag_embeddings'));

-- View recent embeddings
SELECT id, scope, source_pdf, created_at
FROM rag_embeddings
ORDER BY created_at DESC
LIMIT 10;
```

### 2. Performance Metrics

```bash
# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5175/api/rag/stats

# Create curl-format.txt:
cat > curl-format.txt << 'EOF'
time_namelookup: %{time_namelookup}
time_connect: %{time_connect}
time_appconnect: %{time_appconnect}
time_pretransfer: %{time_pretransfer}
time_redirect: %{time_redirect}
time_starttransfer: %{time_starttransfer}
time_total: %{time_total}
EOF
```

### 3. Log Monitoring

```bash
# Monitor application logs
tail -f logs/rag-system.log

# Filter for errors
grep ERROR logs/rag-system.log

# Filter for specific session
grep "session-id" logs/rag-system.log
```

### 4. Maintenance Tasks

```bash
# Weekly: Cleanup stale sessions
node -e "
import { cleanupExpiredSessions } from './src/services/rag/cleanup.service.js';
await cleanupExpiredSessions();
"

# Monthly: Database maintenance
# In Supabase: VACUUM ANALYZE rag_embeddings;

# As needed: Rebuild indexes
# In Supabase: REINDEX TABLE rag_embeddings;
```

---

## Success Criteria

You have successfully deployed the RAG system when:

✅ All setup script checks pass
✅ Database table created with 768-dimensional vectors
✅ Groq API connectivity verified
✅ Global PDFs ingested (10,000+ embeddings)
✅ Session-based analysis working
✅ Automatic cleanup running hourly
✅ API response times < 2 seconds
✅ No errors in application logs

---

## Next Steps

1. Deploy frontend UI components for RAG features
2. Integrate with existing tender analysis workflows
3. Set up monitoring and alerting
4. Create admin dashboard for RAG management
5. Document API integration for bidders
6. Schedule regular training sessions for users

---

## Support & Resources

- **Setup Issues**: See [RAG_SETUP_GUIDE.md](./RAG_SETUP_GUIDE.md)
- **API Documentation**: See [server/src/routes/rag.routes.js](./src/routes/rag.routes.js)
- **Architecture Details**: See RAG service modules in [server/src/services/rag/](./src/services/rag/)
- **Testing**: Run `node setup-rag-system.js` for automated validation

