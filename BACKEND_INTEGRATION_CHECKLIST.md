# Backend Schema Integration Checklist

## 📊 Required Database Schema Updates

The refactored Tender Creation feature introduces new fields that may require backend schema updates. This document outlines what needs to be verified and potentially updated.

---

## 🗄️ Table: `tender`

### Current Expected Columns:
- `tender_id` (PRIMARY KEY)
- `organization_id` (FOREIGN KEY)
- `title` (VARCHAR)
- `description` (TEXT)
- `status` (ENUM: DRAFT, PUBLISHED)
- `submission_deadline` (TIMESTAMP)
- `estimated_value` (DECIMAL) ✅ Already exists
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### New Columns Needed:

```sql
-- Add these columns to the tender table

ALTER TABLE tender
ADD COLUMN authority_name VARCHAR(255),
ADD COLUMN reference_id VARCHAR(100) UNIQUE,
ADD COLUMN tender_type VARCHAR(100),
ADD COLUMN submission_start_date TIMESTAMP;

-- Add index for reference_id (frequently searched)
CREATE INDEX idx_tender_reference_id ON tender(reference_id);

-- Add constraint to ensure dates are logical
ALTER TABLE tender
ADD CONSTRAINT chk_submission_dates 
CHECK (submission_deadline > submission_start_date);
```

### Field Descriptions:

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `authority_name` | VARCHAR(255) | Yes | Name of issuing authority/department | "Public Works Department" |
| `reference_id` | VARCHAR(100) | Yes | Unique tender reference ID | "TND-202601-1234" |
| `tender_type` | VARCHAR(100) | Yes | Type/category of tender | "Open Tender", "RFP", "RFQ" |
| `submission_start_date` | TIMESTAMP | Yes | When submissions open | 2026-02-01 00:00:00 |

---

## 🗄️ Table: `tender_section`

### Current Expected Columns:
- `section_id` (PRIMARY KEY)
- `tender_id` (FOREIGN KEY)
- `title` (VARCHAR)
- `order_index` (INT)
- `is_mandatory` (BOOLEAN)
- `created_at` (TIMESTAMP)

### New Columns Needed:

```sql
-- Add these columns to the tender_section table

ALTER TABLE tender_section
ADD COLUMN content TEXT,
ADD COLUMN section_key VARCHAR(100),
ADD COLUMN description TEXT;

-- Add index for section_key
CREATE INDEX idx_section_key ON tender_section(section_key);
```

### Field Descriptions:

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `content` | TEXT | No | Actual content of the section | "Supply and installation of..." |
| `section_key` | VARCHAR(100) | No | Unique identifier for section type | "scope_of_work", "eligibility_criteria" |
| `description` | TEXT | No | Helper text describing the section | "Define the complete scope..." |

---

## 🔧 Backend Service Updates

### File: `server/src/services/tender.service.js`

#### 1. `createTender()` - Update to accept new fields

**Current:**
```javascript
async createTender(data, user) {
  const { title, description, submission_deadline } = data;
  // ...
}
```

**Required:**
```javascript
async createTender(data, user) {
  const { 
    title, 
    description, 
    submission_deadline,
    authority_name,       // NEW
    reference_id,         // NEW
    tender_type,          // NEW
    estimated_value,      // NEW
    submission_start_date // NEW
  } = data;

  // Validate new fields
  if (!authority_name || !reference_id || !tender_type) {
    throw new Error('Missing required fields');
  }

  const result = await pool.query(
    `INSERT INTO tender (
      organization_id, 
      title, 
      description, 
      submission_deadline,
      authority_name,
      reference_id,
      tender_type,
      estimated_value,
      submission_start_date,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      user.organizationId, 
      title, 
      description, 
      submission_deadline,
      authority_name,
      reference_id,
      tender_type,
      estimated_value,
      submission_start_date,
      'DRAFT'
    ]
  );

  return result.rows[0];
}
```

---

#### 2. `updateTender()` - Update to accept new fields

**Add to update logic:**
```javascript
async updateTender(tenderId, data, user) {
  // ... existing checks ...

  const { 
    title, 
    description, 
    submission_deadline,
    authority_name,       // NEW
    reference_id,         // NEW
    tender_type,          // NEW
    estimated_value,      // NEW
    submission_start_date // NEW
  } = data;

  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    values.push(title);
  }
  if (description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(description);
  }
  if (submission_deadline !== undefined) {
    updates.push(`submission_deadline = $${paramIndex++}`);
    values.push(submission_deadline);
  }
  // NEW FIELDS
  if (authority_name !== undefined) {
    updates.push(`authority_name = $${paramIndex++}`);
    values.push(authority_name);
  }
  if (reference_id !== undefined) {
    updates.push(`reference_id = $${paramIndex++}`);
    values.push(reference_id);
  }
  if (tender_type !== undefined) {
    updates.push(`tender_type = $${paramIndex++}`);
    values.push(tender_type);
  }
  if (estimated_value !== undefined) {
    updates.push(`estimated_value = $${paramIndex++}`);
    values.push(estimated_value);
  }
  if (submission_start_date !== undefined) {
    updates.push(`submission_start_date = $${paramIndex++}`);
    values.push(submission_start_date);
  }

  // ... rest of update logic
}
```

---

#### 3. `getTender()` - Return new fields

**Update SELECT query:**
```sql
SELECT 
  t.tender_id, 
  t.organization_id, 
  t.title, 
  t.description, 
  t.status, 
  t.submission_deadline,
  t.authority_name,           -- NEW
  t.reference_id,             -- NEW
  t.tender_type,              -- NEW
  t.estimated_value,
  t.submission_start_date,    -- NEW
  t.created_at,
  o.name as organization_name
FROM tender t
JOIN organization o ON t.organization_id = o.organization_id
WHERE t.tender_id = $1
```

---

#### 4. `addSection()` - Accept new fields

**Current:**
```javascript
async addSection(tenderId, data, user) {
  const { title, is_mandatory } = data;
  // ...
}
```

**Required:**
```javascript
async addSection(tenderId, data, user) {
  const { 
    title, 
    is_mandatory,
    content,       // NEW
    section_key,   // NEW
    description    // NEW
  } = data;

  const result = await pool.query(
    `INSERT INTO tender_section (
      tender_id, 
      title, 
      is_mandatory, 
      order_index,
      content,
      section_key,
      description
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      tenderId, 
      title, 
      is_mandatory, 
      orderIndex,
      content || null,
      section_key || null,
      description || null
    ]
  );

  return result.rows[0];
}
```

---

#### 5. `updateSection()` - Accept new fields

**Add to update logic:**
```javascript
async updateSection(sectionId, data, user) {
  // ... existing checks ...

  const { 
    title, 
    is_mandatory,
    content,       // NEW
    description    // NEW
  } = data;

  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    values.push(title);
  }
  if (is_mandatory !== undefined) {
    updates.push(`is_mandatory = $${paramIndex++}`);
    values.push(is_mandatory);
  }
  // NEW FIELDS
  if (content !== undefined) {
    updates.push(`content = $${paramIndex++}`);
    values.push(content);
  }
  if (description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(description);
  }

  // ... rest of update logic
}
```

---

## 📝 Database Migration Script

### Create a new migration file:

**File:** `server/src/db/migrations/006_tender_creation_enhancements.js`

```javascript
export const up = async (client) => {
  // Add new columns to tender table
  await client.query(`
    ALTER TABLE tender
    ADD COLUMN IF NOT EXISTS authority_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tender_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS submission_start_date TIMESTAMP;
  `);

  // Add unique constraint to reference_id
  await client.query(`
    ALTER TABLE tender
    ADD CONSTRAINT unique_reference_id UNIQUE (reference_id);
  `);

  // Add index for faster lookups
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_tender_reference_id 
    ON tender(reference_id);
  `);

  // Add check constraint for dates
  await client.query(`
    ALTER TABLE tender
    ADD CONSTRAINT chk_submission_dates 
    CHECK (submission_deadline > submission_start_date);
  `);

  // Add new columns to tender_section table
  await client.query(`
    ALTER TABLE tender_section
    ADD COLUMN IF NOT EXISTS content TEXT,
    ADD COLUMN IF NOT EXISTS section_key VARCHAR(100),
    ADD COLUMN IF NOT EXISTS description TEXT;
  `);

  // Add index for section_key
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_section_key 
    ON tender_section(section_key);
  `);

  console.log('✅ Migration 006: Tender creation enhancements applied');
};

export const down = async (client) => {
  // Remove constraints first
  await client.query(`
    ALTER TABLE tender
    DROP CONSTRAINT IF EXISTS unique_reference_id,
    DROP CONSTRAINT IF EXISTS chk_submission_dates;
  `);

  // Drop indexes
  await client.query(`
    DROP INDEX IF EXISTS idx_tender_reference_id;
    DROP INDEX IF EXISTS idx_section_key;
  `);

  // Remove columns from tender
  await client.query(`
    ALTER TABLE tender
    DROP COLUMN IF EXISTS authority_name,
    DROP COLUMN IF EXISTS reference_id,
    DROP COLUMN IF EXISTS tender_type,
    DROP COLUMN IF EXISTS submission_start_date;
  `);

  // Remove columns from tender_section
  await client.query(`
    ALTER TABLE tender_section
    DROP COLUMN IF EXISTS content,
    DROP COLUMN IF EXISTS section_key,
    DROP COLUMN IF EXISTS description;
  `);

  console.log('✅ Migration 006: Rollback completed');
};
```

---

## 🧪 Testing the Backend Changes

### 1. Create Migration
```bash
cd server
npm run migrate
```

### 2. Test Create Tender
```bash
# Use Postman or curl to test
POST /api/tenders
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Test Tender",
  "description": "Test description for tender",
  "authority_name": "Test Department",
  "reference_id": "TND-202601-TEST",
  "tender_type": "Open Tender",
  "estimated_value": 1000000,
  "submission_start_date": "2026-02-01T00:00:00Z",
  "submission_deadline": "2026-03-01T00:00:00Z"
}
```

### 3. Test Add Section with Content
```bash
POST /api/tenders/:tenderId/sections
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Scope of Work",
  "is_mandatory": true,
  "content": "This is the scope of work content...",
  "section_key": "scope_of_work",
  "description": "Define the complete scope, deliverables, and work requirements"
}
```

### 4. Test Get Tender
```bash
GET /api/tenders/:tenderId
Authorization: Bearer <token>

# Verify response includes new fields:
# - authority_name
# - reference_id
# - tender_type
# - submission_start_date
# - sections[].content
# - sections[].section_key
# - sections[].description
```

---

## ✅ Verification Checklist

### Database Schema:
- [ ] `tender` table has new columns
- [ ] `tender_section` table has new columns
- [ ] Unique constraint on `reference_id`
- [ ] Check constraint on dates
- [ ] Indexes created

### Backend Services:
- [ ] `createTender()` accepts and stores new fields
- [ ] `updateTender()` updates new fields
- [ ] `getTender()` returns new fields
- [ ] `addSection()` stores content and metadata
- [ ] `updateSection()` updates content

### API Responses:
- [ ] Create tender returns all fields
- [ ] Get tender returns all fields
- [ ] Section objects include content

### Data Validation:
- [ ] Required fields enforced
- [ ] Date validation works
- [ ] Reference ID uniqueness enforced
- [ ] Content length limits (if any)

---

## 🚨 Rollback Plan

If issues arise after deployment:

1. **Disable new fields in frontend:**
   ```javascript
   // In StepBasicInfo.jsx, comment out new fields temporarily
   // Use old minimal payload
   ```

2. **Rollback migration:**
   ```bash
   npm run migrate:rollback
   ```

3. **Revert service changes:**
   ```bash
   git revert <commit-hash>
   ```

---

## 📞 Support Contacts

If backend schema updates needed:
- Review this document with backend developer
- Coordinate deployment with database migration
- Test thoroughly on staging before production

**Priority:** HIGH - Feature depends on these schema updates

---

**Last Updated:** January 14, 2026  
**Status:** Pending Backend Implementation
