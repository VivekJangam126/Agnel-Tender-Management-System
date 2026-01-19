# 🚀 MVP Bidder System - Quick Start Guide

## What is This?

A **dummy bidder simulation layer** that allows admins to evaluate bids WITHOUT implementing the full bidder portal. Perfect for MVP/hackathon/demo.

---

## 5-Minute Setup

### 1. Verify MVP Mode is Enabled

```bash
# In server/.env
MVP_MODE=true
```

### 2. Seed Dummy Bidders (Run Once)

```bash
cd server
npm run seed:dummy-bidders
```

**Expected Output:**
```
✅ Seeded: 8 dummy bidders
```

### 3. Validate System

```bash
npm run validate:mvp
```

**All checks should pass ✅**

### 4. Start Server

```bash
npm run dev
```

Server runs at `http://localhost:5000`

---

## 2-Minute Demo Flow

### Step 1: Login as Admin

- URL: `http://localhost:5173/login`
- Role: **Authority** (admin)
- Email: Create a new authority account in signup

### Step 2: Create a Tender

- Go: `/admin/dashboard`
- Click: **Create New Tender**
- Fill: Title, description, deadline
- Add: At least 1 section (Q&A, eligibility, etc.)
- Click: **Publish**

### Step 3: View Auto-Generated Bids

- Go: `/admin/bid-evaluation`
- You should see the tender you just published
- Click on it
- **See: 3-7 dummy bids auto-appeared** ✨

### Step 4: Evaluate Bids

- Select a bid
- Set score (0-100)
- Mark: **QUALIFIED** or **DISQUALIFIED**
- Add remarks (optional)
- Click: **Save**

### Step 5: Complete Evaluation

- After scoring all bids
- Click: **Complete Evaluation**
- Tender evaluation finished ✅

---

## What Gets Auto-Generated?

When you **publish a tender**, the system:

1. ✅ Creates 3-7 dummy proposals
2. ✅ Assigns them to dummy bidder organizations
3. ✅ Generates realistic bid amounts (±20% variance)
4. ✅ Stores everything in real database
5. ✅ Makes them visible to admin evaluation API

**All data flows through real backend APIs** - admin doesn't know it's dummy!

---

## File Changes Summary

| File | Change | Why |
|------|--------|-----|
| `src/services/dummyBidder.service.js` | ⭐ NEW | Generates dummy proposals |
| `src/services/tender.service.js` | ✏️ Modified | Calls dummy service on publish |
| `src/config/env.js` | ✏️ Modified | Added MVP_MODE config |
| `src/scripts/seedDummyBidders.js` | ⭐ NEW | Seeds 8 dummy organizations |
| `src/scripts/validateMVP.js` | ⭐ NEW | Validates setup |
| `.env` | ✏️ Modified | MVP_MODE=true |
| `package.json` | ✏️ Modified | Added seed & validate scripts |
| `MVP_BIDDER_SIMULATION.md` | ⭐ NEW | Full documentation |

---

## Dummy Bidders Generated

```
1. ABC Infra Pvt Ltd
2. BuildTech Solutions
3. Premier Engineering Co.
4. Global Infrastructure Partners
5. Skyline Construction Ltd
6. TechBuild Systems
7. Urban Development Corp
8. Apex Contractors Ltd
```

Each gets a realistic email and password-protected user account.

---

## Troubleshooting

### ❌ No bids appear after publishing

**Fix:**
```bash
# Check MVP mode is enabled
grep MVP_MODE server/.env

# Re-seed bidders
npm run seed:dummy-bidders

# Validate system
npm run validate:mvp
```

### ❌ Seed script fails

**Check database connection:**
```bash
# In server directory
psql $DATABASE_URL -c "SELECT version();"
```

### ❌ Can't see bid evaluation page

**Check:**
1. Are you logged in as AUTHORITY role?
2. Did you publish (not just create) the tender?
3. Check browser console for errors

---

## Production Migration

When ready to use real bidders:

1. **Disable MVP mode:**
   ```bash
   # In .env
   MVP_MODE=false
   ```

2. **Build bidder portal** (no code changes needed in admin)

3. **Remove dummy data** (optional):
   ```sql
   DELETE FROM proposal 
   WHERE organization_id IN (
     SELECT organization_id FROM organization 
     WHERE type = 'BIDDER' AND name LIKE '%Infra%'
   );
   ```

---

## Key Features ✨

| Feature | Status | Details |
|---------|--------|---------|
| Auto-generate bids | ✅ | 3-7 per tender |
| Realistic data | ✅ | Proper amounts, names, timestamps |
| Real evaluation | ✅ | Actual scoring, qualification |
| Real database | ✅ | All data persisted |
| Future-proof | ✅ | Works with real bidders later |
| No UI code | ✅ | Zero bidder frontend needed |

---

## Architecture Guarantee

```
DATABASE → SERVICE → CONTROLLER → API → ADMIN UI

✅ All data flows through real backend
✅ No frontend mocking
✅ Transparent to admin
✅ Works with real bidders later
```

---

## Next Steps

1. ✅ Run `npm run seed:dummy-bidders`
2. ✅ Run `npm run validate:mvp`
3. ✅ Start server: `npm run dev`
4. ✅ Follow **2-Minute Demo Flow** above
5. ✅ Show evaluation workflow to stakeholders

---

## Questions?

See [MVP_BIDDER_SIMULATION.md](./MVP_BIDDER_SIMULATION.md) for detailed docs.

**This is production-ready MVP pattern - not a hack!** ✅
