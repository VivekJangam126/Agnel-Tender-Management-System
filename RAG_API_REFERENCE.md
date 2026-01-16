# RAG API Quick Reference

## Base URL
```
http://localhost:5000/api/rag
```

## Authentication
All endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Initialize Analysis Session

**Endpoint:** `POST /sessions/init`

**Purpose:** Create a new analysis session and start PDF embedding

**Request Body:**
```json
{
  "tender_id": 123
}
```

**Response:**
```json
{
  "session_id": "uuid-v4-string",
  "tender_id": 123,
  "status": "PROCESSING",
  "message": "Tender analysis initiated. Embedding in progress."
}
```

**Status Codes:**
- `200`: Session created successfully
- `400`: Missing tender_id or tender has no PDF
- `404`: Tender not found

---

## 2. Check Session Status

**Endpoint:** `GET /sessions/:session_id/status`

**Purpose:** Poll to check if embedding is complete

**Response:**
```json
{
  "session_id": "uuid",
  "tender_id": 123,
  "status": "READY",  // or "PROCESSING" or "FAILED"
  "error_message": null,
  "chunks_embedded": 145,
  "created_at": "2026-01-16T...",
  "updated_at": "2026-01-16T..."
}
```

**Polling Strategy:**
- Poll every 2-3 seconds
- Max 30 attempts (1 minute timeout)
- Stop when status is "READY" or "FAILED"

---

## 3. Get Tender Overview

**Endpoint:** `POST /analysis/overview`

**Purpose:** Get high-level summary of the tender

**Request Body:**
```json
{
  "session_id": "uuid",
  "tender_id": 123
}
```

**Response:**
```json
{
  "tender_id": 123,
  "session_id": "uuid",
  "overview": {
    "estimatedValue": "₹5.2Cr",
    "totalSections": 8,
    "mandatorySections": 5,
    "readTime": 45,
    "competition": "Medium",
    "keyDeadlines": [
      "Pre-bid meeting: Jan 20, 2026",
      "Submission deadline: Feb 15, 2026"
    ],
    "eligibilitySummary": "Bidders must have 5 years experience..."
  },
  "chunks_used": 15
}
```

---

## 4. Get Section Summaries

**Endpoint:** `POST /analysis/sections`

**Purpose:** Get detailed summaries for each section

**Request Body:**
```json
{
  "session_id": "uuid",
  "sections": [
    "Scope",
    "Eligibility",
    "Technical",
    "Financial",
    "Terms and Conditions"
  ]
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "sections": [
    {
      "section_name": "Eligibility",
      "summary": {
        "summary": "Bidders must demonstrate 5 years of experience...",
        "isMandatory": true,
        "riskLevel": "Medium",
        "keyRequirements": [
          "5 years of experience in similar projects",
          "Annual turnover of ₹10Cr+",
          "ISO 9001 certification"
        ],
        "concerns": [
          "Experience criteria is quite strict",
          "Turnover requirement may exclude smaller firms"
        ]
      },
      "chunks_used": 8
    }
  ]
}
```

---

## 5. Get AI Insights

**Endpoint:** `POST /analysis/insights`

**Purpose:** Get comparative analysis and risk assessment

**Request Body:**
```json
{
  "session_id": "uuid",
  "tender_id": 123
}
```

**Response:**
```json
{
  "tender_id": 123,
  "session_id": "uuid",
  "insights": {
    "unusualClauses": [
      {
        "clause": "90-day payment terms",
        "concern": "Payment terms are longer than industry standard",
        "comparison": "Standard practice is 30-45 days"
      }
    ],
    "highPenalties": [
      {
        "type": "Liquidated damages",
        "details": "2% per week of delay, max 10%",
        "severity": "High"
      }
    ],
    "missingClauses": [
      {
        "expectedClause": "Force majeure clause",
        "impact": "No protection against unforeseeable events"
      }
    ],
    "overallRiskAssessment": "Medium",
    "recommendations": [
      "Negotiate payment terms before bidding",
      "Factor liquidated damages into pricing",
      "Request addition of force majeure clause"
    ]
  },
  "comparative_sources": 12
}
```

---

## 6. Chat with Tender

**Endpoint:** `POST /chat`

**Purpose:** Ask questions about the tender document

**Request Body:**
```json
{
  "session_id": "uuid",
  "question": "What are the mandatory certifications required?",
  "conversation_history": [
    {
      "role": "user",
      "content": "What is the submission deadline?"
    },
    {
      "role": "assistant",
      "content": "The submission deadline is February 15, 2026 at 5:00 PM IST."
    }
  ]
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "question": "What are the mandatory certifications required?",
  "answer": "According to the eligibility section, the following certifications are mandatory:\n\n1. ISO 9001:2015 Quality Management System\n2. ISO 14001:2015 Environmental Management\n3. OHSAS 18001 or ISO 45001 Safety Management\n\nThese certificates must be valid and issued by an accredited certification body.",
  "sources": [
    {
      "text": "Bidders must possess valid ISO 9001, ISO 14001, and safety management certifications...",
      "page": 5,
      "section": "Eligibility Criteria"
    }
  ],
  "chunks_used": 10
}
```

---

## Error Responses

All endpoints may return:

**400 Bad Request:**
```json
{
  "error": "session_id is required"
}
```

**404 Not Found:**
```json
{
  "error": "Session not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "LLM service unavailable: API key invalid"
}
```

---

## Rate Limits

- **Embedding generation:** Limited by Hugging Face API (free tier: ~30 req/min)
- **LLM calls:** Limited by Groq API (free tier: 30 req/min, 7000 tokens/min)

**Best Practices:**
- Reuse session_id for multiple analyses of the same tender
- Cache overview/sections responses on frontend
- Implement retry logic with exponential backoff for rate limit errors

---

## Example Usage Flow

```javascript
// 1. Initialize session
const initResponse = await fetch('/api/rag/sessions/init', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ tender_id: 123 })
});
const { session_id } = await initResponse.json();

// 2. Poll until ready
let status = 'PROCESSING';
while (status === 'PROCESSING') {
  await new Promise(r => setTimeout(r, 2000));
  const statusResponse = await fetch(`/api/rag/sessions/${session_id}/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const statusData = await statusResponse.json();
  status = statusData.status;
}

// 3. Get analysis data
const overviewResponse = await fetch('/api/rag/analysis/overview', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ session_id, tender_id: 123 })
});
const overview = await overviewResponse.json();

// 4. Chat
const chatResponse = await fetch('/api/rag/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    session_id,
    question: 'What are the key deadlines?'
  })
});
const answer = await chatResponse.json();
```

---

## Testing

Use the provided `ragService.js` on the frontend for a clean abstraction:

```javascript
import { ragService } from './services/bidder/ragService';

// Initialize and wait for ready
const session = await ragService.initSession(tenderId);
await ragService.pollSessionReady(session.session_id);

// Get overview
const overview = await ragService.getTenderOverview(session.session_id, tenderId);

// Chat
const answer = await ragService.chat(session.session_id, "What is the budget?");
```
