# AI Drafting Assistant Implementation

## 📋 Overview

The AI Drafting Assistant is integrated into Step 2 (Tender Content & Eligibility) of the tender creation flow. It acts as a **junior government drafting officer** who:

✅ Reviews existing section content  
✅ Suggests incremental improvements only  
✅ Never auto-applies changes  
✅ Provides government-compliant recommendations  
✅ Uses RAG (Retrieval-Augmented Generation) to reference similar published tenders  

---

## 🎯 Core Principles

### 1. **No Auto-Application**
- Suggestions are **never** automatically applied
- User must explicitly click "Apply" for each suggestion
- Editor remains the single source of truth

### 2. **Incremental Suggestions Only**
- AI suggests **additions**, not full rewrites
- Never removes or modifies existing content
- Suggests only what's missing or improvable

### 3. **Audit-Friendly**
- All suggestions fit government procurement standards
- Clear observation + reasoning for each suggestion
- No hidden logic or model training

### 4. **Section-Aware & Context-Aware**
- Default: Reviews selected section only
- Toggle: Can switch to entire-tender review
- Uses tender metadata (department, sector, type) for context

---

## 🏗️ Architecture

### Frontend (React)

#### **Component: AIAssistant** (`client/src/components/admin/AIAssistant.jsx`)

**Props:**
```jsx
{
  currentSectionKey: string,        // e.g. "scope_of_work"
  currentSectionTitle: string,      // e.g. "Scope of Work"
  currentContent: string,           // Textarea content
  tenderMetadata: object,           // {title, authorityName, sector, etc.}
  allSections: array,              // All tender sections
  onApplySuggestion: function,     // Callback to apply suggestion
  token: string                     // Auth token
}
```

**Features:**
- Chat interface with message history
- Mode toggle: Section-specific ↔ Entire Tender
- Expandable suggestion cards with:
  - 📝 Observation (what's missing)
  - 📄 Suggested Text (exact addition to make)
  - 💡 Reason (why it matters)
- Apply/Ignore buttons per suggestion
- Loading states and error handling

**Layout in StepContentBuilder:**
```
┌──────────────────┬──────────────────┬──────────────────┐
│  Section List    │  Section Editor  │  AI Assistant    │
│  (col-span-3)    │  (col-span-5)    │  (col-span-4)    │
└──────────────────┴──────────────────┴──────────────────┘
```

#### **Integration in StepContentBuilder**

```jsx
<AIAssistant 
  currentSectionKey={selectedSectionKey}
  currentSectionTitle={selectedSection?.title}
  currentContent={selectedSection?.content}
  tenderMetadata={tenderMetadata}
  allSections={sections}
  onApplySuggestion={handleApplyAISuggestion}
  token={token}
/>
```

**Handler: `handleApplyAISuggestion`**
- Appends suggested text to section content
- Preserves existing content (never overwrites)
- Updates textarea with `\n\n` separator

---

### Backend (Node.js)

#### **Route: POST /api/ai/assist**

**Access Control:**
- ✅ AUTHORITY role only (requireRole middleware)
- ✅ Rate limited (aiRateLimiter)
- ✅ Authenticated users only

**Request Payload:**
```json
{
  "mode": "section" | "tender",
  "sectionType": "scope_of_work",
  "existingContent": "...",
  "tenderMetadata": {
    "title": "...",
    "authorityName": "...",
    "sector": "...",
    "tenderType": "..."
  },
  "userQuestion": "What clauses am I missing?"
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "observation": "Missing delivery timeline",
      "suggestedText": "Delivery must be completed within 30 days of order placement.",
      "reason": "Critical for bidder compliance and project planning"
    },
    {...}
  ]
}
```

#### **Controller: `assistTenderDrafting`** (`server/src/controllers/ai.controller.js`)

**Logic:**
1. Validates request (mode, content, question)
2. Calls AIService.assistTenderDrafting()
3. Returns structured suggestions or error

**Error Handling:**
- 400: Missing required fields
- 503: AI service unavailable
- 500: Unexpected errors

#### **Service: `AIService.assistTenderDrafting()`** (`server/src/services/ai.service.js`)

**Process:**

1. **RAG Retrieval**
   - Embed user question using EmbeddingService
   - Vector search against published tender sections
   - Retrieve top 3 similar sections as reference
   - Filter by sector/tender type if available

2. **System Prompt Engineering**
   ```
   You are a senior government tender drafting officer.
   - Review existing content
   - Identify gaps and weak wording
   - Suggest incremental improvements ONLY
   - NEVER rewrite entire sections
   - NEVER remove user content
   - Make suggestions audit-friendly
   ```

3. **AI Processing**
   - Embed system prompt + reference context + user prompt
   - Call OpenAI API (gpt-3.5-turbo)
   - Temperature: 0 (deterministic)

4. **Response Parsing**
   - Extract "SUGGESTION [n]:" blocks
   - Parse Observation, Text, Reason fields
   - Return structured array

**Key Functions:**
- `assistTenderDrafting(options)` - Main orchestrator
- `parseAISuggestions(response)` - Parse AI output into structured format

---

## 🔄 Data Flow

### User Interaction Flow

```
1. Authority opens Tender Creation → Step 2 (Content Builder)
   ↓
2. AI Assistant panel appears (3rd column, sticky)
   ↓
3. Select a section (default: "Scope of Work")
   ↓
4. Ask a question: "What's missing in this section?"
   ↓
5. Frontend calls: POST /api/ai/assist
   ├─ mode: "section"
   ├─ sectionType: "scope_of_work"
   ├─ existingContent: "<current textarea content>"
   └─ userQuestion: "<authority's question>"
   ↓
6. Backend processes:
   ├─ RAG: Retrieves similar published sections
   ├─ Prompt: Builds system + reference context
   ├─ AI Call: Queries OpenAI
   └─ Parse: Structures response into suggestions
   ↓
7. Frontend receives suggestions array
   ↓
8. Render each suggestion as expandable card
   ├─ Show: Observation
   ├─ Show: Suggested Text (in code block)
   ├─ Show: Reason
   └─ Buttons: [Apply] [Ignore]
   ↓
9. Authority clicks "Apply"
   ↓
10. Content appended to textarea: 
    "<existing>\n\n<suggested>"
   ↓
11. Status: "Applied" shown in suggestion card
   ↓
12. Authority continues editing/drafting manually
```

### Entire Tender Review Mode

```
Authority toggles: Section ⟶ Tender
   ↓
AI context switches to:
├─ All section titles + summaries
├─ Tender metadata
├─ Full user question
   ↓
Backend processes same way
but with full tender context
```

---

## 🔒 Security & Compliance

### Access Control
- Only AUTHORITY role can use AI assistance
- BIDDER role cannot access (they only view published tenders)
- Rate limiting prevents abuse (standard rate-limit middleware)

### Data Privacy
- Chat history NOT persisted permanently
- Session-level only (lost on refresh)
- No model training on user data
- Embeddings used for retrieval only, not stored in user profile

### Content Safety
- No content auto-modification without explicit user action
- All changes visible and reversible (edit textarea)
- Suggestions logged for audit trails (optional)

---

## 🧪 Testing Checklist

### Frontend Testing

**Component Rendering:**
- [ ] AI panel appears on Step 2
- [ ] Mode toggle visible (Section/Tender buttons)
- [ ] Chat message list scrolls correctly
- [ ] Input field has placeholder text

**Section-Specific Mode:**
- [ ] Default: Shows selected section context
- [ ] Context header: "Assisting: [Section Name]"
- [ ] Send message with question about current section
- [ ] Suggestions render with observations, text, reason

**Entire Tender Mode:**
- [ ] Toggle to "Tender" mode
- [ ] Context header: "Reviewing entire tender"
- [ ] Send message about overall tender structure
- [ ] Receive tender-level suggestions

**Suggestion Interaction:**
- [ ] Click suggestion card to expand
- [ ] Shows full observation, text, reason
- [ ] Click "Apply" button
- [ ] Suggested text appends to editor
- [ ] Card shows "Applied" status
- [ ] Click "Ignore" to collapse

**Error Handling:**
- [ ] Network error shows error message
- [ ] Empty question: "Send" button disabled
- [ ] Retry on failed request

### Backend Testing

**Endpoint Testing (POST /api/ai/assist):**

```bash
# Test 1: Valid section assistance
curl -X POST http://localhost:5001/ai/assist \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "mode": "section",
    "sectionType": "scope_of_work",
    "existingContent": "We need to build a software system.",
    "tenderMetadata": {"sector": "IT", "tenderType": "RFP"},
    "userQuestion": "What technical requirements am I missing?"
  }'

# Test 2: Entire tender mode
curl -X POST http://localhost:5001/ai/assist \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "mode": "tender",
    "existingContent": "<all sections summary>",
    "tenderMetadata": {...},
    "userQuestion": "Is this tender complete?"
  }'

# Test 3: Invalid mode
curl -X POST http://localhost:5001/ai/assist \
  -d '{
    "mode": "invalid",
    "existingContent": "...",
    "userQuestion": "..."
  }'
# Expected: 400 "mode must be 'section' or 'tender'"
```

**RAG Testing:**
- [ ] Published tender sections retrieved successfully
- [ ] Embeddings stored and searchable
- [ ] Similar sections ranked correctly
- [ ] Falls back gracefully if embedding fails

**Response Format:**
- [ ] Always returns { suggestions: [...] }
- [ ] Each suggestion has: observation, suggestedText, reason
- [ ] No suggestion.applied field in response (only frontend)

---

## ⚙️ Configuration & Environment

### Required Environment Variables

```env
OPENAI_API_KEY=sk-...  # OpenAI API key
```

### Rate Limiting

Inherited from existing `aiRateLimiter` middleware:
- Typical: 10-20 requests per minute per user
- Configurable in `middlewares/rate-limit.middleware.js`

### Models & Parameters

**LLM Configuration:**
- Model: `gpt-3.5-turbo`
- Temperature: 0 (deterministic, no randomness)
- Max tokens: 1000 (suggestions are concise)

**RAG Configuration:**
- Max reference chunks: 3
- Vector search limit: 3
- Embedding model: text-embedding-3-small (via EmbeddingService)

---

## 🎨 UI/UX Design Details

### AI Assistant Panel Layout

**Header (Sticky):**
```
┌─────────────────────────────────────────┐
│ ⚡ AI Drafting Assistant                 │
│ 📋 Assisting: Scope of Work              │
│ [📋 Section] [📄 Tender]                 │
└─────────────────────────────────────────┘
```

**Message Area (Scrollable):**
- User messages: Blue bubble, right-aligned
- AI messages: Structured suggestion cards
- Error messages: Red border, icon
- Empty state: Illustration + "Ask for assistance"

**Suggestion Card (Normal):**
```
┌─────────────────────────────────────────┐
│ ⚠️ Missing delivery timeline             │
│ Click to review and apply                │
└─────────────────────────────────────────┘
```

**Suggestion Card (Expanded):**
```
┌─────────────────────────────────────────┐
│ ⚠️ Missing delivery timeline             │
├─────────────────────────────────────────┤
│ Suggested Addition:                      │
│ ┌───────────────────────────────────────┐│
│ │ Delivery must be within 30 days...     ││
│ └───────────────────────────────────────┘│
│                                          │
│ Why:                                     │
│ Critical for project planning and        │
│ bidder compliance                        │
├─────────────────────────────────────────┤
│ [✅ Apply]  [❌ Ignore]                  │
└─────────────────────────────────────────┘
```

**Suggestion Card (Applied):**
```
┌─────────────────────────────────────────┐
│ ✅ Missing delivery timeline  [Applied] │
└─────────────────────────────────────────┘
```

### Input Area

```
┌─────────────────────────────────────────┐
│ [Ask about this section...      ] [↑]   │
│ ℹ️ AI reviews your content and suggests │
│    improvements. Changes apply on click. │
└─────────────────────────────────────────┘
```

---

## 🚀 Deployment Checklist

**Frontend:**
- [ ] AIAssistant component compiles without errors
- [ ] Imported in StepContentBuilder with correct props
- [ ] Props passed from TenderCreate to StepContentBuilder
- [ ] useAuth hook available for token extraction

**Backend:**
- [ ] `/ai/assist` endpoint added to routes
- [ ] Controller method `assistTenderDrafting` exported
- [ ] Service method `assistTenderDrafting` implemented
- [ ] Response parsing function `parseAISuggestions` working
- [ ] EmbeddingService available and configured

**Environment:**
- [ ] OPENAI_API_KEY set in `.env`
- [ ] pgvector extension enabled (for embeddings)
- [ ] Rate limiter configured
- [ ] Database migrations applied (if needed for embeddings)

**Testing:**
- [ ] All components compile without TypeScript/ESLint errors
- [ ] API endpoint returns structured suggestions
- [ ] Frontend displays suggestions correctly
- [ ] Apply button appends text to editor
- [ ] No auto-modification without user action

---

## 📊 Monitoring & Logging

### Optional Enhancements (Future)

1. **Suggestion Logging**
   ```sql
   CREATE TABLE ai_suggestion_log (
     id SERIAL PRIMARY KEY,
     tender_id INT,
     section_key VARCHAR(100),
     user_question TEXT,
     suggestion_json JSONB,
     was_applied BOOLEAN,
     created_at TIMESTAMP
   );
   ```

2. **Usage Metrics**
   - Track AI assistance usage per authority
   - Monitor suggestion acceptance rate
   - Identify common gaps in tender sections

3. **Performance Tracking**
   - Response time for embeddings
   - API call latency
   - RAG retrieval effectiveness

---

## 🎓 Government Compliance Notes

### Why This Design is Audit-Friendly

✅ **Explicit User Control**
- Every change requires conscious user action
- No hidden auto-apply logic
- Clear audit trail in editor

✅ **Transparent AI Behavior**
- Shows exactly what AI sees (current section/tender)
- Shows reference examples from published tenders
- Explains reasoning for each suggestion

✅ **No Model Training**
- Embeddings used for retrieval only
- Chat history not persisted
- User content never used to fine-tune model

✅ **Standard Government Language**
- Suggestions use formal tender terminology
- Compliant with procurement standards
- No colloquial or informal suggestions

✅ **Reversible Changes**
- All changes visible in editor
- User can undo by deleting suggested text
- No hidden modifications

---

## 🔗 API Integration

### Frontend → Backend Flow

**File: `client/src/components/admin/AIAssistant.jsx`**
```jsx
const response = await apiClient.post(
  "/ai/assist",
  {
    mode, sectionType, existingContent, tenderMetadata, userQuestion
  },
  { headers: { Authorization: `Bearer ${token}` } }
);
```

**File: `client/src/services/aiService.js`**
```javascript
export const aiService = {
  async assist(params, token) {
    const response = await apiClient.post("/ai/assist", params, {...});
    return response.data;
  }
};
```

---

## 📝 Summary

The AI Drafting Assistant provides government officers with:

✅ Smart suggestions based on published tenders (RAG)  
✅ Full control over what content is added  
✅ Compliance with procurement standards  
✅ Audit-friendly operation  
✅ Intuitive, familiar interface  

**Key Behavioral Guarantee:**
> "AI will suggest, never assume. Changes only happen when the Authority says YES."

---

**Implementation Date:** January 14, 2026  
**Status:** ✅ Complete & Ready for Testing  
**Compliance:** Government Tender Standards  
