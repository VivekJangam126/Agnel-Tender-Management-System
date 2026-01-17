# Reviewer Implementation Analysis & Fix Plan

## Current State

### What's Working ✓
- Role middleware (`requireRole`) for REVIEWER routing
- Section assignment schema with EDIT/READ_AND_COMMENT permissions
- Reviewer routes with basic permission checks
- Section permission middleware exists

### What's BROKEN ✗

1. **Incomplete Role Support**
   - COMMENTER role is NOT in database or routes
   - Migration 016 only added REVIEWER, not COMMENTER

2. **Role-based Access Control (WRONG)**
   - Routes use `requireRole('REVIEWER')` - this blocks COMMENTER
   - Routes should NOT check role, only section permission
   - Multiple routes have this problem

3. **AI Drafting is UNRESTRICTED**
   - AI draft endpoint has `requireSectionPermission('EDIT')` - GOOD
   - But NO explicit 403 response with clear message
   - No protection at AI service layer

4. **Reviewer Routes Need Access by BOTH Roles**
   - `/api/reviewer/*` routes force REVIEWER role
   - COMMENTER users get 403 "Forbidden"
   - Should use shared dashboard or different auth approach

5. **Comment Routes Not Fully Implemented**
   - No explicit comment routes in reviewer.routes.js
   - Comment functionality exists but not scoped to roles

## Required Fixes

### 1. Database Schema (Migration)
- Add COMMENTER to user role constraint
- Keep permission table (proposal_collaborator) as-is

### 2. Role Middleware
- Keep `requireRole` for dashboard routing only
- Remove from section access endpoints

### 3. Reviewer Routes
- Remove `requireRole('REVIEWER')` from section endpoints
- Use `requireSectionPermission` middleware instead
- Allow BOTH REVIEWER and COMMENTER to access

### 4. AI Service Protection
- Add explicit permission check in AI endpoint
- Return 403 with message: "You have comment-only access to this section."
- Check at SERVICE layer, not just middleware

### 5. Comment Routes
- Create comment endpoints in collaboration.routes.js
- Gate with section permission
- Allow EDIT and READ_AND_COMMENT users

## Implementation Order
1. Migration for COMMENTER role
2. Update reviewer.routes.js to use section permission
3. Add explicit AI permission guard
4. Create comment endpoints
5. Update collaboration dashboard to show both roles

