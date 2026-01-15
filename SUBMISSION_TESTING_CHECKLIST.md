# Proposal Submission Validation: Testing Checklist

Use this checklist to verify all submission validation and read-only locking features are working.

## ✅ Pre-Testing Setup

- [ ] Database migrations run: `npm run migrate` (backend directory)
- [ ] Backend running: `npm run dev` (backend directory)
- [ ] Frontend running: `npm run dev` (client directory)
- [ ] Test account created with BIDDER role
- [ ] Test tender with mandatory sections created

---

## 🧪 Test 1: Basic Submission Validation

**Objective:** Verify incomplete proposals cannot be submitted

**Setup:**
- [ ] Create new proposal for a tender with 3+ mandatory sections
- [ ] Fill ONLY 1 section with ≥50 characters
- [ ] Leave other mandatory sections empty

**Test Steps:**
1. [ ] Click "Submit Proposal" button
2. [ ] Observe frontend validation alert
3. [ ] Verify alert lists incomplete sections
4. [ ] Alert includes character count for each incomplete section

**Expected Results:**
- ✅ Alert appears: "Incomplete sections detected"
- ✅ Lists: "• Section Title" format
- ✅ User can dismiss alert
- ✅ Proposal remains DRAFT (no submission)
- ✅ Can continue editing

**Pass:** ⬜ PASS / ⬜ FAIL

---

## 🧪 Test 2: Successful Submission

**Objective:** Verify valid proposals can be submitted

**Setup:**
- [ ] Create new proposal
- [ ] Fill ALL mandatory sections with ≥50 characters
- [ ] Verify completion bar shows 100%

**Test Steps:**
1. [ ] Click "Submit Proposal"
2. [ ] Observe frontend validation (should pass silently)
3. [ ] See final confirmation dialog
4. [ ] Dialog shows warning about locking
5. [ ] Click "Continue" to confirm

**Expected Results:**
- ✅ Success alert: "✅ Proposal Submitted Successfully!"
- ✅ Status changes to SUBMITTED
- ✅ Lock banner appears (amber)
- ✅ Editor becomes disabled/read-only
- ✅ Redirects to proposal list after 1.5 seconds

**Backend Verification:**
- ✅ submitted_at timestamp set in database
- ✅ status = 'SUBMITTED' in database
- ✅ Check via: `SELECT status, submitted_at FROM proposal WHERE proposal_id = '...'`

**Pass:** ⬜ PASS / ⬜ FAIL

---

## 🧪 Test 3: Read-Only After Submission

**Objective:** Verify submitted proposals cannot be edited

**Setup:**
- [ ] Successfully submit a proposal (from Test 2)
- [ ] Remain on proposal workspace page
- [ ] Observe lock banner

**Test Steps:**
1. [ ] Verify lock banner is visible and prominent (amber)
2. [ ] Check banner text: "🔒 Proposal Submitted & Locked"
3. [ ] Try to click in editor text area
4. [ ] Verify input field is disabled (cannot type)
5. [ ] Try to use AI Advisor panel
6. [ ] Verify analysis button is disabled

**Expected Results:**
- ✅ Lock banner visible with submission timestamp
- ✅ Editor input completely disabled (readOnly attribute)
- ✅ Cannot select or modify text
- ✅ Cannot click AI Advisor buttons
- ✅ "Back to List" button available and functional

**Pass:** ⬜ PASS / ⬜ FAIL

---

## 🧪 Test 4: Hard Lock via API (Bypass Test)

**Objective:** Verify backend locks submitted proposals even if frontend is bypassed

**Setup:**
- [ ] Successfully submit a proposal
- [ ] Keep browser open to that proposal
- [ ] Note the proposal ID from URL

**Test Steps:**
1. [ ] Open browser developer console (F12)
2. [ ] Go to Network or Console tab
3. [ ] Attempt manual API call:
   ```javascript
   fetch('/api/bidder/proposals/PROPOSAL_ID/sections/SECTION_ID', {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ content: 'New content here' })
   }).then(r => r.json()).then(console.log)
   ```
4. [ ] Observe response in console

**Expected Results:**
- ✅ Response status: 403 (Forbidden)
- ✅ Response body contains: `"error": "Proposal locked"`
- ✅ No content is actually modified
- ✅ Database unchanged

**Verify in Database:**
```sql
SELECT content FROM proposal_section_response 
WHERE proposal_id = 'PROPOSAL_ID' AND section_id = 'SECTION_ID';
-- Should show original content, not "New content here"
```

**Pass:** ⬜ PASS / ⬜ FAIL

---

## 🧪 Test 5: Refresh Page Persistence

**Objective:** Verify submitted state persists after page refresh

**Setup:**
- [ ] Successfully submit a proposal
- [ ] Lock banner should be visible

**Test Steps:**
1. [ ] Press F5 to refresh page
2. [ ] Wait for page to reload and fetch data
3. [ ] Observe proposal data loaded
4. [ ] Check status still shows SUBMITTED
5. [ ] Verify lock banner reappears
6. [ ] Check editor is still disabled

**Expected Results:**
- ✅ Status fetched correctly: SUBMITTED
- ✅ Lock banner appears immediately
- ✅ Editor disabled
- ✅ submitted_at timestamp visible in banner
- ✅ No flashing or confusion about state

**Pass:** ⬜ PASS / ⬜ FAIL

---

## 🧪 Test 6: AI Analysis Lock

**Objective:** Verify AI analysis is blocked on submitted proposals

**Setup:**
- [ ] Successfully submit a proposal
- [ ] Lock banner visible
- [ ] AI Advisor panel visible

**Test Steps:**
1. [ ] Try to click "Analyze" button or quick action buttons
2. [ ] Verify buttons are disabled
3. [ ] Attempt manual API call to analysis endpoint:
   ```javascript
   fetch('/api/bidder/proposals/ID/sections/SEC_ID/analyze', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ 
       draftContent: 'test',
       sectionType: 'TECHNICAL' 
     })
   }).then(r => r.json()).then(console.log)
   ```

**Expected Results:**
- ✅ Analysis buttons disabled in UI
- ✅ API response: 403 "Proposal locked"
- ✅ No AI analysis returned
- ✅ No fallback analysis initiated

**Pass:** ⬜ PASS / ⬜ FAIL

---

## 🧪 Test 7: Proposal List Shows Status

**Objective:** Verify submitted proposals show correct status in list

**Setup:**
- [ ] Submit multiple proposals
- [ ] Navigate to proposal list (/bidder/proposal-drafting)

**Test Steps:**
1. [ ] Find submitted proposal in list
2. [ ] Check status shows "SUBMITTED"
3. [ ] Compare with DRAFT proposals
4. [ ] Verify status column clearly distinguishes them
5. [ ] Try to click submitted proposal
6. [ ] Verify it opens with lock banner

**Expected Results:**
- ✅ Status correctly displayed: SUBMITTED
- ✅ Visual distinction from DRAFT proposals
- ✅ Opening submitted proposal shows lock banner
- ✅ Editor disabled for submitted proposals

**Pass:** ⬜ PASS / ⬜ FAIL

---

## 🧪 Test 8: Database Validation

**Objective:** Verify database changes were applied correctly

**Test Steps:**
1. [ ] Connect to PostgreSQL database
2. [ ] Check proposal table schema:
   ```sql
   \d proposal
   -- Should show: submitted_at, updated_at columns
   ```
3. [ ] Check constraints:
   ```sql
   SELECT constraint_name, constraint_type 
   FROM information_schema.table_constraints 
   WHERE table_name = 'proposal';
   ```
4. [ ] Verify status values:
   ```sql
   SELECT DISTINCT status FROM proposal;
   -- Should include: DRAFT, SUBMITTED
   ```
5. [ ] Check indexes:
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'proposal';
   -- Should have: idx_proposal_status, idx_proposal_organization
   ```

**Expected Results:**
- ✅ submitted_at column exists (TIMESTAMP type)
- ✅ updated_at column exists (TIMESTAMP type)
- ✅ Status check constraint includes SUBMITTED
- ✅ Indexes created for performance
- ✅ No migration errors in server logs

**Pass:** ⬜ PASS / ⬜ FAIL

---

## 🧪 Test 9: Error Message Detail

**Objective:** Verify incomplete submission shows detailed feedback

**Setup:**
- [ ] Create new proposal
- [ ] Fill some sections with <50 chars
- [ ] Note which sections are incomplete

**Test Steps:**
1. [ ] Click Submit
2. [ ] Observe alert message
3. [ ] Check it lists each incomplete section by name
4. [ ] Verify character counts shown (e.g., "23 / 50 chars")
5. [ ] Dismiss alert
6. [ ] Complete one incomplete section
7. [ ] Try Submit again
8. [ ] Verify alert updates to show fewer incomplete sections

**Expected Results:**
- ✅ Alert lists incomplete sections by title
- ✅ Shows character count for each
- ✅ Format: "• Section Title (X / 50 characters)"
- ✅ Alert updates if you fix sections and retry
- ✅ Clear guidance on what needs fixing

**Pass:** ⬜ PASS / ⬜ FAIL

---

## 🧪 Test 10: Confirmation Dialog

**Objective:** Verify submission confirmation is clear and functional

**Setup:**
- [ ] Have complete proposal ready to submit

**Test Steps:**
1. [ ] Click Submit
2. [ ] Observe confirmation dialog
3. [ ] Read warning text carefully
4. [ ] Verify lists consequences:
   - Your proposal will be locked
   - You CANNOT edit it anymore
   - It will be sent for evaluation
5. [ ] Click "Continue" - submission should proceed
6. [ ] Test "Cancel" - should dismiss dialog and stay on page
7. [ ] Try Submit again - should show confirmation again

**Expected Results:**
- ✅ Dialog clearly warns about locking
- ✅ Lists all consequences
- ✅ "Continue" proceeds with submission
- ✅ "Cancel" dismisses without submitting
- ✅ Dialog appears every time (not skipped)

**Pass:** ⬜ PASS / ⬜ FAIL

---

## 📊 Summary

**Total Tests:** 10  
**Tests Passed:** ____/10  

**Critical Tests (must all pass):**
- [ ] Test 2: Successful Submission
- [ ] Test 3: Read-Only After Submission  
- [ ] Test 4: Hard Lock via API
- [ ] Test 8: Database Validation

**Overall Status:**
- [ ] ✅ All tests passed → **PRODUCTION READY**
- [ ] ⚠️ Some tests failed → **NEEDS FIXES** (list below)
- [ ] ❌ Critical tests failed → **BLOCKING ISSUES** (list below)

---

## 📝 Issues Found

### Critical Issues (Blocking)
1. _____________________
2. _____________________

### Non-Critical Issues (Can fix later)
1. _____________________
2. _____________________

---

## ✅ Sign-Off

**Tested By:** _______________________  
**Date:** _______________________  
**Environment:** Development / Staging / Production  
**Conclusion:** _______________________

---

## 📞 Troubleshooting

If tests fail, check:

1. **Migrations not applied:**
   ```bash
   cd server
   npm run migrate
   ```

2. **Frontend not showing lock:**
   - Check browser console for errors
   - Verify `proposal?.status === 'SUBMITTED'` is true
   - Hard refresh (Ctrl+Shift+R)

3. **Backend not locking:**
   - Check server logs for "Proposal locked" messages
   - Verify migration added status column
   - Test API directly via curl/Postman

4. **Database issues:**
   - Verify columns: `\d proposal`
   - Check constraints: `\d+ proposal`
   - Reset if needed: Re-run migrations

---

**For questions, refer to:** `PROPOSAL_SUBMISSION_VALIDATION.md`
