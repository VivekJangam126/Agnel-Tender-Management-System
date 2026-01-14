# Bid Evaluation Module Documentation

## Overview

The Bid Evaluation Module enables Authority users to transparently evaluate and score bids received for published tenders. The system is designed with NO automation—all decisions are made by human evaluators.

## Features

### Core Features
- **Tender Listing**: View all published tenders with bid statistics
- **Bid Display**: See all bids for a tender sorted by amount
- **Transparent Evaluation**: Qualify/disqualify bids with remarks and scores
- **L1 Calculation**: Automatically identify the lowest qualified bid
- **Evaluation Status Tracking**: Track PENDING → IN_PROGRESS → COMPLETED
- **Audit Trail**: Timestamps and evaluator tracking for compliance

### Design Principles
✅ **Human-Controlled**: No auto-selection or auto-ranking
✅ **Transparent**: All bids visible, L1 highlighted but never auto-selected
✅ **Audit-Ready**: Timestamps, evaluator IDs, completion status
✅ **Role-Based**: AUTHORITY role required for all operations

## Database Schema

### Tables

#### 1. `bid_evaluation`
Stores evaluation details for each bid (proposal)

```sql
CREATE TABLE bid_evaluation (
    evaluation_id UUID PRIMARY KEY,
    tender_id UUID NOT NULL (FK → tender),
    proposal_id UUID NOT NULL (FK → proposal) UNIQUE,
    organization_name VARCHAR(255),
    bid_amount DECIMAL(15, 2),
    technical_status VARCHAR(50) 
        CHECK IN ('PENDING', 'QUALIFIED', 'DISQUALIFIED'),
    technical_score DECIMAL(5, 2),         -- Optional 0-100 score
    remarks TEXT,                           -- Authority comments
    evaluator_user_id UUID (FK → user),    -- Who evaluated
    evaluated_at TIMESTAMP,                -- When evaluated
    status VARCHAR(50),                    -- Record status
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

Indexes:
- idx_bid_evaluation_tender_id
- idx_bid_evaluation_proposal_id
- idx_bid_evaluation_technical_status
```

#### 2. `tender_evaluation_status`
Tracks overall evaluation state for each tender

```sql
CREATE TABLE tender_evaluation_status (
    evaluation_status_id UUID PRIMARY KEY,
    tender_id UUID NOT NULL UNIQUE (FK → tender),
    evaluation_status VARCHAR(50)
        CHECK IN ('PENDING', 'IN_PROGRESS', 'COMPLETED'),
    total_bids_received INT DEFAULT 0,
    bids_qualified INT DEFAULT 0,
    bids_disqualified INT DEFAULT 0,
    l1_proposal_id UUID (FK → proposal),  -- Lowest qualified bid
    l1_amount DECIMAL(15, 2),              -- L1 bid amount
    completed_at TIMESTAMP,                -- Evaluation completion time
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

Indexes:
- idx_tender_evaluation_status_tender_id
```

## API Endpoints

### 1. Get Tenders for Evaluation
```
GET /api/evaluation/tenders
Authentication: Bearer {token}
Authorization: AUTHORITY role required

Response:
{
  "tenders": [
    {
      "tender_id": "uuid",
      "title": "String",
      "total_bids": Number,
      "qualified_bids": Number,
      "evaluation_status": "PENDING|IN_PROGRESS|COMPLETED"
    }
  ]
}

Returns only tenders from Authority's organization
```

### 2. Get Bids for Tender
```
GET /api/evaluation/tenders/{tenderId}/bids
Authentication: Bearer {token}
Authorization: AUTHORITY role required

Response:
{
  "bids": [
    {
      "proposal_id": "uuid",
      "organization_name": "String",
      "bid_amount": Number,
      "technical_status": "PENDING|QUALIFIED|DISQUALIFIED",
      "technical_score": Number or null,
      "remarks": "String or null",
      "created_at": "ISO timestamp",
      "evaluator_user_id": "uuid or null"
    }
  ]
}

Sorted by bid_amount (ascending - L1 first)
```

### 3. Initialize Tender Evaluation
```
POST /api/evaluation/tenders/{tenderId}/initialize
Authentication: Bearer {token}
Authorization: AUTHORITY role required
Body: {}

Creates bid_evaluation records for all proposals
Creates tender_evaluation_status entry
Sets evaluation_status to 'IN_PROGRESS'

Response: { "message": "Evaluation initialized" }

Error Codes:
- 403: Not authorized (different organization)
- 404: Tender not found
- 400: Already initialized or no bids found
```

### 4. Update Bid Evaluation
```
PUT /api/evaluation/bids/{proposalId}
Authentication: Bearer {token}
Authorization: AUTHORITY role required

Body:
{
  "technical_status": "PENDING|QUALIFIED|DISQUALIFIED",
  "technical_score": Number (0-100, optional),
  "remarks": "String (optional)"
}

Response:
{
  "message": "Bid evaluation updated",
  "bid": { ...updated bid evaluation }
}

Error Codes:
- 403: Not authorized
- 404: Proposal not found
- 400: Invalid status or missing required fields
```

### 5. Complete Evaluation
```
POST /api/evaluation/tenders/{tenderId}/complete
Authentication: Bearer {token}
Authorization: AUTHORITY role required
Body: {}

Sets evaluation_status to 'COMPLETED'
Calculates L1 (lowest bid where technical_status = 'QUALIFIED')
Updates bid counts (qualified/disqualified)
Sets completed_at timestamp

Response:
{
  "message": "Evaluation completed",
  "l1_amount": Number,
  "l1_proposal_id": "uuid"
}

Error Codes:
- 403: Not authorized
- 404: Tender not found
- 400: Not all bids evaluated (no PENDING bids when completing)
```

### 6. Get Tender Evaluation Details
```
GET /api/evaluation/tenders/{tenderId}/details
Authentication: Bearer {token}
Authorization: AUTHORITY role required

Response:
{
  "tender": {
    "tender_id": "uuid",
    "title": "String"
  },
  "tender_evaluation_status": {
    "evaluation_status_id": "uuid",
    "evaluation_status": "PENDING|IN_PROGRESS|COMPLETED",
    "total_bids_received": Number,
    "bids_qualified": Number,
    "bids_disqualified": Number,
    "l1_proposal_id": "uuid or null",
    "l1_amount": Number or null,
    "completed_at": "ISO timestamp or null"
  },
  "bids": [
    {
      "proposal_id": "uuid",
      "organization_name": "String",
      "bid_amount": Number,
      "technical_status": "PENDING|QUALIFIED|DISQUALIFIED",
      "technical_score": Number or null,
      "remarks": "String or null",
      "created_at": "ISO timestamp",
      "evaluator_user_id": "uuid or null",
      "evaluated_at": "ISO timestamp or null"
    }
  ]
}

All bids sorted by bid_amount (ascending)
L1 bid included in list with designation
```

## Frontend Components

### BidEvaluationList.jsx
**Location**: `client/src/pages/admin/BidEvaluation/BidEvaluationList.jsx`

**Purpose**: Entry screen showing published tenders ready for evaluation

**Features**:
- List of published tenders with bid statistics
- Status badges (PENDING, IN_PROGRESS, COMPLETED)
- Statistics cards (Total Bids, Qualified, Pending Review)
- "View & Evaluate Bids" action button

**State**:
- `tenders`: Array of tenders with bid counts
- `loading`: Boolean for loading state
- `error`: Error message if fetch fails

**API Calls**:
- `evaluationService.getTendersForEvaluation(token)` on mount

### BidEvaluation.jsx (Detail Page)
**Location**: `client/src/pages/admin/BidEvaluation/BidEvaluation.jsx`

**Purpose**: Main evaluation interface with 3-panel layout

**Features**:
- **Left Panel**: Bid list (sortable, sticky, scrollable)
- **Center Panel**: Bid details (read-only, organization, amount, remarks)
- **Right Panel**: Evaluation form (qualify/disqualify, score, remarks)
- Completion button when all bids evaluated
- L1 indicator on lowest qualified bid
- Completion status alert

**State**:
- `tenderDetails`: Full tender and evaluation status
- `bids`: Array of all bids for selected tender
- `selectedBid`: Currently selected bid for evaluation
- `evaluationForm`: Current form values (status, score, remarks)
- `loading`: Loading indicator
- `submitting`: Submission state
- `error`: Error messages

**API Calls**:
- `evaluationService.getBidsForTender(tenderId, token)` on mount
- `evaluationService.getTenderEvaluationDetails(tenderId, token)` on mount
- `evaluationService.updateBidEvaluation(proposalId, form, token)` on save
- `evaluationService.completeEvaluation(tenderId, token)` to mark complete

## Frontend Service

### evaluationService.js
**Location**: `client/src/services/evaluationService.js`

**Methods**:

```javascript
// Get tenders for evaluation
getTendersForEvaluation(token) → { tenders: [...] }

// Get bids for specific tender
getBidsForTender(tenderId, token) → { bids: [...] }

// Initialize evaluation for tender
initializeTenderEvaluation(tenderId, token) → { message: String }

// Update bid evaluation
updateBidEvaluation(proposalId, form, token) → { message: String, bid: {...} }

// Complete evaluation
completeEvaluation(tenderId, token) → { message: String, l1_amount: Number }

// Get full evaluation details
getTenderEvaluationDetails(tenderId, token) → { tender, tender_evaluation_status, bids: [...] }
```

All methods use `apiRequest` wrapper with automatic error handling.

## Backend Service

### evaluation.service.js
**Location**: `server/src/services/evaluation.service.js`

**Methods**:

```javascript
// List tenders for Authority's organization
getTendersForEvaluation(user) → { tenders: [...] }

// Get all bids for a tender with evaluation details
getBidsForTender(tenderId, user) → { bids: [...] }

// Create bid_evaluation records for all proposals
initializeTenderEvaluation(tenderId, user) → Creates records

// Update bid evaluation (Qualify/Disqualify/Add remarks)
updateBidEvaluation(proposalId, form, user) → Updated record

// Mark evaluation as complete, calculate L1
completeEvaluation(tenderId, user) → { l1_amount, l1_proposal_id }

// Get full evaluation state
getTenderEvaluationDetails(tenderId, user) → { tender, status, bids }
```

All methods enforce:
- AUTHORITY role verification
- Organization ownership
- Proper transaction handling
- Timestamp tracking
- Evaluator attribution

## Backend Controller

### evaluation.controller.js
**Location**: `server/src/controllers/evaluation.controller.js`

**Functions**:
- `getTendersForEvaluation()` - GET handler
- `getBidsForTender()` - GET handler
- `initializeTenderEvaluation()` - POST handler
- `updateBidEvaluation()` - PUT handler
- `completeEvaluation()` - POST handler
- `getTenderEvaluationDetails()` - GET handler

**Error Handling**:
- 403 Unauthorized: User not authorized
- 404 Not Found: Resource missing
- 400 Bad Request: Invalid input or state

## Routes

### evaluation.routes.js
**Location**: `server/src/routes/evaluation.routes.js`

**Route Definitions**:
```javascript
router.get('/tenders', requireAuth, requireRole('AUTHORITY'), getTendersForEvaluation);
router.get('/tenders/:tenderId/bids', requireAuth, requireRole('AUTHORITY'), getBidsForTender);
router.post('/tenders/:tenderId/initialize', requireAuth, requireRole('AUTHORITY'), initializeTenderEvaluation);
router.get('/tenders/:tenderId/details', requireAuth, requireRole('AUTHORITY'), getTenderEvaluationDetails);
router.put('/bids/:proposalId', requireAuth, requireRole('AUTHORITY'), updateBidEvaluation);
router.post('/tenders/:tenderId/complete', requireAuth, requireRole('AUTHORITY'), completeEvaluation);
```

All routes mounted at `/api/evaluation` with AUTHORITY role enforcement.

## Workflow Example

### Step-by-Step Evaluation Process

1. **Authority Login**
   - Navigate to /admin/bid-evaluation
   - BidEvaluationList loads published tenders

2. **Select Tender**
   - Click "View & Evaluate Bids"
   - Navigate to BidEvaluation detail page
   - BidEvaluation component loads bids

3. **Initialize Evaluation** (Automatic)
   - If tender evaluation not initialized, API creates bid_evaluation records
   - Sets status to IN_PROGRESS

4. **Evaluate Bids**
   - Click bid in left panel
   - Bid details load in center panel
   - Select QUALIFIED/DISQUALIFIED in right panel
   - Add remarks and optional score
   - Click "Save Evaluation"
   - API updates bid_evaluation record with evaluator_user_id and evaluated_at

5. **Review Other Bids**
   - Repeat for all bids
   - UI shows progress (qualified/pending/disqualified counts)

6. **Complete Evaluation**
   - "Complete Evaluation" button appears when all bids evaluated
   - Click to mark evaluation complete
   - API calculates L1 (lowest qualified bid)
   - Sets completed_at timestamp
   - Status changes to COMPLETED (read-only mode)

7. **View Results**
   - All bids remain visible in read-only mode
   - L1 designation clearly marked
   - Completion timestamp displayed

## No Automation Guarantee

This implementation NEVER:
- ❌ Auto-qualifies bids based on any criteria
- ❌ Auto-ranks bids without human review
- ❌ Auto-selects L1 without explicit completion
- ❌ Makes any decisions on behalf of Authority

What Authority ALWAYS controls:
- ✅ Which bids to qualify or disqualify
- ✅ Completion decision and timing
- ✅ Remarks and scoring rationale
- ✅ L1 designation (confirmed at completion, not auto-selected)

## Testing

Run the evaluation workflow test:
```bash
cd server
node src/db/testEvaluationWorkflow.js
```

This will:
1. Check if evaluation tables exist (create if missing)
2. Find a published tender
3. Get proposals for that tender
4. Initialize evaluation
5. Create bid_evaluation records
6. Update sample evaluation
7. Show evaluation summary

## Compliance & Audit

- ✅ All evaluations tracked with evaluator_user_id
- ✅ Timestamps on all operations (created_at, evaluated_at, completed_at)
- ✅ Status immutability after completion (read-only after COMPLETED)
- ✅ Organization isolation (Authority only sees own tenders)
- ✅ L1 calculation explicit and auditable
- ✅ No hidden automation or background processes

## Future Enhancements (Out of Scope)

Potential features for future versions:
- Financial comparison table with L1 highlighting
- Evaluation history/audit logs
- Multi-stage evaluation (Technical, Financial, Administrative)
- Parallel evaluation by multiple evaluators
- PDF export of evaluation reports
- Evaluation templates and scoring rubrics
- Category-wise bid analysis
- Percentage-based qualification thresholds
