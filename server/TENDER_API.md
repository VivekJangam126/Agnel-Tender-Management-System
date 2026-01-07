# Tender Management APIs - Phase 3

## Implementation Complete ✅

### Features Implemented

1. **Tender CRUD** - Create, update, get, and publish tenders
2. **Section Management** - Add, update, delete, and reorder tender sections
3. **Role-Based Access** - AUTHORITY creates/manages, BIDDER views published only
4. **Status Enforcement** - DRAFT tenders are editable, PUBLISHED are immutable
5. **Organization Isolation** - Users can only manage their own organization's tenders

---

## API Endpoints

### Tender Management

#### 1. POST `/api/tenders` 🔒 AUTHORITY Only

Create a new tender in DRAFT status.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "Road Construction Project",
  "description": "Construction of 5km highway with modern facilities",
  "submission_deadline": "2026-03-01T23:59:59Z"
}
```

**Response (201):**
```json
{
  "tender_id": "uuid",
  "organization_id": "uuid",
  "title": "Road Construction Project",
  "description": "Construction of 5km highway with modern facilities",
  "status": "DRAFT",
  "submission_deadline": "2026-03-01T23:59:59.000Z",
  "created_at": "2026-01-07T10:00:00.000Z"
}
```

---

#### 2. PUT `/api/tenders/:id` 🔒 AUTHORITY Only

Update a tender (only if status = DRAFT).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "submission_deadline": "2026-04-01T23:59:59Z"
}
```

**Response (200):**
```json
{
  "tender_id": "uuid",
  "organization_id": "uuid",
  "title": "Updated Title",
  "description": "Updated description",
  "status": "DRAFT",
  "submission_deadline": "2026-04-01T23:59:59.000Z",
  "created_at": "2026-01-07T10:00:00.000Z"
}
```

**Error Cases:**
- `404` - Tender not found
- `403` - Tender belongs to another organization
- `403` - Cannot update published tender

---

#### 3. GET `/api/tenders/:id` 🔒 AUTHORITY + BIDDER

Get a tender by ID.

**Authorization Rules:**
- **AUTHORITY**: Can access only their own organization's tenders
- **BIDDER**: Can access only PUBLISHED tenders

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "tender_id": "uuid",
  "organization_id": "uuid",
  "title": "Road Construction Project",
  "description": "Construction of 5km highway",
  "status": "PUBLISHED",
  "submission_deadline": "2026-03-01T23:59:59.000Z",
  "created_at": "2026-01-07T10:00:00.000Z",
  "organization_name": "City Municipal Corporation",
  "sections": [
    {
      "section_id": "uuid",
      "tender_id": "uuid",
      "title": "Technical Specifications",
      "order_index": 0,
      "is_mandatory": true,
      "created_at": "2026-01-07T10:05:00.000Z"
    },
    {
      "section_id": "uuid",
      "tender_id": "uuid",
      "title": "Financial Proposal",
      "order_index": 1,
      "is_mandatory": true,
      "created_at": "2026-01-07T10:06:00.000Z"
    }
  ]
}
```

**Error Cases:**
- `404` - Tender not found or user doesn't have access

---

#### 4. POST `/api/tenders/:id/publish` 🔒 AUTHORITY Only

Publish a tender (change status from DRAFT to PUBLISHED).

**Requirements:**
- Tender must be in DRAFT status
- Tender must have at least one section
- User must own the tender

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "tender_id": "uuid",
  "organization_id": "uuid",
  "title": "Road Construction Project",
  "description": "Construction of 5km highway",
  "status": "PUBLISHED",
  "submission_deadline": "2026-03-01T23:59:59.000Z",
  "created_at": "2026-01-07T10:00:00.000Z"
}
```

**Error Cases:**
- `404` - Tender not found
- `403` - Tender belongs to another organization
- `403` - Tender is already published
- `403` - Cannot publish tender without sections

---

### Section Management

#### 5. POST `/api/tenders/:id/sections` 🔒 AUTHORITY Only

Add a section to a tender (only if DRAFT).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "Technical Specifications",
  "is_mandatory": true
}
```

**Response (201):**
```json
{
  "section_id": "uuid",
  "tender_id": "uuid",
  "title": "Technical Specifications",
  "order_index": 0,
  "is_mandatory": true,
  "created_at": "2026-01-07T10:05:00.000Z"
}
```

**Error Cases:**
- `400` - Section title is required
- `404` - Tender not found
- `403` - Cannot add sections to published tender

---

#### 6. PUT `/api/tenders/sections/:id` 🔒 AUTHORITY Only

Update a section (only if tender is DRAFT).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "Updated Section Title",
  "is_mandatory": false
}
```

**Response (200):**
```json
{
  "section_id": "uuid",
  "tender_id": "uuid",
  "title": "Updated Section Title",
  "order_index": 0,
  "is_mandatory": false,
  "created_at": "2026-01-07T10:05:00.000Z"
}
```

**Error Cases:**
- `404` - Section not found
- `403` - Cannot update sections of published tender

---

#### 7. DELETE `/api/tenders/sections/:id` 🔒 AUTHORITY Only

Delete a section (only if tender is DRAFT).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Section deleted successfully"
}
```

**Error Cases:**
- `404` - Section not found
- `403` - Cannot delete sections of published tender

---

#### 8. PUT `/api/tenders/:id/sections/order` 🔒 AUTHORITY Only

Reorder sections (only if tender is DRAFT).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "orderedSectionIds": [
    "uuid-section-2",
    "uuid-section-1",
    "uuid-section-3"
  ]
}
```

**Response (200):**
```json
[
  {
    "section_id": "uuid-section-2",
    "tender_id": "uuid",
    "title": "Financial Proposal",
    "order_index": 0,
    "is_mandatory": true,
    "created_at": "2026-01-07T10:06:00.000Z"
  },
  {
    "section_id": "uuid-section-1",
    "tender_id": "uuid",
    "title": "Technical Specifications",
    "order_index": 1,
    "is_mandatory": true,
    "created_at": "2026-01-07T10:05:00.000Z"
  },
  {
    "section_id": "uuid-section-3",
    "tender_id": "uuid",
    "title": "Experience",
    "order_index": 2,
    "is_mandatory": false,
    "created_at": "2026-01-07T10:07:00.000Z"
  }
]
```

**Error Cases:**
- `400` - orderedSectionIds must be an array
- `404` - Tender not found
- `403` - Cannot reorder sections of published tender
- `403` - Some section IDs do not belong to this tender

---

## Business Rules

### Tender Status Flow

```
DRAFT → PUBLISHED
  ↑         ↓
  ✓    (immutable)
```

- Tenders are created in **DRAFT** status
- Only **DRAFT** tenders can be edited
- Once **PUBLISHED**, tenders become immutable
- No status transitions from PUBLISHED back to DRAFT

### Authorization Matrix

| Action | AUTHORITY (Owner) | AUTHORITY (Other Org) | BIDDER |
|--------|-------------------|----------------------|---------|
| Create Tender | ✅ | ❌ | ❌ |
| Update DRAFT | ✅ | ❌ | ❌ |
| Update PUBLISHED | ❌ | ❌ | ❌ |
| Get Own DRAFT | ✅ | ❌ | ❌ |
| Get PUBLISHED | ✅ | ✅ | ✅ |
| Publish | ✅ | ❌ | ❌ |
| Add Section (DRAFT) | ✅ | ❌ | ❌ |
| Update Section (DRAFT) | ✅ | ❌ | ❌ |
| Delete Section (DRAFT) | ✅ | ❌ | ❌ |
| Reorder Sections (DRAFT) | ✅ | ❌ | ❌ |

### Section Rules

- Sections are ordered by `order_index` (0-based)
- New sections are appended to the end
- Reordering updates all `order_index` values in a transaction
- Deleting a section cascades to `tender_content_chunk` (for future AI features)
- A tender must have **at least 1 section** to be published

---

## Testing

### Run the test suite

```bash
# Start server
npm run dev

# Run tender tests (in another terminal)
node src/db/testTenders.js
```

### Expected Test Results

✅ Tender created successfully  
✅ Bidder correctly forbidden from creating tender  
✅ Tender updated successfully  
✅ Tender retrieved successfully  
✅ Bidder correctly cannot see DRAFT tender  
✅ Section 1 added  
✅ Section 2 added  
✅ Section updated  
✅ Sections reordered  
✅ Tender published successfully  
✅ Published tender correctly immutable  
✅ Cannot add sections to published tender  
✅ Bidder can see published tender  
✅ Cannot delete sections from published tender  

---

## Manual Testing with cURL

### Create a Tender

```bash
curl -X POST http://localhost:5000/api/tenders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {AUTHORITY_TOKEN}" \
  -d '{
    "title": "Road Construction Project",
    "description": "Construction of 5km highway",
    "submission_deadline": "2026-03-01T23:59:59Z"
  }'
```

### Add a Section

```bash
curl -X POST http://localhost:5000/api/tenders/{TENDER_ID}/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {AUTHORITY_TOKEN}" \
  -d '{
    "title": "Technical Specifications",
    "is_mandatory": true
  }'
```

### Publish Tender

```bash
curl -X POST http://localhost:5000/api/tenders/{TENDER_ID}/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {AUTHORITY_TOKEN}"
```

### Get Tender (as BIDDER)

```bash
curl http://localhost:5000/api/tenders/{TENDER_ID} \
  -H "Authorization: Bearer {BIDDER_TOKEN}"
```

---

## Database Schema Reference

### tender table
```sql
CREATE TABLE tender (
    tender_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organization(organization_id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT CHECK (status IN ('DRAFT', 'PUBLISHED')) DEFAULT 'DRAFT',
    submission_deadline TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### tender_section table
```sql
CREATE TABLE tender_section (
    section_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id UUID NOT NULL REFERENCES tender(tender_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    is_mandatory BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Tender retrieved |
| 201 | Created | Tender/section created |
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | Invalid/missing token |
| 403 | Forbidden | Wrong role, wrong org, or published tender |
| 404 | Not Found | Tender/section doesn't exist |
| 500 | Server Error | Database error |

---

## Security Features

✅ **Role-based access control** - AUTHORITY vs BIDDER permissions  
✅ **Organization isolation** - Users can't access other orgs' tenders  
✅ **Immutable published tenders** - Cannot edit after publishing  
✅ **JWT authentication** - All endpoints require valid token  
✅ **Input validation** - Required fields checked  
✅ **SQL injection prevention** - Parameterized queries  
✅ **Transaction safety** - Section reordering uses transactions  

---

## Next Steps

Phase 3 is complete. Ready for:

1. **Phase 4**: Proposal Management (BIDDER creates proposals for published tenders)
2. **Phase 5**: AI Features (Chunking, embeddings, RAG chat)
3. **Phase 6**: Bid Evaluation (AUTHORITY reviews proposals)

---

## Architecture

```
Client Request
    ↓
Routes (tender.routes.js)
    ↓
Middlewares (requireAuth → requireRole)
    ↓
Controllers (tender.controller.js)
    ↓
Services (tender.service.js)
    ↓
Database (PostgreSQL via pg.Pool)
```

All business logic is in the **service layer** for testability and reusability.
