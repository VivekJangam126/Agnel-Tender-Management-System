# Reviewer/Commenter Implementation - COMPLETED

## Summary of Changes

### 1. ✅ Database Migration (Migration 017)
- Added COMMENTER to user role constraint
- Now supports: AUTHORITY, BIDDER, REVIEWER, COMMENTER
- File: `server/src/db/migrations/017_add_commenter_role.sql`

### 2. ✅ Reviewer Routes Refactored (`server/src/routes/reviewer.routes.js`)

**Removed Role Gating:**
- Removed `requireRole('REVIEWER')` from all endpoints
- Routes now work for BOTH REVIEWER and COMMENTER roles
- Endpoints affected:
  - GET `/assignments` - List user's section assignments
  - GET `/proposals/:proposalId/sections/:sectionId` - View platform tender section
  - PUT `/proposals/:proposalId/sections/:sectionId` - Edit platform tender section
  - GET `/uploaded-tenders/:uploadedTenderId/sections/:sectionKey` - View uploaded tender section
  - PUT `/uploaded-tenders/:uploadedTenderId/sections/:sectionKey` - Edit uploaded tender section

**Permission Logic Updated:**
- All endpoints now check `proposal_collaborator.permission` or `uploaded_proposal_collaborator.permission`
- Error messages clarified:
  - "You have comment-only access to this section" for READ_AND_COMMENT users attempting edit
  - "You are not assigned to this section" for unauthorized access

**New Comment Endpoints Added:**
- GET `/proposals/:proposalId/sections/:sectionId/comments` - Fetch section comments
- POST `/proposals/:proposalId/sections/:sectionId/comments` - Create comment
- GET `/uploaded-tenders/:uploadedTenderId/sections/:sectionKey/comments` - Fetch uploaded section comments
- POST `/uploaded-tenders/:uploadedTenderId/sections/:sectionKey/comments` - Create comment

All comment endpoints validate:
- User is assigned to section
- User has EDIT or READ_AND_COMMENT permission

### 3. ✅ AI Draft Routes Protected (`server/src/routes/collaboration.routes.js`)

**Enhanced AI Protection:**
- Platform: POST `/proposals/:id/sections/:sectionId/generate-draft`
- Uploaded: POST `/uploaded-tenders/:uploadedTenderId/sections/:sectionKey/generate-draft`

**Double-check at route level:**
- Even after middleware passes, route validates `req.sectionPermission`
- Returns 403 with clear message: "You have comment-only access to this section. AI drafting is only available with edit permission."
- Prevents READ_AND_COMMENT users from accessing AI

### 4. ✅ Permission Service (No Changes Needed)
- Already properly checks section assignments only
- `PermissionService.canUseAI()` checks EDIT permission
- Never uses user.role for permission decisions
- Status: ✓ CORRECT as-is

### 5. ✅ Section Permission Middleware (No Changes Needed)
- Already validates section assignments
- Checks EDIT vs READ_AND_COMMENT properly
- Error messages are clear
- Status: ✓ CORRECT as-is

## Permission Model (FINAL)

```
ROLES (Internal, Dashboard Routing Only):
├── AUTHORITY
├── BIDDER
├── REVIEWER      ← Internal
└── COMMENTER     ← Internal

SECTION PERMISSIONS (Database, Access Control):
├── OWNER         (User's organization owns proposal)
├── EDIT          (Can edit + comment + AI assist)
├── READ_AND_COMMENT  (Can comment, no edit/AI)
└── READ_ONLY     (Can view only)
```

## API Permission Rules

| Endpoint | Method | Required Permission | Role Restriction |
|----------|--------|-------------------|------------------|
| `/reviewer/assignments` | GET | None | ✓ Works for REVIEWER & COMMENTER |
| `/reviewer/proposals/:id/sections/:sectionId` | GET | Any assignment | ✓ Works for REVIEWER & COMMENTER |
| `/reviewer/proposals/:id/sections/:sectionId` | PUT | EDIT | ✓ Works for REVIEWER & COMMENTER |
| `/reviewer/proposals/:id/sections/:sectionId/comments` | GET | Any assignment | ✓ Works for REVIEWER & COMMENTER |
| `/reviewer/proposals/:id/sections/:sectionId/comments` | POST | EDIT or READ_AND_COMMENT | ✓ Works for REVIEWER & COMMENTER |
| `/collaboration/.../generate-draft` | POST | EDIT | ✓ Double-checked |
| `/collaboration/.../comments` | GET/POST | EDIT or READ_AND_COMMENT | ✓ Existing (BIDDER only) |

## Edge Cases Handled

1. **Comments without database table** - Graceful 501 error for uploaded tender comments if table doesn't exist
2. **No assignments** - Returns "No sections allotted yet" message
3. **Mixed permissions** - Stats show counts for EDIT and READ_AND_COMMENT separately
4. **Reviewer accessing bidder endpoints** - Separate reviewer routes, no conflict

## Testing Checklist

- [ ] Create REVIEWER user, assign EDIT permission → Can view, edit, comment, use AI
- [ ] Create REVIEWER user, assign READ_AND_COMMENT → Can view and comment, NOT edit or AI
- [ ] Create COMMENTER user, assign EDIT permission → Can view, edit, comment, use AI
- [ ] Create COMMENTER user, assign READ_AND_COMMENT → Can view and comment, NOT edit or AI
- [ ] Unassigned user → 403 "not assigned to this section"
- [ ] AI draft with READ_AND_COMMENT → 403 "comment-only access"
- [ ] Comment with READ_AND_COMMENT → 201 Created ✓
- [ ] Edit with READ_AND_COMMENT → 403 "comment-only access"
- [ ] Empty assignments → "No sections allotted yet"

## Files Modified

1. `server/src/db/migrations/017_add_commenter_role.sql` - NEW
2. `server/src/routes/reviewer.routes.js` - MAJOR REFACTOR
3. `server/src/routes/collaboration.routes.js` - AI protection enhanced
4. `REVIEWER_ANALYSIS.md` - Analysis document

## Files NOT Modified (Correct as-is)

- `server/src/services/permission.service.js`
- `server/src/middlewares/sectionPermission.middleware.js`
- Database schema files (permission tables already correct)
- `server/src/services/collaboration.service.js`
- `server/src/services/comment.service.js`

## Implementation Complete ✓

The system now properly supports BOTH REVIEWER and COMMENTER roles with:
- Role-based dashboard routing
- Section-permission-based access control
- AI drafting only for EDIT permission
- Commenting for both EDIT and READ_AND_COMMENT
- Clear error messages for insufficient permissions
- No role checks in API endpoints (only section permission checks)

