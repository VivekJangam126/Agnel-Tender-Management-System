# AI Fallback Testing Checklist

Use this checklist to verify the fallback mechanism is working correctly.

## ✅ Pre-Testing Setup

- [ ] Backend server is running (`npm run dev` in server/)
- [ ] Frontend is running (`npm run dev` in client/)
- [ ] You have access to proposal drafting workspace
- [ ] You can modify server/.env file

---

## 🧪 Test 1: Normal Operation (AI Enabled)

**Setup:**
- [ ] Ensure `OPENAI_API_KEY` is set in `server/.env`

**Steps:**
1. [ ] Navigate to proposal drafting workspace
2. [ ] Select any section
3. [ ] Enter some draft content (< 50 chars)
4. [ ] Click "Analyze" or use quick action button
5. [ ] Wait for response

**Expected Results:**
- [ ] Response appears within 5-10 seconds
- [ ] Suggestions are specific and contextual
- [ ] NO "Rule-Based Guidance" indicator shown
- [ ] Suggestions reference your actual content

**Status:** ⬜ PASS / ⬜ FAIL

---

## 🧪 Test 2: Fallback Mode (No API Key)

**Setup:**
- [ ] Comment out or remove `OPENAI_API_KEY` in `server/.env`
- [ ] Restart backend server

**Steps:**
1. [ ] Navigate to proposal drafting workspace
2. [ ] Select ELIGIBILITY section
3. [ ] Enter brief content: "We have experience"
4. [ ] Click "Analyze"
5. [ ] Wait for response

**Expected Results:**
- [ ] Response appears immediately (< 1 second)
- [ ] "ℹ️ Rule-Based Guidance (AI currently unavailable)" shown
- [ ] Suggestions address eligibility-specific items (experience, turnover, certifications)
- [ ] NO error messages or crashes
- [ ] Can still save and submit proposal

**Backend Logs Should Show:**
```
[AI Service] No API key - using fallback guidance
```

**Status:** ⬜ PASS / ⬜ FAIL

---

## 🧪 Test 3: Section-Specific Fallback

**Setup:**
- [ ] Keep `OPENAI_API_KEY` disabled/commented

**Test each section type:**

### ELIGIBILITY
- [ ] Draft: "We have some experience"
- [ ] Expected: Suggestions about years, turnover, certifications
- [ ] Status: ⬜ PASS / ⬜ FAIL

### TECHNICAL
- [ ] Draft: "We will use good materials"
- [ ] Expected: Suggestions about standards, methodology, quality assurance
- [ ] Status: ⬜ PASS / ⬜ FAIL

### FINANCIAL
- [ ] Draft: "Total cost: Rs. 10 lakhs"
- [ ] Expected: Suggestions about breakdown, milestones, EMD, taxes
- [ ] Status: ⬜ PASS / ⬜ FAIL

### EVALUATION
- [ ] Draft: "We are a good company"
- [ ] Expected: Suggestions about criteria alignment, strengths, clear language
- [ ] Status: ⬜ PASS / ⬜ FAIL

### TERMS
- [ ] Draft: "Okay"
- [ ] Expected: Suggestions about acceptance, conditions, risk terms
- [ ] Status: ⬜ PASS / ⬜ FAIL

---

## 🧪 Test 4: Content Length Analysis

**Setup:**
- [ ] Keep fallback mode enabled (no API key)

### Test: Very Brief Content (< 50 chars)
- [ ] Draft: "Yes"
- [ ] Expected: "Content is very brief - expand with specific details"
- [ ] Status: ⬜ PASS / ⬜ FAIL

### Test: Adequate Content (100+ chars)
- [ ] Draft: "Our organization has 8 years of experience in infrastructure projects with an average annual turnover of Rs. 12 crores..."
- [ ] Expected: Fewer or no suggestions if comprehensive
- [ ] Status: ⬜ PASS / ⬜ FAIL

---

## 🧪 Test 5: Invalid API Key (Error Handling)

**Setup:**
- [ ] Set `OPENAI_API_KEY=invalid-key-12345` in `server/.env`
- [ ] Restart backend server

**Steps:**
1. [ ] Navigate to proposal workspace
2. [ ] Enter draft content
3. [ ] Click "Analyze"
4. [ ] Wait for response

**Expected Results:**
- [ ] Fallback activates after API error
- [ ] "Rule-Based Guidance" indicator shown
- [ ] Structured suggestions returned
- [ ] NO 500 errors or crashes

**Backend Logs Should Show:**
```
[AI Service] Error during analysis: <error message>
```

**Status:** ⬜ PASS / ⬜ FAIL

---

## 🧪 Test 6: Response Format Consistency

**Verify both AI and fallback return same structure:**

### AI Response Structure:
```json
{
  "mode": "ai",
  "suggestions": [
    {
      "observation": "...",
      "suggestedImprovement": "...",
      "reason": "..."
    }
  ]
}
```

### Fallback Response Structure:
```json
{
  "mode": "fallback",
  "suggestions": [
    {
      "observation": "...",
      "suggestedImprovement": "...",
      "reason": "..."
    }
  ]
}
```

**Verification:**
- [ ] Both have `mode` field
- [ ] Both have `suggestions` array
- [ ] Each suggestion has all 3 fields (observation, suggestedImprovement, reason)
- [ ] Frontend displays both formats identically (except fallback indicator)

**Status:** ⬜ PASS / ⬜ FAIL

---

## 🧪 Test 7: Network Error Simulation

**Setup:**
- [ ] Enable API key in `.env`
- [ ] Start backend
- [ ] **While analyzing, forcefully stop the backend server**

**Steps:**
1. [ ] Start analysis request
2. [ ] Immediately stop backend: `Ctrl+C`
3. [ ] Observe frontend behavior

**Expected Results:**
- [ ] Frontend shows network error message after timeout
- [ ] "⚠️ Connection Error" message displayed
- [ ] UI doesn't crash
- [ ] Can retry after restarting backend

**Status:** ⬜ PASS / ⬜ FAIL

---

## 🧪 Test 8: Proposal Submission Still Works

**Setup:**
- [ ] Keep fallback mode enabled (no API key)

**Steps:**
1. [ ] Use fallback guidance to improve draft
2. [ ] Ensure all mandatory sections have 50+ characters
3. [ ] Click "Submit Proposal"

**Expected Results:**
- [ ] Submission succeeds
- [ ] Proposal marked as SUBMITTED
- [ ] NO errors about missing AI analysis
- [ ] Fallback guidance doesn't block any functionality

**Status:** ⬜ PASS / ⬜ FAIL

---

## 🧪 Test 9: Quick Actions with Fallback

**Setup:**
- [ ] Fallback mode enabled

**Test each quick action button:**
- [ ] "Key Points" - Returns section-specific key points
- [ ] "Gaps Check" - Identifies missing content
- [ ] "Improve" - Suggests improvements
- [ ] "Structure" - Recommends structure

**All should work without errors in fallback mode**

**Status:** ⬜ PASS / ⬜ FAIL

---

## 🧪 Test 10: Backend Test Script

**Steps:**
```bash
cd server
node test-fallback.js
```

**Expected Output:**
- [ ] All 6 test cases execute without errors
- [ ] Each returns structured response
- [ ] Brief drafts get more suggestions than comprehensive ones
- [ ] All show `mode: "fallback"` when API key disabled
- [ ] No exceptions thrown

**Status:** ⬜ PASS / ⬜ FAIL

---

## 📊 Overall Test Results

**Tests Passed:** _____ / 10

**Critical Issues Found:**
- [ ] None
- [ ] Minor issues (describe): _________________________________
- [ ] Major issues (describe): _________________________________

**Fallback Mechanism Status:**
- [ ] ✅ PRODUCTION READY
- [ ] ⚠️ NEEDS MINOR FIXES
- [ ] ❌ REQUIRES MAJOR WORK

---

## 🔍 Additional Verification

### Console Logs Checked
- [ ] No unhandled errors in browser console
- [ ] Backend logs show appropriate fallback messages
- [ ] No sensitive data (API keys) logged

### UI/UX Quality
- [ ] Fallback indicator clearly visible
- [ ] Suggestions are helpful and actionable
- [ ] Loading states work correctly
- [ ] No confusing error messages

### Documentation
- [ ] AI_FALLBACK_MECHANISM.md reviewed
- [ ] Test script (test-fallback.js) executed
- [ ] Code comments are clear

---

## ✅ Sign-off

**Tested By:** _______________________  
**Date:** _______________________  
**Environment:** Development / Staging / Production  
**Notes:** _______________________

---

## 📝 Known Issues & Limitations

Document any issues found during testing:

1. _______________________
2. _______________________
3. _______________________

---

## 🚀 Next Steps

After testing is complete:

- [ ] Fix any issues found
- [ ] Retest failed scenarios
- [ ] Update documentation if needed
- [ ] Deploy to production
- [ ] Monitor fallback usage rate in production
- [ ] Gather user feedback on fallback quality

---

**For questions or issues, refer to:** `AI_FALLBACK_MECHANISM.md`
