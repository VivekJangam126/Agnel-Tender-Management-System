# Analytics & Governance Dashboard Documentation

## Overview

The Analytics Dashboard is designed for **judges, procurement officials, and governance teams** to understand system-level tendering efficiency, transparency, and competition—not data science complexity.

**Success Metric**: A judge should understand the system's value in 10 seconds.

## Key Design Principles

✅ **No AI/Predictions** - Only factual, auditable metrics
✅ **No Over-Optimization** - Simple, readable data visualization
✅ **Clean & Readable** - Charts at a glance, no dense tables
✅ **Decision-Support Focus** - Enables governance discussions

## Features

### Part 1: Key Metrics (6 Cards)

| Metric | Purpose | Formula |
|--------|---------|---------|
| **Total Tenders Created** | System usage volume | COUNT(tender WHERE organization_id) |
| **Published Tenders** | Active procurement | COUNT(tender WHERE status='PUBLISHED') |
| **Closed Tenders** | Evaluated & completed | COUNT(tender WHERE status='CLOSED') |
| **Average Bids/Tender** | Competition level | SUM(bids) / COUNT(tenders) |
| **Total Bids Received** | Absolute participation | COUNT(proposal) |
| **Avg Lifecycle Days** | Planning period | CEIL(AVG(deadline - created_at)) |

### Part 2: Visual Insights

#### 1. Tender Status Distribution (Pie Chart)
- Shows the breakdown: DRAFT / PUBLISHED / CLOSED
- Indicates pipeline health
- Example: "60% published, 30% draft, 10% closed"

#### 2. Bid Participation (Bar Chart)
- Number of bids per tender (top 10 tenders)
- Indicates which tenders are competitive
- Higher bars = more competition
- Helps identify undersubscribed tenders

#### 3. Tender Timeline (Line Chart)
- Duration (days) from creation to submission deadline
- Shows planning periods across tenders
- Helps assess if timeline is reasonable
- Identifies outliers (very short or very long)

### Part 3: Governance Checklist

5 yes/no items that auto-check based on metrics:
1. ✓ Tenders are being published for bidding
2. ✓ Adequate bidder participation (avg > 2)
3. ✓ Completed tenders are being evaluated
4. ✓ System is actively in use
5. ✓ Adequate time for bid submission

### Part 4: System Health Summary

Executive summary with:
- Transparency confirmation
- Competition assessment
- Timeline efficiency
- Completion status
- Key compliance notes

## Architecture

### Backend Stack

#### Service: `analytics.service.js`
```javascript
getAnalytics(user)
  // Main analytics data aggregation
  // Returns: metrics, tenderDetails, statusDistribution, bidsByTender
  // Enforces AUTHORITY role and organization isolation

getTenderPerformance(user)
  // Timeline data for performance chart
  // Returns: date-based tender counts

getBidTimeline(user)
  // Bid submission timeline
  // Returns: date, bid_count, tender_count

getEvaluationSummary(user)
  // Evaluation status counts
  // Returns: PENDING, IN_PROGRESS, COMPLETED counts
```

#### Controller: `analytics.controller.js`
```javascript
getAnalytics()      // GET /api/analytics
getTenderPerformance()   // GET /api/analytics/performance
getBidTimeline()    // GET /api/analytics/bids/timeline
getEvaluationSummary()   // GET /api/analytics/evaluation/summary

All routes:
- Require authentication (requireAuth)
- Require AUTHORITY role (requireRole('AUTHORITY'))
- Enforce organization isolation (implicit in service)
```

#### Routes: `analytics.routes.js`
- Mounted at `/api/analytics`
- 4 GET endpoints (no write operations)
- AUTHORITY role enforcement at middleware level

### Frontend Stack

#### Service: `analyticsService.js`
```javascript
getAnalytics(token)           // Fetch all metrics and charts data
getTenderPerformance(token)   // Fetch timeline performance data
getBidTimeline(token)         // Fetch bid submission timeline
getEvaluationSummary(token)   // Fetch evaluation status summary
```

#### Components: `Charts.jsx`
No external charting library required (uses SVG + CSS):

```javascript
BarChart({ data, xKey, yKey, label, height })
  // Render simple bar chart
  // Props:
  //   data: Array of objects
  //   xKey: Key for X-axis labels
  //   yKey: Key for Y-axis values
  //   height: SVG height in pixels
  // Returns: Clean SVG bar chart with Y-axis labels

LineChart({ data, xKey, yKey, label, height })
  // Render simple line chart
  // Props: Same as BarChart
  // Returns: SVG line chart with grid

PieChart({ data, label, height })
  // Render pie chart
  // Props:
  //   data: Object { label: count, ... }
  //   height: Pie height in pixels
  // Returns: SVG pie chart with legend
```

#### Page: `Analytics.jsx`
Main analytics dashboard component

```javascript
// Component structure:
1. Header (title + description)
2. Error handling & loading state
3. Key metrics cards (6-card grid)
4. Visual insights section
   - Pie chart (status distribution)
   - Bar chart (bids per tender)
   - Line chart (timeline)
5. Governance checklist
6. System health summary
```

## Database Queries

### Metrics Calculation
```sql
-- Total tenders, status counts
SELECT status, COUNT(*) FROM tender 
WHERE organization_id = ? GROUP BY status;

-- Average bids per tender
SELECT tender_id, COUNT(*) as bid_count FROM proposal 
WHERE tender_id IN (...) GROUP BY tender_id;

-- Lifecycle duration
SELECT 
  CEIL((deadline - created) / 86400) as duration_days
FROM tender WHERE organization_id = ?;

-- Evaluation status
SELECT evaluation_status, COUNT(*) FROM tender_evaluation_status 
WHERE tender_id IN (...) GROUP BY evaluation_status;
```

### Performance Optimization
- Indexes on `tender.organization_id`, `tender.status`
- Indexes on `proposal.tender_id`
- Indexes on `tender_evaluation_status.tender_id`
- Queries grouped by organization (partition isolation)
- No joins across organizations

## Data Flow

```
┌─────────────────┐
│  Authority User │
└────────┬────────┘
         │
         ├─ GET /api/analytics
         │  └─> analyticsService.getAnalytics(user)
         │      ├─ Query all tenders (org isolation)
         │      ├─ Count by status
         │      ├─ Join with proposals (bid counts)
         │      ├─ Calculate lifecycle durations
         │      └─> Return aggregated metrics
         │
         ├─ GET /api/analytics/performance
         │  └─> getTenderPerformance(user)
         │      └─> Timeline data for line chart
         │
         └─ GET /api/analytics/evaluation/summary
            └─> getEvaluationSummary(user)
                └─> Evaluation status counts
                    
Frontend:
┌─────────────────┐
│   Analytics.jsx │
└────────┬────────┘
         │
         ├─> BarChart (bids per tender)
         ├─> LineChart (timeline)
         ├─> PieChart (status distribution)
         ├─> MetricCards (6 key metrics)
         ├─> GovernanceChecklist (5 items)
         └─> SystemHealthSummary
```

## Metrics Reference

### Average Bids per Tender
- **Formula**: Total bids / Total tenders
- **Interpretation**:
  - < 1: Undersubscribed (low competition)
  - 1-3: Developing (moderate competition)
  - > 3: Healthy (strong competition)
- **Judge Perspective**: "Is the market responding to our tenders?"

### Average Tender Lifecycle
- **Formula**: CEIL((submission_deadline - created_at) / 86400 seconds)
- **Range**: Typically 14-90 days
- **Interpretation**:
  - < 14: Very short (may discourage participation)
  - 14-30: Moderate (standard planning period)
  - > 60: Very long (generous planning period)
- **Judge Perspective**: "Are we giving vendors enough time?"

### Tender Status Distribution
- **DRAFT**: Not yet published
- **PUBLISHED**: Actively accepting bids
- **CLOSED**: Bid submission ended, evaluation in progress or complete
- **Judge Perspective**: "What's our pipeline status?"

### Total vs Average Bids
- **Total Bids**: Absolute volume (market interest)
- **Average**: Normalized competition (per tender fairness)
- **Judge Perspective**: "Is participation consistent, or do some tenders have outlier interest?"

## Governance Questions Answered

### Question 1: "Is the process transparent?"
**Answer**: Metrics on page confirm:
- ✓ All tenders visible and tracked
- ✓ Bid counts per tender public
- ✓ Status available for each tender

### Question 2: "Is there adequate competition?"
**Answer**: Bar chart and metrics show:
- Number of bids per tender
- Average bid count (benchmark)
- Trend of participation over time

### Question 3: "Is planning time adequate?"
**Answer**: Timeline chart and metric show:
- Individual tender durations
- Average across all tenders
- Distribution of planning periods

### Question 4: "Is the system being used?"
**Answer**: Key metrics demonstrate:
- Total tenders created
- Published tenders count
- Closed/evaluated count
- Trend over time

### Question 5: "Is evaluation happening?"
**Answer**: Status distribution shows:
- Count of closed tenders
- Evaluation status summary
- Completion rates

## API Endpoints

### 1. GET /api/analytics
```
Authorization: Bearer {token}
Role: AUTHORITY

Response:
{
  "metrics": {
    "totalTenders": 15,
    "publishedTenders": 8,
    "closedTenders": 3,
    "draftTenders": 4,
    "averageBidsPerTender": "2.5",
    "totalBids": 37,
    "averageLifecycleDays": 28
  },
  "tenderDetails": [
    {
      "tender_id": "uuid",
      "title": "Project Name",
      "status": "PUBLISHED",
      "bidCount": 4,
      "lifecycleDays": 30,
      ...
    }
  ],
  "statusDistribution": {
    "DRAFT": 4,
    "PUBLISHED": 8,
    "CLOSED": 3
  },
  "bidsByTender": [...]
}
```

### 2. GET /api/analytics/performance
```
Response:
{
  "data": [
    {
      "date": "2026-01-01",
      "count": 2,
      "published": 1
    },
    ...
  ]
}
```

### 3. GET /api/analytics/bids/timeline
```
Response:
{
  "data": [
    {
      "date": "2026-01-05",
      "bid_count": 5,
      "tender_count": 2
    },
    ...
  ]
}
```

### 4. GET /api/analytics/evaluation/summary
```
Response:
{
  "PENDING": 2,
  "IN_PROGRESS": 1,
  "COMPLETED": 3
}
```

## Error Handling

### 403 Forbidden
- User not AUTHORITY role
- Trying to access other organization's data

### 500 Internal Server Error
- Database query failure
- Connection timeout

### Response Format
```json
{
  "error": "Unauthorized: AUTHORITY role required"
}
```

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| Load metrics | < 100ms | Single org, indexed queries |
| Render dashboard | < 500ms | Charts rendered client-side |
| Chart interactivity | Instant | No expensive computations |
| Data refresh | User initiates | No polling or WebSocket |

## Future Enhancements (Out of Scope)

1. **Export Functionality**: PDF/Excel export of metrics
2. **Timeframe Filters**: Select date ranges for analysis
3. **Bid Distribution**: Statistical distribution of bids
4. **Compliance Reports**: Pre-formatted reports for regulators
5. **Historical Comparison**: Year-over-year metrics
6. **Category Analysis**: Metrics by tender category
7. **Evaluator Performance**: Completion times, decision patterns
8. **Financial Summary**: Total value, bid variance, L1 distribution

## Testing Checklist

- [ ] Metrics load and display correctly
- [ ] Charts render without errors
- [ ] All 6 metric cards show accurate data
- [ ] Pie chart percentages sum to 100%
- [ ] Bar chart shows top 10 tenders
- [ ] Line chart shows reasonable scale
- [ ] Governance checklist auto-validates
- [ ] System health summary is meaningful
- [ ] Empty state handled gracefully
- [ ] Loading state displays
- [ ] Error messages are user-friendly
- [ ] AUTHORITY role enforcement works
- [ ] Organization isolation confirmed
- [ ] Performance acceptable (< 1 sec total load)

## Compliance Notes

✅ **No Automation**: All insights are factual, no predictions
✅ **No Bias**: Metrics are mechanical counts, no weighting
✅ **Transparent**: Source data fully traceable
✅ **Auditable**: Each metric has clear formula
✅ **Historical**: Data preserved for later analysis
✅ **Role-Based**: Only AUTHORITY can access
✅ **Isolated**: Authority only sees own org data

## Judge's Interpretation Guide

| Metric | What It Means | Good Level | Action if Low |
|--------|---------------|-----------|---------------|
| Tenders Created | System usage | Growing | Check adoption |
| Published | Active procurements | > 50% of total | Speed up publication |
| Closed | Evaluated tenders | Growing | Monitor evaluation time |
| Avg Bids | Competition per tender | > 2 | Improve bid criteria |
| Lifecycle Days | Planning period | 14-60 | Adjust timeline policy |
| Total Bids | Market interest | Growing | Positive signal |
