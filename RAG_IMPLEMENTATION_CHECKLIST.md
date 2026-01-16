# RAG Implementation Checklist

## ✅ Pre-Deployment Checklist

### Backend Files Created/Modified

#### New Controllers
- [x] `server/src/controllers/rag.controller.js`
  - initAnalysisSession
  - getSessionStatus
  - getTenderOverview
  - getSectionSummaries
  - getAIInsights
  - chatWithTender

#### New Services
- [x] `server/src/services/rag/ingestion.service.js` - PDF processing
- [x] `server/src/services/rag/retrieval.service.js` - Hybrid search
- [x] `server/src/services/rag/embedding.service.js` - HuggingFace integration
- [x] `server/src/services/rag/llm.service.js` - Groq LLM calls
- [x] `server/src/services/rag/prompt.service.js` - Prompt templates
- [x] `server/src/services/rag/chunking.service.js` - Text chunking

#### New Routes
- [x] `server/src/routes/rag-new.routes.js`

#### Database Migrations
- [x] `server/src/db/migrations/009-rag-embeddings.js`
- [x] `server/src/db/migrations/010-rag-sessions.js`

#### Modified Files
- [x] `server/src/app.js` - Import and register RAG routes, run migrations
- [x] `server/package.json` - Add dependencies (axios, pdf-parse, uuid)

### Frontend Files Created/Modified

#### New Services
- [x] `client/src/services/bidder/ragService.js`

#### New Components
- [x] `client/src/components/tender-analysis/AnalysisLoadingModal.jsx`
- [x] `client/src/components/tender-analysis/OverviewTabRAG.jsx`
- [x] `client/src/components/tender-analysis/SectionsTabRAG.jsx`
- [x] `client/src/components/tender-analysis/InsightsTabRAG.jsx`
- [x] `client/src/components/tender-analysis/AIAssistantRAG.jsx`

#### New Pages
- [x] `client/src/pages/bidder/TenderAnalysisRAG.jsx`

#### Modified Files
- [x] `client/src/App.jsx` - Add route for RAG analysis
- [x] `client/src/components/bidder-discovery/TenderCard.jsx` - Add onAnalyze prop
- [x] `client/src/pages/bidder/BidderTenderDiscovery.jsx` - Add handleAnalyzeTender

### Documentation
- [x] `RAG_IMPLEMENTATION_COMPLETE.md` - Setup guide
- [x] `RAG_API_REFERENCE.md` - API documentation
- [x] `RAG_IMPLEMENTATION_CHECKLIST.md` - This file

---

## 🔧 Setup Steps

### 1. Install Dependencies

```bash
cd server
npm install
```

Required new packages:
- `axios` - HTTP client for Hugging Face/Groq APIs
- `pdf-parse` - PDF text extraction
- `uuid` - Session ID generation

### 2. Environment Variables

Add to `server/.env`:

```env
# Required
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx

# Optional (has defaults)
GROQ_MODEL=llama-3.1-70b-versatile
```

**Get API Keys:**
1. **Hugging Face:** https://huggingface.co/settings/tokens
   - Create account (free)
   - Generate access token
   - Free tier: 30 requests/minute

2. **Groq:** https://console.groq.com
   - Create account (free)
   - Generate API key
   - Free tier: 30 requests/minute, 7000 tokens/minute

### 3. Database Setup

**Ensure pgvector extension is enabled:**

For Supabase (already enabled):
- ✅ No action needed

For local PostgreSQL:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Verify migrations run on startup:**
```bash
cd server
npm run dev
```

Look for:
```
✓ rag_embeddings table created successfully with indexes
✓ rag_sessions table created successfully
```

### 4. Test the System

#### Backend Test
```bash
cd server
curl -X POST http://localhost:5000/api/rag/sessions/init \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tender_id": 1}'
```

Expected response:
```json
{
  "session_id": "uuid-here",
  "tender_id": 1,
  "status": "PROCESSING",
  "message": "Tender analysis initiated..."
}
```

#### Frontend Test
1. Start client: `cd client && npm run dev`
2. Login as bidder
3. Navigate to Tender Discovery
4. Click "Analyze" on any tender
5. Verify loading modal appears
6. Wait for redirect to analysis page
7. Check all tabs load correctly
8. Test AI chat functionality

---

## 🐛 Troubleshooting

### Issue: "HUGGINGFACE_API_KEY not set" warning

**Solution:**
```bash
# Check .env file exists
ls server/.env

# Add the key
echo "HUGGINGFACE_API_KEY=hf_your_key_here" >> server/.env
```

### Issue: "CREATE EXTENSION IF NOT EXISTS vector" fails

**Error:** `extension "vector" is not available`

**Solution:**
```bash
# For Ubuntu/Debian
sudo apt-get install postgresql-16-pgvector

# For macOS
brew install pgvector

# For Supabase: Already installed, no action needed
```

### Issue: Session stays in "PROCESSING" indefinitely

**Possible Causes:**
1. PDF URL is inaccessible
2. HuggingFace API rate limit hit
3. Embedding service error

**Debug:**
```bash
# Check server logs
cd server
npm run dev

# Look for errors like:
# [RAG Ingestion] PDF download failed: ...
# [RAG Embedding] API Error: ...
```

**Fix:**
- Verify tender has valid `document_url`
- Wait 60 seconds if rate limited
- Check API key is valid

### Issue: LLM responses are generic or empty

**Possible Causes:**
1. Groq API key invalid
2. Retrieval returning no chunks
3. Session embeddings not created

**Debug:**
```bash
# Test Groq API directly
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer YOUR_GROQ_KEY"
```

**Fix:**
- Verify Groq API key
- Check `rag_embeddings` table has data:
  ```sql
  SELECT COUNT(*) FROM rag_embeddings WHERE session_id = 'your-session-id';
  ```

### Issue: Frontend build errors

**Error:** `Cannot find module 'react-router-dom'`

**Solution:**
```bash
cd client
npm install react-router-dom
```

### Issue: CORS errors

**Error:** `Access to fetch at 'http://localhost:5000' blocked by CORS`

**Solution:**
Check `server/src/app.js` has client URL in CORS origins:
```javascript
const allowedOrigins = [
  'http://localhost:5173',  // Vite default
  'http://localhost:5174'
];
```

---

## ✅ Verification Tests

### Test 1: Session Creation
```bash
# Login and get token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bidder@test.com","password":"test123"}' \
  | jq -r '.token')

# Create session
curl -X POST http://localhost:5000/api/rag/sessions/init \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tender_id": 1}' \
  | jq '.'
```

Expected: `{ "session_id": "...", "status": "PROCESSING", ... }`

### Test 2: Status Polling
```bash
SESSION_ID="paste-session-id-here"
curl http://localhost:5000/api/rag/sessions/$SESSION_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.status'
```

Expected: `"PROCESSING"` → eventually `"READY"`

### Test 3: Overview Analysis
```bash
curl -X POST http://localhost:5000/api/rag/analysis/overview \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"tender_id\": 1}" \
  | jq '.overview'
```

Expected: JSON with `estimatedValue`, `totalSections`, etc.

### Test 4: Chat
```bash
curl -X POST http://localhost:5000/api/rag/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"question\": \"What is the submission deadline?\"}" \
  | jq '.answer'
```

Expected: Natural language answer based on tender content

---

## 📊 Performance Benchmarks

### Expected Processing Times

| Metric | Value |
|--------|-------|
| PDF ingestion (10 pages) | 15-30 seconds |
| Embedding generation per chunk | 0.5-1 second |
| Overview analysis | 2-3 seconds |
| Section summary | 1-2 seconds each |
| Chat response | 1-3 seconds |

### Resource Usage

| Resource | Usage |
|----------|-------|
| Database storage per tender | ~1-5 MB (embeddings) |
| RAM per session | ~50-100 MB |
| API calls per analysis | ~50-100 (HuggingFace) |

---

## 🎯 Success Criteria

- [x] Backend server starts without errors
- [x] Migrations create tables successfully
- [x] Session creation returns session_id
- [x] Status polling shows PROCESSING → READY
- [x] Overview endpoint returns structured data
- [x] Chat endpoint returns relevant answers
- [x] Frontend shows loading modal
- [x] Analysis page loads with tabs
- [x] AI assistant responds to questions
- [x] No console errors in browser

---

## 🚀 Ready for Production

Once all checkboxes are checked:

1. ✅ All files created
2. ✅ Dependencies installed
3. ✅ Environment variables set
4. ✅ Database migrations ran
5. ✅ API tests pass
6. ✅ Frontend tests pass
7. ✅ No errors in logs

**You're ready to deploy! 🎉**

---

## 📞 Support

If you encounter issues:

1. Check server logs: `cd server && npm run dev`
2. Check browser console: Press F12
3. Verify database: `psql $DATABASE_URL -c "SELECT * FROM rag_sessions LIMIT 5;"`
4. Test API directly with curl (examples above)

Common fixes:
- Restart server
- Clear database: `DELETE FROM rag_sessions; DELETE FROM rag_embeddings;`
- Reinstall dependencies: `rm -rf node_modules && npm install`
