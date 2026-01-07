# Tender Management Workflow

## Typical AUTHORITY Workflow

### 1. Create a Draft Tender
```bash
POST /api/tenders
{
  "title": "Infrastructure Project",
  "description": "Detailed description...",
  "submission_deadline": "2026-06-01T23:59:59Z"
}
→ Status: DRAFT
→ Returns: tender_id
```

### 2. Add Sections
```bash
POST /api/tenders/{tender_id}/sections
{ "title": "Section 1", "is_mandatory": true }

POST /api/tenders/{tender_id}/sections
{ "title": "Section 2", "is_mandatory": true }

POST /api/tenders/{tender_id}/sections
{ "title": "Section 3", "is_mandatory": false }
```

### 3. (Optional) Reorder Sections
```bash
PUT /api/tenders/{tender_id}/sections/order
{
  "orderedSectionIds": [
    "section-2-id",
    "section-1-id",
    "section-3-id"
  ]
}
```

### 4. (Optional) Update Tender/Sections
```bash
PUT /api/tenders/{tender_id}
{ "title": "Updated Title" }

PUT /api/tenders/sections/{section_id}
{ "title": "Updated Section Title" }
```

### 5. Publish Tender
```bash
POST /api/tenders/{tender_id}/publish
→ Status: DRAFT → PUBLISHED
→ Tender becomes immutable
→ Visible to BIDDER users
```

### 6. (Optional) Delete Draft Section
```bash
DELETE /api/tenders/sections/{section_id}
# Only works if tender is DRAFT
```

---

## Typical BIDDER Workflow

### 1. Browse Published Tenders
```bash
GET /api/tenders/{tender_id}
# Only works if status = PUBLISHED
# Returns tender with all sections
```

### 2. Read Tender Details
- View title, description, deadline
- See all sections (mandatory/optional)
- Check organization info

### 3. Create Proposal (Phase 4 - Coming Soon)
```bash
# Future endpoint
POST /api/proposals
{
  "tender_id": "{tender_id}"
}
```

---

## State Transitions

```
┌─────────────┐
│   CREATE    │  AUTHORITY creates tender
│   TENDER    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    DRAFT    │  ← Can edit, add sections, update
│   STATUS    │  ← Only visible to creator
└──────┬──────┘
       │
       │  (Publish action)
       │  (Must have ≥1 section)
       │
       ▼
┌─────────────┐
│  PUBLISHED  │  ← Immutable
│   STATUS    │  ← Visible to all BIDDERS
└─────────────┘
```

---

## Validation Rules

### Creating a Tender
✅ title required (non-empty)  
✅ description required (non-empty)  
✅ submission_deadline required (valid timestamp)  
✅ Must be AUTHORITY role  
✅ organizationId taken from JWT  

### Updating a Tender
✅ Tender must exist  
✅ Tender must belong to user's organization  
✅ Tender status must be DRAFT  
✅ At least one field to update  

### Publishing a Tender
✅ Tender must exist  
✅ Tender must belong to user's organization  
✅ Tender status must be DRAFT  
✅ Tender must have at least 1 section  

### Adding a Section
✅ Tender must exist  
✅ Tender must belong to user's organization  
✅ Tender status must be DRAFT  
✅ Section title required  

### Reordering Sections
✅ Tender must exist  
✅ Tender must belong to user's organization  
✅ Tender status must be DRAFT  
✅ All section IDs must belong to the tender  
✅ orderedSectionIds must be an array  

---

## Common Error Scenarios

### Error: "Tender not found" (404)
**Cause:** Invalid tender_id or user doesn't have access  
**Solution:** Check tender_id, verify user role and organization  

### Error: "Cannot update published tender" (403)
**Cause:** Trying to edit a PUBLISHED tender  
**Solution:** Tenders are immutable after publishing  

### Error: "Unauthorized: Tender belongs to another organization" (403)
**Cause:** User trying to access another org's tender  
**Solution:** Users can only manage their own organization's tenders  

### Error: "Cannot publish tender without sections" (403)
**Cause:** Trying to publish a tender with 0 sections  
**Solution:** Add at least one section before publishing  

### Error: "Forbidden" (403)
**Cause:** BIDDER trying to create/update tenders  
**Solution:** Only AUTHORITY users can manage tenders  

---

## Quick Reference: HTTP Methods

| Method | Endpoint | AUTHORITY | BIDDER | Idempotent |
|--------|----------|-----------|--------|------------|
| POST | /tenders | ✅ Create | ❌ | No |
| PUT | /tenders/:id | ✅ Update DRAFT | ❌ | Yes |
| GET | /tenders/:id | ✅ Own tenders | ✅ Published only | Yes |
| POST | /tenders/:id/publish | ✅ Publish | ❌ | Yes |
| POST | /tenders/:id/sections | ✅ Add | ❌ | No |
| PUT | /sections/:id | ✅ Update | ❌ | Yes |
| DELETE | /sections/:id | ✅ Delete | ❌ | Yes |
| PUT | /tenders/:id/sections/order | ✅ Reorder | ❌ | Yes |

---

## Database Queries (Service Layer)

### Create Tender
```sql
INSERT INTO tender (organization_id, title, description, submission_deadline, status)
VALUES ($1, $2, $3, $4, 'DRAFT')
RETURNING *;
```

### Get Tender (AUTHORITY)
```sql
SELECT t.*, o.name as organization_name
FROM tender t
JOIN organization o ON t.organization_id = o.organization_id
WHERE t.tender_id = $1 AND t.organization_id = $2;
```

### Get Tender (BIDDER)
```sql
SELECT t.*, o.name as organization_name
FROM tender t
JOIN organization o ON t.organization_id = o.organization_id
WHERE t.tender_id = $1 AND t.status = 'PUBLISHED';
```

### Get Sections
```sql
SELECT *
FROM tender_section
WHERE tender_id = $1
ORDER BY order_index ASC;
```

### Publish Tender
```sql
UPDATE tender
SET status = 'PUBLISHED'
WHERE tender_id = $1
RETURNING *;
```

---

## Testing Checklist

- [ ] AUTHORITY can create tender
- [ ] BIDDER cannot create tender
- [ ] AUTHORITY can update DRAFT tender
- [ ] AUTHORITY cannot update PUBLISHED tender
- [ ] AUTHORITY can see own DRAFT tender
- [ ] BIDDER cannot see DRAFT tender
- [ ] BIDDER can see PUBLISHED tender
- [ ] AUTHORITY can add sections to DRAFT
- [ ] AUTHORITY cannot add sections to PUBLISHED
- [ ] AUTHORITY can update sections (DRAFT only)
- [ ] AUTHORITY can delete sections (DRAFT only)
- [ ] AUTHORITY can reorder sections (DRAFT only)
- [ ] AUTHORITY can publish tender (with sections)
- [ ] AUTHORITY cannot publish tender without sections
- [ ] AUTHORITY cannot access other org's tenders
- [ ] All endpoints require authentication
- [ ] Invalid tender IDs return 404
- [ ] Missing fields return 400

---

## Performance Considerations

### Indexing Recommendations
```sql
-- For faster tender lookups by organization
CREATE INDEX idx_tender_organization ON tender(organization_id);

-- For faster tender lookups by status
CREATE INDEX idx_tender_status ON tender(status);

-- For faster section ordering
CREATE INDEX idx_section_tender_order ON tender_section(tender_id, order_index);
```

### Pagination (Future Enhancement)
```sql
-- List tenders with pagination
SELECT * FROM tender
WHERE organization_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

---

## Security Best Practices

✅ **Never trust frontend** - All validation happens server-side  
✅ **Check organization ownership** - Every mutation verifies ownership  
✅ **Enforce immutability** - Published tenders cannot be changed  
✅ **Use parameterized queries** - Prevent SQL injection  
✅ **Validate UUIDs** - PostgreSQL rejects invalid UUIDs  
✅ **JWT in headers** - Not in URL or query params  
✅ **Return minimal data** - Only necessary fields in responses  

---

## Next Phase Preview

### Phase 4: Proposal Management
- BIDDER creates proposals for published tenders
- Each proposal has sections matching tender sections
- Proposals start in DRAFT, can be submitted
- AUTHORITY can view submitted proposals

### Upcoming Endpoints
```
POST   /api/proposals                  (BIDDER)
GET    /api/proposals/:id              (BIDDER/AUTHORITY)
PUT    /api/proposals/:id              (BIDDER - DRAFT only)
POST   /api/proposals/:id/submit       (BIDDER)
POST   /api/proposals/:id/sections     (BIDDER)
GET    /api/tenders/:id/proposals      (AUTHORITY)
```
