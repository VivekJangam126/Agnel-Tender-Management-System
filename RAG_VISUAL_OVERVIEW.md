# 🗺️ RAG System - Visual Overview & File Map

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TENDER MANAGEMENT PLATFORM                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         FRONTEND LAYER                              │  │
│  │  ┌─────────────────────┬──────────────────────┬─────────────────┐  │  │
│  │  │  Tender Analysis    │  Proposal Drafting   │  Evaluation     │  │  │
│  │  │  Components         │  Interface           │  Dashboard      │  │  │
│  │  └─────────────────────┴──────────────────────┴─────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                  ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      API GATEWAY (Express.js)                       │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │  /api/rag/analyze  /api/rag/draft-proposal  ...             │   │  │
│  │  │  (10 REST Endpoints)                                        │   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                  ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     RAG ENGINE (Node.js)                            │  │
│  │  ┌────────────────────────────────────────────────────────────┐    │  │
│  │  │  Text Processing                                           │    │  │
│  │  │  ├─ PDF Extraction (pdf-extractor.js)                     │    │  │
│  │  │  ├─ Text Cleaning                                         │    │  │
│  │  │  └─ Chunking (text-chunker.js)                            │    │  │
│  │  └────────────────────────────────────────────────────────────┘    │  │
│  │  ┌────────────────────────────────────────────────────────────┐    │  │
│  │  │  Vector Operations                                         │    │  │
│  │  │  ├─ Embedding Generation (embedding.service.js)           │    │  │
│  │  │  ├─ Storage (pgvector)                                    │    │  │
│  │  │  └─ Retrieval (hybrid-retrieval.js)                       │    │  │
│  │  └────────────────────────────────────────────────────────────┘    │  │
│  │  ┌────────────────────────────────────────────────────────────┐    │  │
│  │  │  LLM Integration                                           │    │  │
│  │  │  ├─ Prompt Building (prompt-builder.js)                   │    │  │
│  │  │  └─ Groq API Calls                                        │    │  │
│  │  └────────────────────────────────────────────────────────────┘    │  │
│  │  ┌────────────────────────────────────────────────────────────┐    │  │
│  │  │  Session Management                                        │    │  │
│  │  │  ├─ Global Ingestion (global-ingestion.js)                │    │  │
│  │  │  ├─ Session Ingestion (session-ingestion.js)              │    │  │
│  │  │  └─ Cleanup (cleanup.service.js)                          │    │  │
│  │  └────────────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                  ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │               VECTOR DATABASE (Supabase pgvector)                   │  │
│  │  ┌───────────────────────┬────────────────────────────────────┐    │  │
│  │  │  rag_embeddings       │  Indexes                           │    │  │
│  │  │  ├─ id                │  ├─ HNSW (similarity)             │    │  │
│  │  │  ├─ embedding[768]    │  ├─ idx_scope                    │    │  │
│  │  │  ├─ text              │  ├─ idx_session                  │    │  │
│  │  │  ├─ scope             │  └─ idx_source                   │    │  │
│  │  │  ├─ session_id        │                                   │    │  │
│  │  │  └─ created_at        │                                   │    │  │
│  │  └───────────────────────┴────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                  ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    EXTERNAL SERVICES                                │  │
│  │  ┌─────────────────────┬──────────────────┬─────────────────────┐  │  │
│  │  │  Ollama             │  Groq LLM        │  Reference PDFs     │  │  │
│  │  │  nomic-embed-text   │  mixtral-8x7b    │  (global_pdfs/)     │  │  │
│  │  │  (embeddings)       │  (analysis)      │                     │  │  │
│  │  └─────────────────────┴──────────────────┴─────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Complete File Tree with Status

```
Tender-Management-System/
│
├── 📄 RAG_DOCUMENTATION_INDEX.md              ⭐ YOU ARE HERE
├── 📄 RAG_DELIVERY_SUMMARY.md                 ⭐ START HERE
├── 📄 RAG_MASTER_CHECKLIST.md                 ⭐ SETUP GUIDE
├── 📄 RAG_QUICK_REFERENCE.md                  ✅ API Examples
├── 📄 RAG_IMPLEMENTATION_SUMMARY.md           ✅ Technical Details
├── 📄 DEPENDENCIES_INSTALLATION_GUIDE.md      ✅ Package Guide
│
├── README.md                                  (Original project)
├── TEAM_SETUP_GUIDE.md                        (Previous work)
├── SUBMISSION_IMPLEMENTATION_SUMMARY.md       (Previous work)
│
└── server/
    │
    ├── 📄 RAG_SETUP_GUIDE.md                 ✅ Setup Instructions
    ├── 📄 RAG_DEPLOYMENT_GUIDE.md            ✅ Deployment Procedures
    ├── 📄 setup-rag-system.js                ✅ Validation Script
    ├── 📄 package.json                       (Update required)
    ├── 📄 README.md                          (Original)
    │
    ├── data/
    │   ├── 📁 global_pdfs/                   📍 Create & add 5 PDFs
    │   ├── 📁 sessions/                      📍 Auto-created by system
    │   └── 📁 global_pdfs/
    │       (empty - ready for reference PDFs)
    │
    ├── src/
    │   │
    │   ├── 📄 app.js                         ✅ MODIFIED
    │   │                                       (RAG routes + cleanup scheduled)
    │   │
    │   ├── config/
    │   │   ├── 📄 db.js                      ✅ Existing
    │   │   ├── 📄 env.js                     ✅ Existing
    │   │   └── (other configs)               ✅ Existing
    │   │
    │   ├── routes/
    │   │   ├── 📄 rag.routes.js              ✅ NEW (10 endpoints)
    │   │   ├── 📄 auth.routes.js             ✅ Existing
    │   │   ├── 📄 tender.routes.js           ✅ Existing
    │   │   └── (other routes)                ✅ Existing
    │   │
    │   ├── services/
    │   │   ├── 📁 rag/                       ✅ NEW (9 modules)
    │   │   │   ├── 📄 pdf-extractor.js       ✅ PDF text extraction
    │   │   │   ├── 📄 text-chunker.js        ✅ Text chunking
    │   │   │   ├── 📄 embedding.service.js   ✅ Embedding generation
    │   │   │   ├── 📄 global-ingestion.js    ✅ Global PDF ingestion
    │   │   │   ├── 📄 session-ingestion.js   ✅ Session PDF handling
    │   │   │   ├── 📄 hybrid-retrieval.js    ✅ Context retrieval
    │   │   │   ├── 📄 prompt-builder.js      ✅ Prompt construction
    │   │   │   ├── 📄 cleanup.service.js     ✅ Session cleanup
    │   │   │   └── 📄 index.js               ✅ Service exports
    │   │   │
    │   │   ├── 📄 aiService.js               ✅ Existing
    │   │   ├── 📄 authService.js             ✅ Existing
    │   │   ├── 📄 tendersService.js          ✅ Existing
    │   │   ├── 📄 proposalService.js         ✅ Existing
    │   │   ├── 📄 evaluationService.js       ✅ Existing
    │   │   └── (other services)              ✅ Existing
    │   │
    │   ├── db/
    │   │   ├── 📁 migrations/
    │   │   │   ├── 📄 009-rag-embeddings.js  ✅ NEW (Table creation)
    │   │   │   ├── (other migrations)        ✅ Existing
    │   │   │   └── (existing migrations)     ✅ Existing
    │   │   │
    │   │   ├── 📄 test-rag-system.js         ✅ NEW (8 tests)
    │   │   ├── 📄 seed.js                    ✅ Existing
    │   │   ├── 📄 testConnection.js          ✅ Existing
    │   │   └── (other db files)              ✅ Existing
    │   │
    │   ├── middlewares/                      ✅ Existing
    │   │   └── (auth, error handling, etc.)
    │   │
    │   ├── controllers/                      ✅ Existing
    │   │   └── (business logic)
    │   │
    │   └── utils/                            ✅ Existing
    │       └── (helpers, validators, etc.)
    │
    ├── logs/                                 📍 Auto-created, logs stored here
    │
    └── (other existing files)                ✅ Untouched
```

---

## 🔄 Data Flow Diagram

### User Upload → Analysis Flow

```
1. USER UPLOAD
   ├─ Upload tender.pdf
   ├─ Request: POST /api/rag/ingest-session
   └─ Data: { session_id, pdf_paths }

2. PDF PROCESSING
   ├─ pdf-extractor.js: Extract text from PDF
   ├─ Clean text (remove headers, footers, etc.)
   └─ Result: Clean text string

3. CHUNKING
   ├─ text-chunker.js: Split into 300-500 token chunks
   ├─ Add 50 token overlap between chunks
   └─ Result: Array of text chunks

4. EMBEDDING
   ├─ embedding.service.js: For each chunk
   ├─ Call Ollama: POST /api/embeddings
   ├─ Get: 768-dimensional vector
   └─ Result: (chunk_text, embedding_vector)

5. STORAGE
   ├─ embedding.service.js: Store embeddings
   ├─ INSERT INTO rag_embeddings
   ├─ Fields: embedding, text, scope='session', session_id
   └─ Result: Embeddings in database

6. RETRIEVAL
   ├─ User asks: "What are requirements?"
   ├─ hybrid-retrieval.js: Generate embedding for query
   ├─ Search pgvector for similar chunks
   ├─ Combine: Session (70%) + Global (30%) results
   └─ Result: Top-10 relevant chunks

7. PROMPT BUILDING
   ├─ prompt-builder.js: Construct RAG prompt
   ├─ Include: Query + Session context + Global context
   ├─ Add: Instructions and guidelines
   └─ Result: Complete prompt for LLM

8. LLM GENERATION
   ├─ Call Groq API with prompt
   ├─ Model: mixtral-8x7b-32768
   ├─ Streaming response back
   └─ Result: AI-generated analysis

9. RESPONSE
   ├─ Return to client:
   ├─ ├─ analysis (text response)
   ├─ ├─ citations (source chunks)
   ├─ └─ sources (document names)
   └─ End
```

---

## 🎯 Service Interaction Map

```
API REQUEST
    │
    ├─→ rag.routes.js
    │   └─ /api/rag/analyze
    │       └─ POST handler
    │
    ├─→ hybrid-retrieval.js
    │   ├─ generateEmbedding(query)
    │   ├─ retrieveSimilar(embedding)
    │   └─ combineContexts(session, global)
    │
    ├─→ embedding.service.js
    │   ├─ generateEmbedding() → Ollama
    │   ├─ retrieveSimilar() → Database pgvector
    │   └─ storeEmbedding() → Database
    │
    ├─→ prompt-builder.js
    │   ├─ buildTenderAnalysisPrompt()
    │   ├─ Format: Context A + Context B + Query
    │   └─ Add: Guardrails and instructions
    │
    ├─→ callGroqLLM()
    │   └─ POST to https://api.groq.com/...
    │       └─ Model: mixtral-8x7b-32768
    │
    └─→ Response back to client
        └─ { analysis, citations, sources }
```

---

## 📊 Session Lifecycle

```
SESSION CREATED
    │
    ├─ session_id: "abc-123-def-456"
    │ created_at: 2024-01-15T10:00:00Z
    │ expires_at: 2024-01-16T10:00:00Z (24 hours)
    │
    └─ SESSION ACTIVE (0-24 hours)
        │
        ├─ PDF ingestion
        │ │ ├─ POST /api/rag/ingest-session
        │ │ └─ Create embeddings
        │ │
        ├─ Analysis requests
        │ │ ├─ POST /api/rag/analyze
        │ │ ├─ POST /api/rag/draft-proposal
        │ │ └─ POST /api/rag/evaluate-proposal
        │ │
        ├─ Stats & monitoring
        │ │ └─ GET /api/rag/session/{id}/stats
        │ │
        └─ Cleanup check (every 1 hour)
            │
            ├─ Is session > 24 hours old?
            │ │
            │ ├─ YES → SESSION EXPIRED
            │ │   ├─ Delete embeddings from DB
            │ │   ├─ Delete PDFs from disk
            │ │   └─ Mark session inactive
            │ │
            │ └─ NO → Continue active
```

---

## 🔐 Scope Isolation

```
GLOBAL SCOPE (Permanent)
    ├─ Source: data/global_pdfs/
    ├─ Embeddings: 5 reference PDFs
    ├─ Count: ~250 embeddings
    ├─ Lifetime: Permanent
    ├─ Auto-delete: Never
    ├─ Used by: All sessions (secondary)
    └─ Weight: 0.3 in retrieval

SESSION SCOPE (Temporary)
    ├─ Source: User uploads per session
    ├─ Embeddings: Tender-specific PDFs
    ├─ Count: 0 to 1000+ per session
    ├─ Lifetime: 24 hours
    ├─ Auto-delete: After 24 hours
    ├─ Used by: Specific session (primary)
    └─ Weight: 0.7 in retrieval

HYBRID RETRIEVAL
    ├─ Query comes in
    ├─ Search Session (70%)
    │ └─ Return top-7 from session docs
    ├─ Search Global (30%)
    │ └─ Return top-3 from reference docs
    └─ Combine & rank
      └─ Return top-10 total
```

---

## 🧩 Component Dependencies

```
rag.routes.js (API)
    │
    ├─→ hybrid-retrieval.js
    │   └─→ embedding.service.js
    │       ├─→ db.js (pgvector)
    │       └─→ Ollama API (or mock)
    │
    ├─→ prompt-builder.js
    │   └─ Formats context
    │
    ├─→ session-ingestion.js
    │   ├─→ pdf-extractor.js
    │   ├─→ text-chunker.js
    │   └─→ embedding.service.js
    │
    ├─→ global-ingestion.js
    │   ├─→ pdf-extractor.js
    │   ├─→ text-chunker.js
    │   └─→ embedding.service.js
    │
    └─→ cleanup.service.js
        ├─→ embedding.service.js
        └─→ db.js

app.js
    │
    ├─→ RAG routes mounting
    ├─→ Cleanup scheduling
    └─→ Auto-migrations
```

---

## 📈 Performance Characteristics

```
OPERATION                  TIME        RESOURCE    NOTES
─────────────────────────────────────────────────────────────
PDF Ingestion (10MB)       30-60s      500MB RAM   Parallel chunks
Text Extraction            1-5s        100MB RAM   Per PDF
Chunking (1000 chunks)     200ms       50MB RAM    In-memory
Embedding Generation       100-200ms   500MB RAM   Per chunk (Ollama)
Storage (1 chunk)          50ms        1KB DB      Per embedding
Vector Retrieval           50-200ms    CPU-bound   Similarity search
Prompt Building            10ms        10KB RAM    Context formatting
LLM Response (analysis)    2-5s        GPU-bound   Groq API
Session Cleanup            100-500ms   100MB RAM   Batch delete
Total Query-to-Response    2-5s        Variable    Bottleneck: LLM
```

---

## 🗂️ Configuration Points

```
text-chunker.js
    ├─ CHUNK_SIZE = 500 tokens ← Tune here
    └─ OVERLAP = 50 tokens ← Tune here

hybrid-retrieval.js
    ├─ TOP_K = 10 results ← Tune here
    ├─ SESSION_WEIGHT = 0.7 ← Tune here
    └─ GLOBAL_WEIGHT = 0.3 ← Tune here

cleanup.service.js
    ├─ SESSION_TIMEOUT = 24 hours ← Tune here
    └─ CLEANUP_INTERVAL = 1 hour ← Tune here

embedding.service.js
    ├─ OLLAMA_URL = localhost:11434 ← Configure
    └─ EMBEDDING_DIMENSION = 768 ← Fixed

.env file
    ├─ DATABASE_URL ← Your Supabase
    ├─ GROQ_API_KEY ← Your API key
    └─ OLLAMA_URL ← Your Ollama server
```

---

## 🎯 Integration Points

```
FOR FRONTEND DEVELOPERS:
    ├─ Use /api/rag/analyze endpoint
    ├─ Pass: query, session_id, tender_id
    ├─ Expect: analysis, citations, sources
    └─ Handle streaming if needed

FOR DATABASE ADMINS:
    ├─ Monitor: rag_embeddings table
    ├─ Watch: Disk usage growth
    ├─ Check: Query performance
    └─ Backup: pgvector data

FOR SYSTEM ADMINS:
    ├─ Manage: Ollama service
    ├─ Monitor: API rate limits
    ├─ Log: RAG system output
    └─ Scale: Database/API servers

FOR PRODUCT MANAGERS:
    ├─ Track: Usage statistics
    ├─ Monitor: Quality metrics
    ├─ Plan: UI/UX features
    └─ Report: ROI calculations
```

---

## 🎓 Learning Map

```
START HERE
    │
    ├─→ Understand architecture
    │   └─ Read: RAG_IMPLEMENTATION_SUMMARY.md
    │
    ├─→ Set up the system
    │   └─ Follow: RAG_MASTER_CHECKLIST.md
    │
    ├─→ Use the API
    │   └─ Reference: RAG_QUICK_REFERENCE.md
    │
    ├─→ Deploy to production
    │   └─ Guide: RAG_DEPLOYMENT_GUIDE.md
    │
    └─→ Integrate with frontend
        └─ Examples: RAG_QUICK_REFERENCE.md
```

---

**Navigation**: Go back to [RAG_DOCUMENTATION_INDEX.md](./RAG_DOCUMENTATION_INDEX.md) for more guidance.

