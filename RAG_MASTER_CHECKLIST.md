# RAG System Implementation - Master Setup & Deployment Checklist

## 🎯 Complete Implementation Status

### ✅ What's Been Implemented

#### Core RAG Services (9 Modules - Complete)
- [x] **pdf-extractor.js** - PDF text extraction with cleaning
- [x] **text-chunker.js** - Text chunking with overlap (300-500 tokens, 50 token overlap)
- [x] **embedding.service.js** - Embedding generation and storage with pgvector
- [x] **global-ingestion.js** - One-time global PDF ingestion
- [x] **session-ingestion.js** - Per-session PDF ingestion
- [x] **hybrid-retrieval.js** - Hybrid context retrieval (session + global)
- [x] **prompt-builder.js** - Context-aware prompt construction (4 use cases)
- [x] **cleanup.service.js** - Session lifecycle and automatic cleanup
- [x] **rag.routes.js** - 10 REST API endpoints

#### Database Layer
- [x] **009-rag-embeddings.js** - Migration for rag_embeddings table with pgvector
- [x] **app.js** - Integration of RAG routes and cleanup scheduling
- [x] pgvector extension support (Supabase)

#### Documentation
- [x] **RAG_SETUP_GUIDE.md** - Comprehensive setup instructions
- [x] **RAG_DEPLOYMENT_GUIDE.md** - Production deployment procedures
- [x] **RAG_IMPLEMENTATION_SUMMARY.md** - Complete system overview
- [x] **RAG_QUICK_REFERENCE.md** - Command reference and examples
- [x] **DEPENDENCIES_INSTALLATION_GUIDE.md** - Package installation guide
- [x] **This checklist** - Master setup guide

#### Testing & Validation
- [x] **setup-rag-system.js** - Automated setup validation script
- [x] **test-rag-system.js** - Comprehensive test suite (8 tests)

---

## 📋 Pre-Deployment Checklist

### Phase 1: System Preparation (30 minutes)

#### 1.1 Node.js & Environment
- [ ] **Node.js v18+ installed**
  ```bash
  node --version  # Should show v18.0.0 or higher
  npm --version   # Should show v9.0.0 or higher
  ```

- [ ] **Server directory accessible**
  ```bash
  cd server
  pwd  # Verify correct location
  ```

- [ ] **Git repository initialized** (optional but recommended)
  ```bash
  git init
  git add .
  git commit -m "Add RAG system implementation"
  ```

#### 1.2 Environment Variables
- [ ] **.env file created in server directory**
  ```bash
  cat > .env << 'EOF'
  DATABASE_URL=postgresql://user:password@host:port/db
  GROQ_API_KEY=gsk_your_key_here
  OLLAMA_URL=http://localhost:11434
  LOG_LEVEL=info
  EOF
  ```

- [ ] **Environment variables verified**
  ```bash
  source .env
  echo $DATABASE_URL
  echo $GROQ_API_KEY
  ```

#### 1.3 Directory Structure
- [ ] **Create data directories**
  ```bash
  mkdir -p data/global_pdfs
  mkdir -p data/sessions
  mkdir -p logs
  ls -la data/
  ```

- [ ] **.gitignore updated** (optional)
  ```bash
  echo "data/sessions/*" >> .gitignore
  echo "logs/*" >> .gitignore
  echo ".env" >> .gitignore
  ```

---

### Phase 2: Dependency Installation (10 minutes)

#### 2.1 Install NPM Packages
- [ ] **Check existing packages**
  ```bash
  npm list --depth=0
  ```

- [ ] **Install RAG dependencies**
  ```bash
  npm install pdf-parse node-fetch
  ```

- [ ] **Verify installation**
  ```bash
  npm list pdf-parse node-fetch
  ```

- [ ] **Update package-lock.json**
  ```bash
  git add package-lock.json
  ```

#### 2.2 Dependency Verification
- [ ] **Test imports**
  ```bash
  node -e "import('pdf-parse').then(() => console.log('✓ pdf-parse OK'))"
  node -e "import('node-fetch').then(() => console.log('✓ node-fetch OK'))"
  ```

- [ ] **Check for conflicts**
  ```bash
  npm audit
  ```

---

### Phase 3: External Services Setup (30-60 minutes)

#### 3.1 Ollama Setup (Optional but Recommended)
- [ ] **Download Ollama**
  - Go to https://ollama.ai
  - Download for your OS (Windows, macOS, Linux)
  - Install following instructions

- [ ] **Pull embedding model**
  ```bash
  ollama pull nomic-embed-text
  ```

- [ ] **Start Ollama service**
  ```bash
  ollama serve
  # In new terminal, verify:
  curl http://localhost:11434/api/tags
  ```

- [ ] **Test embedding generation**
  ```bash
  curl -X POST http://localhost:11434/api/embeddings \
    -H "Content-Type: application/json" \
    -d '{"model":"nomic-embed-text","prompt":"test"}'
  ```

#### 3.2 Groq API Setup
- [ ] **Get Groq API key**
  - Go to https://console.groq.com
  - Sign up / Log in
  - Generate API key
  - Copy to `.env` as `GROQ_API_KEY`

- [ ] **Verify API key format**
  ```bash
  # Should start with "gsk_"
  echo $GROQ_API_KEY | head -c 5
  ```

- [ ] **Test API connectivity**
  ```bash
  curl -X POST https://api.groq.com/openai/v1/chat/completions \
    -H "Authorization: Bearer $GROQ_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "model": "mixtral-8x7b-32768",
      "messages": [{"role": "user", "content": "test"}],
      "max_tokens": 10
    }'
  ```

#### 3.3 Database Setup (Supabase)
- [ ] **pgvector extension enabled**
  - Go to Supabase console
  - SQL Editor → Run `CREATE EXTENSION IF NOT EXISTS vector;`

- [ ] **Connection verified**
  ```bash
  psql -d $DATABASE_URL -c "SELECT NOW();"
  ```

- [ ] **Database accessible from Node.js**
  ```bash
  node -e "
  import('./src/config/db.js').then(async m => {
    const result = await m.pool.query('SELECT NOW()');
    console.log('✓ DB connected');
  })
  "
  ```

---

### Phase 4: Validation & Testing (20 minutes)

#### 4.1 Run Setup Script
- [ ] **Execute setup validation**
  ```bash
  node setup-rag-system.js
  ```

- [ ] **All checks should pass**
  ```
  ✓ Node.js version: v18.x.x
  ✓ pdf-parse installed
  ✓ node-fetch installed
  ✓ Created: data/global_pdfs
  ✓ Created: data/sessions
  ✓ Created: logs
  ✓ DATABASE_URL set
  ✓ GROQ_API_KEY set
  ✓ Connected to PostgreSQL
  ✓ pgvector extension available
  ✓ Ollama is running
  ✓ Groq API is responding
  ```

#### 4.2 Run Test Suite
- [ ] **Execute comprehensive tests**
  ```bash
  node src/db/test-rag-system.js
  ```

- [ ] **All 8 tests should pass**
  ```
  ✓ PASS - database
  ✓ PASS - ragTable
  ✓ PASS - ollama
  ✓ PASS - groq
  ✓ PASS - endpoints
  ✓ PASS - extraction
  ✓ PASS - chunking
  ✓ PASS - embedding
  ```

#### 4.3 Database Migration
- [ ] **rag_embeddings table created**
  ```bash
  psql -d $DATABASE_URL -c "SELECT * FROM rag_embeddings LIMIT 0;"
  # Should succeed with "relation rag_embeddings created"
  ```

- [ ] **Verify table structure**
  ```bash
  psql -d $DATABASE_URL -c "\d rag_embeddings"
  # Should show columns: id, embedding, text, scope, session_id, etc.
  ```

---

### Phase 5: Server Startup & Initial Ingestion (15 minutes)

#### 5.1 Start Server
- [ ] **Launch development server**
  ```bash
  npm run dev
  # Should show:
  # [DB] Migration: Added missing columns to tender_section
  # ✓ rag_embeddings table created successfully
  # Server running on port 5175
  ```

- [ ] **Server logs show no errors**
  ```
  Check for messages like:
  - ✓ rag_embeddings table created successfully with indexes
  - ✓ RAG routes mounted at /api/rag
  - ✓ Session cleanup scheduled
  ```

#### 5.2 Prepare Reference PDFs
- [ ] **Collect 5 reference PDFs**
  - Tender industry standards
  - Best practices guide
  - Compliance checklist
  - Financial guidelines
  - Risk management framework

- [ ] **Copy to global_pdfs directory**
  ```bash
  cp /source/path/reference_*.pdf server/data/global_pdfs/
  ls -la server/data/global_pdfs/
  # Should show 5 PDF files
  ```

#### 5.3 Ingest Global PDFs (One-Time)
- [ ] **Get admin authentication token**
  - Request from authentication system
  - Or generate test token

- [ ] **Trigger global ingestion**
  ```bash
  curl -X POST http://localhost:5175/api/rag/ingest-global \
    -H "Authorization: Bearer ADMIN_TOKEN" \
    -H "Content-Type: application/json"
  ```

- [ ] **Verify ingestion success**
  ```bash
  # Response should include:
  # "success": true,
  # "total_embeddings": 200+,
  # "documents": 5
  
  # Check database:
  psql -d $DATABASE_URL -c "
    SELECT COUNT(*) as total, scope
    FROM rag_embeddings
    GROUP BY scope;
  "
  # Should show "global" scope with 200+ embeddings
  ```

---

### Phase 6: API Testing (15 minutes)

#### 6.1 System Statistics Endpoint
- [ ] **Get overall statistics**
  ```bash
  curl http://localhost:5175/api/rag/stats \
    -H "Authorization: Bearer TOKEN"
  ```

- [ ] **Expected response includes**
  - total_embeddings (should be 200+)
  - active_sessions (0 initially)
  - global_embeddings (200+)
  - session_embeddings (0 initially)

#### 6.2 Session Analysis Endpoint
- [ ] **Create test session**
  ```bash
  SESSION_ID="test-$(date +%s)"
  
  curl -X POST http://localhost:5175/api/rag/ingest-session \
    -H "Authorization: Bearer USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"session_id\": \"$SESSION_ID\", \"pdf_paths\": [\"path/to/test.pdf\"]}"
  ```

- [ ] **Test analysis endpoint**
  ```bash
  curl -X POST http://localhost:5175/api/rag/analyze \
    -H "Authorization: Bearer USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"query\": \"What are the key requirements?\",
      \"session_id\": \"$SESSION_ID\",
      \"tender_id\": \"test-tender-1\"
    }"
  ```

- [ ] **Expected response includes**
  - analysis (text response)
  - citations (chunk counts)
  - sources (document names)

#### 6.3 Other Endpoints
- [ ] **Draft proposal endpoint**
  ```bash
  curl -X POST http://localhost:5175/api/rag/draft-proposal ...
  ```

- [ ] **Evaluate proposal endpoint**
  ```bash
  curl -X POST http://localhost:5175/api/rag/evaluate-proposal ...
  ```

- [ ] **Assess risks endpoint**
  ```bash
  curl -X POST http://localhost:5175/api/rag/assess-risks ...
  ```

---

### Phase 7: Documentation Review (10 minutes)

#### 7.1 Read Documentation
- [ ] **RAG_SETUP_GUIDE.md** - Architecture and setup overview
- [ ] **RAG_DEPLOYMENT_GUIDE.md** - Production deployment
- [ ] **RAG_IMPLEMENTATION_SUMMARY.md** - Complete system summary
- [ ] **RAG_QUICK_REFERENCE.md** - API reference and examples
- [ ] **DEPENDENCIES_INSTALLATION_GUIDE.md** - Dependency details

#### 7.2 Review Code
- [ ] **RAG services** (`src/services/rag/`)
- [ ] **API routes** (`src/routes/rag.routes.js`)
- [ ] **Database migration** (`src/db/migrations/009-rag-embeddings.js`)

#### 7.3 Plan Frontend Integration
- [ ] **Identify UI components needed**
- [ ] **Plan state management**
- [ ] **Design user workflows**

---

## 🚀 Deployment Checklist

### Pre-Production (1-2 hours)

#### Load Testing
- [ ] **Test with real tender documents**
- [ ] **Verify performance under load**
- [ ] **Check memory usage**
- [ ] **Monitor API response times**

#### Security Review
- [ ] **API authentication verified**
- [ ] **Rate limiting configured**
- [ ] **SQL injection prevention checked**
- [ ] **Secrets management reviewed**

#### Backup & Recovery
- [ ] **Database backup strategy planned**
- [ ] **Recovery procedures documented**
- [ ] **Test restore process**

### Production Deployment

#### Infrastructure
- [ ] **Server/container provisioned**
- [ ] **Database connection configured**
- [ ] **Ollama service deployed (optional)**
- [ ] **SSL/TLS configured**

#### Configuration
- [ ] **All environment variables set**
- [ ] **Log aggregation configured**
- [ ] **Monitoring/alerting set up**
- [ ] **Backup scripts scheduled**

#### Validation
- [ ] **All tests pass in production environment**
- [ ] **API endpoints responding correctly**
- [ ] **Database operations working**
- [ ] **Log messages showing expected flow**

#### Go-Live
- [ ] **User communication completed**
- [ ] **Admin training conducted**
- [ ] **Support contact information distributed**
- [ ] **Rollback plan documented**

---

## 📊 Success Metrics

### Functional Metrics
- [ ] ✅ All 10 API endpoints operational
- [ ] ✅ Global PDFs ingested (200+ embeddings)
- [ ] ✅ Session creation and management working
- [ ] ✅ Analysis requests returning quality results
- [ ] ✅ Automatic cleanup running on schedule
- [ ] ✅ Error handling and logging functional

### Performance Metrics
- [ ] ✅ Embedding generation < 200ms per chunk
- [ ] ✅ Retrieval queries < 500ms
- [ ] ✅ LLM responses < 3 seconds
- [ ] ✅ Database queries < 100ms
- [ ] ✅ API response times < 2 seconds (P95)

### Reliability Metrics
- [ ] ✅ 99.9% uptime in initial testing
- [ ] ✅ Zero data loss observed
- [ ] ✅ Session cleanup working reliably
- [ ] ✅ No unhandled exceptions
- [ ] ✅ Graceful fallbacks for service failures

---

## 🛠️ Troubleshooting Quick Guide

### If Checks Fail

| Error | Quick Fix |
|-------|-----------|
| `pdf-parse not found` | `npm install pdf-parse` |
| `pgvector extension not found` | Enable in Supabase: `CREATE EXTENSION vector;` |
| `Cannot connect to database` | Check `DATABASE_URL` in `.env` |
| `GROQ_API_KEY error` | Verify format: `gsk_...` |
| `Ollama connection refused` | Run `ollama serve` in separate terminal |
| `rag_embeddings table not found` | Restart server to auto-migrate |
| `Session cleanup not working` | Check if cleanup service scheduled in `app.js` |

### Debug Commands

```bash
# Check environment
source .env && echo "Environment loaded"

# Test database
psql -d $DATABASE_URL -c "SELECT 1"

# Test Ollama
curl http://localhost:11434/api/tags

# Test Groq
curl -H "Authorization: Bearer $GROQ_API_KEY" \
  https://api.groq.com/openai/v1/models

# Check server logs
tail -f logs/rag-system.log

# Test API locally
curl http://localhost:5175/api/rag/stats -H "Authorization: Bearer TOKEN"
```

---

## 📞 Support Resources

### Documentation
- [RAG Setup Guide](./server/RAG_SETUP_GUIDE.md)
- [Deployment Guide](./server/RAG_DEPLOYMENT_GUIDE.md)
- [Quick Reference](./RAG_QUICK_REFERENCE.md)
- [Implementation Summary](./RAG_IMPLEMENTATION_SUMMARY.md)

### External Resources
- [Ollama Documentation](https://github.com/ollama/ollama)
- [Groq API Docs](https://console.groq.com/docs)
- [Supabase pgvector](https://supabase.com/docs/guides/ai/vector-indexes)
- [Express.js Guide](https://expressjs.com/)

### Quick Commands
```bash
# Setup validation
node setup-rag-system.js

# Run tests
node src/db/test-rag-system.js

# Check status
npm run dev

# Manual database check
psql -d $DATABASE_URL -c "SELECT COUNT(*) FROM rag_embeddings;"
```

---

## ✅ Final Verification

### All Clear for Launch?

- [ ] All phases completed successfully
- [ ] All tests passing
- [ ] Documentation reviewed
- [ ] Endpoints tested
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Team trained
- [ ] Go-live plan documented

### If All Checked ✅ → System is Ready!

---

## 📝 Notes

- **First-time setup**: ~2-3 hours
- **Subsequent deployments**: ~30 minutes
- **No external dependencies**: Except Ollama (optional) and Groq API
- **Database migrations**: Automatic on server startup
- **Downtime risk**: Low (existing API unaffected)

---

**🎉 Ready to deploy the RAG system!**

For any questions or issues, refer to the documentation files or run the test suite.

