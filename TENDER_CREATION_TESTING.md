# Tender Creation - Quick Testing Guide

## 🧪 How to Test the New Tender Creation Feature

### Prerequisites
1. Backend server running on the expected port
2. User logged in as AUTHORITY role
3. Navigate to `/admin/tenders/new` or click "Create Tender"

---

## ✅ Test Case 1: Complete Tender Creation (Happy Path)

### Step 1: Basic Information
1. **Tender Title**: Enter "Medical Equipment Procurement 2026" (min 10 chars)
2. **Authority Name**: Enter "Health Department, Maharashtra"
3. **Reference ID**: Auto-generated (e.g., `TND-202601-1234`) - can be edited
4. **Tender Type**: Select "Open Tender"
5. **Estimated Value**: Enter `5000000`
6. **Submission Start Date**: Select tomorrow's date
7. **Submission End Date**: Select date 30 days from start
8. **Description**: Enter at least 20 characters describing the tender

**Expected:**
- ✅ All fields show no errors when filled correctly
- ✅ "Next" button becomes enabled
- ✅ Clicking "Next" saves data and moves to Step 2

---

### Step 2: Tender Content & Eligibility
Complete each mandatory section with at least 50 characters:

1. **Scope of Work**:
   ```
   Supply and installation of 100 hospital beds, 50 patient monitors, 
   and 25 ventilators for District General Hospital. Equipment must 
   meet ISO standards and be delivered within 90 days.
   ```

2. **Eligibility Criteria**:
   ```
   Bidders must be registered medical equipment suppliers with minimum 
   5 years experience. Annual turnover must exceed ₹10 crores. Valid 
   ISO 13485 certification required.
   ```

3. **Technical Requirements**:
   ```
   All equipment must comply with IEC 60601 safety standards. Hospital 
   beds must be motorized with three functions. Monitors must support 
   multi-parameter monitoring including ECG, SpO2, NIBP.
   ```

4. **Financial Conditions**:
   ```
   EMD: 2% of quoted value. Payment: 70% on delivery, 30% after 
   successful installation and testing. Performance guarantee: 10% 
   for one year. All prices inclusive of GST.
   ```

5. **Evaluation Criteria**:
   ```
   Technical compliance: 40 points. Price competitiveness: 30 points. 
   Past performance: 20 points. After-sales service: 10 points. 
   Minimum qualifying score: 60 points.
   ```

6. **Terms & Conditions**:
   ```
   Contract period: One year with option to extend. Liquidated damages 
   for delay: 0.5% per week. Disputes subject to Mumbai jurisdiction. 
   Force majeure clause applicable.
   ```

7. **Additional Clauses** (Optional):
   ```
   Bidders must provide comprehensive warranty for minimum 2 years. 
   On-site training for hospital staff included in the scope.
   ```

**Expected:**
- ✅ Each section shows "Incomplete" → "Completed" status
- ✅ Progress indicator updates as sections are filled
- ✅ Character count displayed for each section
- ✅ "Next" button enabled when all mandatory sections complete

---

### Step 3: Review & Publish

**Review Checklist:**
1. ✅ Tender title displayed correctly
2. ✅ All metadata shown (Authority, Reference ID, Type, Value, Dates)
3. ✅ All 7 sections displayed in order
4. ✅ Section content rendered correctly
5. ✅ Validation checklist shows all green checkmarks
6. ✅ Warning message displayed

**Publish:**
1. Click "Publish Tender" button
2. Confirm the warning dialog
3. Wait for success message
4. Verify redirect to dashboard

**Expected:**
- ✅ Success message: "Tender published successfully!"
- ✅ Redirect to `/admin/dashboard` after 1.5 seconds
- ✅ Tender appears in dashboard with status "PUBLISHED"

---

## ❌ Test Case 2: Validation Errors

### Step 1 Validation Tests

1. **Leave title empty** → Error: "Tender title is required"
2. **Enter title < 10 chars** → Error: "Title must be at least 10 characters"
3. **Leave Authority name empty** → Error: "Authority/Department name is required"
4. **Leave Tender Type unselected** → Error: "Tender type is required"
5. **Enter negative value** → Error: "Please enter a valid positive number"
6. **Set end date before start date** → Error: "End date must be after start date"
7. **Set end date in past** → Error: "End date cannot be in the past"
8. **"Next" button disabled** → Cannot proceed until all fields valid

---

### Step 2 Validation Tests

1. **Leave mandatory section empty** → Error: "{Section} is mandatory and must have content"
2. **Enter < 50 chars in mandatory section** → Error: "{Section} must have at least 50 characters"
3. **Status shows "Incomplete"** → Red dot indicator
4. **"Next" button disabled** → Cannot proceed until all mandatory sections complete

---

### Step 3 Validation Tests

1. **Missing any Step 1 field** → Validation check shows ❌
2. **Incomplete mandatory section** → Validation check shows ❌
3. **"Publish Tender" button disabled** → Cannot publish until all checks pass
4. **All checks pass** → Button enabled, all checks show ✅

---

## 🔄 Test Case 3: Edit Existing DRAFT Tender

### Setup:
1. Create a tender but don't publish (save and exit after Step 1)
2. Navigate to tender list
3. Click "Edit" on the draft tender

**Expected:**
- ✅ Form loads with previously saved data
- ✅ Reference ID preserved
- ✅ All fields editable
- ✅ Can navigate through steps
- ✅ Can complete and publish

---

## 🚫 Test Case 4: Cannot Edit PUBLISHED Tender

### Setup:
1. Create and publish a tender
2. Try to navigate to edit URL

**Expected:**
- ✅ Error message: "Only draft tenders can be edited"
- ✅ Redirect to dashboard after 2 seconds
- ✅ No data can be modified

---

## 🔍 Test Case 5: Data Persistence

### Test:
1. Fill Step 1 and click "Next"
2. Fill some sections in Step 2
3. **Refresh the page**

**Expected (if backend supports it):**
- ⚠️ Data should be preserved (loaded from DRAFT in backend)
- ⚠️ Current implementation relies on backend DRAFT state
- ⚠️ If page refresh loses data, this is a known limitation

**Alternative Test:**
1. Fill Step 1 and click "Next"
2. Click "Back"
3. Verify data still present

**Expected:**
- ✅ Data preserved when navigating back
- ✅ Step 1 validation passes immediately

---

## 📱 Test Case 6: Responsive Design

### Desktop (1920x1080)
- ✅ Two-column layout in Step 2
- ✅ Preview card shows all metadata
- ✅ Validation checklist sidebar visible

### Tablet (768px)
- ✅ Form fields stack properly
- ✅ Two-column layout collapses to single column
- ✅ Navigation buttons accessible

### Mobile (375px)
- ✅ All inputs full-width
- ✅ Date pickers functional
- ✅ Buttons not cut off

---

## ⚡ Test Case 7: Performance & UX

### Loading States
1. Click "Next" in Step 1
   - ✅ Button text changes to "Saving..."
   - ✅ Button disabled during save
   - ✅ No double-submit possible

2. Click "Publish Tender"
   - ✅ Button text changes to "Publishing..."
   - ✅ Button disabled during publish
   - ✅ Success message appears
   - ✅ Auto-redirect works

### Error Handling
1. Disconnect network
2. Try to save/publish
   - ✅ Error message displayed at top
   - ✅ User can retry
   - ✅ No data lost

---

## 🎯 Success Criteria Summary

### Must Work:
- [ ] Create tender from scratch
- [ ] All Step 1 validations
- [ ] All Step 2 mandatory sections enforced
- [ ] Preview displays correctly
- [ ] Single publish action works
- [ ] Tender becomes PUBLISHED in backend
- [ ] Redirect to dashboard works

### Should Work:
- [ ] Edit existing DRAFT
- [ ] Block editing PUBLISHED tenders
- [ ] Loading states display
- [ ] Error messages clear

### Nice to Have:
- [ ] Data persists on page refresh
- [ ] Responsive on all devices
- [ ] Smooth animations

---

## 🐛 Known Issues to Check

### Backend Integration:
1. **New fields in Step 1**: Check if backend accepts:
   - `authority_name`
   - `reference_id`
   - `tender_type`
   - `submission_start_date`

2. **Section content**: Check if `tender_section` table has `content` column

3. **Section metadata**: Check if backend supports:
   - `section_key`
   - `description`

### If Backend Doesn't Support:
- Fields will be sent but not stored
- May need to update backend schema
- Tender will still create but some data lost

---

## 📋 Quick Smoke Test (5 minutes)

1. **Create New Tender**
   - Fill all Step 1 fields ✅
   - Click Next ✅

2. **Add Content**
   - Fill first 3 mandatory sections ✅
   - Try to click Next (should be disabled) ❌
   - Fill remaining mandatory sections ✅
   - Click Next ✅

3. **Review & Publish**
   - Check preview looks correct ✅
   - Click Publish ✅
   - Confirm dialog ✅
   - Wait for redirect ✅

4. **Verify**
   - Tender appears in dashboard ✅
   - Status is PUBLISHED ✅
   - Cannot edit anymore ✅

**If all ✅ → Feature is working correctly!**

---

## 📞 Support & Debugging

### Browser Console Checks:
```javascript
// Check for errors
console.error

// Check API calls
Network tab → Filter "tender"

// Check state
React DevTools → TenderCreate component
```

### Common Issues:

**"Next" button not enabling:**
- Check browser console for validation errors
- Verify all required fields filled
- Check field-specific error messages

**Publish fails:**
- Check backend logs
- Verify user has AUTHORITY role
- Check tender is in DRAFT status
- Verify sections were saved

**Data not saving:**
- Check network requests (500/400 errors?)
- Verify backend is running
- Check authentication token valid

---

**Happy Testing! 🚀**
