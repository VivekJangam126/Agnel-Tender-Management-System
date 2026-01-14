# AI Assistant - Visual Guide & Quick Reference

## 🎨 User Interface

### Step 2 Layout (Tender Content & Eligibility)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Tender Content & Eligibility (Step 2 of 3)                             │
│ Complete all mandatory sections to define your tender requirements      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌──────────────────┬──────────────────────┬──────────────────────────┐ │
│ │ SECTION LIST     │ SECTION EDITOR       │ AI ASSISTANT             │ │
│ │ (col-span-3)     │ (col-span-5)         │ (col-span-4)             │ │
│ │                  │                      │                          │ │
│ │ ⚡ Tender        │ 📄 Scope of Work    │ ⚡ AI Drafting Assistant│
│ │    Sections      │                      │ 📋 Assisting:            │
│ │ ────────────     │ Mandatory            │    Scope of Work         │
│ │ 01 Scope of Work │                      │                          │
│ │    ✓ Completed   │ Section Content      │ [📋 Section][📄 Tender] │
│ │                  │                      │ ────────────────────────│
│ │ 02 Eligibility   │ ┌──────────────────┐ │ 💬 Chat Messages         │
│ │    ⚠ Incomplete  │ │ We need to build │ │ ────────────────────────│
│ │                  │ │ a software       │ │ │ You:                   │
│ │ 03 Technical     │ │ system that      │ │ │ What technical         │
│ │    ○ Not started │ │ manages tenders  │ │ │ requirements am I      │
│ │                  │ │ and provides AI  │ │ │ missing?               │
│ │ 04 Financial     │ │ assistance...    │ │ │                        │
│ │    ○ Not started │ │                  │ │ │ AI:                    │
│ │                  │ │ 156 characters   │ │ │ ⚠️ Missing delivery     │
│ │ 05 Evaluation    │ └──────────────────┘ │ │ timeline                │
│ │    ○ Not started │                      │ │                        │
│ │                  │ ℹ️ Minimum 50 chars  │ │ ┌──────────────────────┐│
│ │ 06 Terms & Cond. │    required          │ │ │ Observation:         ││
│ │    ○ Not started │                      │ │ │ Missing delivery     ││
│ │                  │                      │ │ │ timeline              ││
│ │ 07 Add'l Clauses │                      │ │ │                      ││
│ │    ○ Optional    │                      │ │ │ Text:                ││
│ │                  │                      │ │ │ ┌────────────────────┤│
│ │                  │                      │ │ │ │Delivery within 30 ││
│ │                  │                      │ │ │ │days of order...    ││
│ │                  │                      │ │ │ └────────────────────┤│
│ │                  │                      │ │ │                      ││
│ │                  │                      │ │ │ Why:                 ││
│ │                  │                      │ │ │ Critical for project ││
│ │                  │                      │ │ │ planning              ││
│ │                  │                      │ │ │                      ││
│ │                  │                      │ │ │ [✅ Apply] [❌ Ignore]││
│ │                  │                      │ │ └──────────────────────┘│
│ │                  │                      │ │                        │
│ │                  │                      │ │ [Ask about this...  ↑]│
│ │                  │                      │ │ ℹ️ AI reviews & suggests
│ │                  │                      │ │    (click Apply to use) │
│ └──────────────────┴──────────────────────┴──────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ [← Back] [Next →] [🔄 Save]                                             │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 💬 AI Assistant Panel Expanded View

### Default State
```
┌─────────────────────────────────────┐
│ ⚡ AI Drafting Assistant             │
│ 📋 Assisting: Scope of Work          │
│ [📋 Section] [📄 Tender]             │
├─────────────────────────────────────┤
│ 📖 Ask for assistance                │
│ I'll review your section and suggest │
│ improvements                         │
└─────────────────────────────────────┘
```

### With Suggestions
```
┌─────────────────────────────────────┐
│ ⚡ AI Drafting Assistant             │
│ 📋 Assisting: Scope of Work          │
│ [📋 Section] [📄 Tender]             │
├─────────────────────────────────────┤
│ You (right-aligned, blue):           │
│ "What technical requirements am I   │
│  missing?"                           │
│                                     │
│ AI (left-aligned):                  │
│ "Here are my suggestions:"           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⚠️ Missing delivery timeline     │ │
│ │ Click to review and apply        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⚠️ Missing acceptance criteria   │ │
│ │ Click to review and apply        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✅ Clear structure [Applied]     │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [Ask about this section...] [↑]    │
│ ℹ️ AI reviews & suggests only       │
│    (click Apply to use)              │
└─────────────────────────────────────┘
```

### Expanded Suggestion Card
```
┌─────────────────────────────────────┐
│ ⚠️ Missing delivery timeline         │
├─────────────────────────────────────┤
│ Observation:                         │
│ The section doesn't specify when    │
│ the deliverables must be completed  │
│                                     │
│ Suggested Addition:                  │
│ ┌─────────────────────────────────┐ │
│ │ Delivery must be completed       │ │
│ │ within 30 days of order          │ │
│ │ placement, unless otherwise      │ │
│ │ agreed in writing.               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Why:                                 │
│ Critical for project planning and   │
│ bidder compliance with timelines.   │
│ Also ensures SLA clarity.           │
├─────────────────────────────────────┤
│ [✅ Apply] [❌ Ignore]              │
└─────────────────────────────────────┘
```

---

## 🔄 User Interaction Flow

### Scenario 1: Basic Suggestion

```
Step 1: Read Content
        "We need software for tender management"
        ↓
Step 2: Ask Question
        "What's missing in this scope?"
        ↓
Step 3: AI Reviews
        [Backend: RAG retrieval + AI processing]
        ↓
Step 4: Display Suggestions
        • Missing deliverables
        • Missing timeline
        • Missing acceptance criteria
        ↓
Step 5: User Reviews
        Click suggestion to expand
        Read observation + text + reason
        ↓
Step 6: Apply or Ignore
        Click "Apply" → Text appends
        Click "Ignore" → Nothing happens
        ↓
Step 7: Continue
        Editor now shows:
        "We need software...\n\nDelivery within 30 days..."
        ↓
Step 8: Further Refinement
        User can:
        • Ask more questions
        • Manually edit
        • Apply more suggestions
```

### Scenario 2: Mode Switching

```
Default: Section Mode
┌─────────────────────────────────────┐
│ 📋 Assisting: Scope of Work          │
│ [📋 Section✓] [📄 Tender]            │
│ Context: This section only           │
└─────────────────────────────────────┘
        ↓
Click Tender Button
        ↓
Entire Tender Mode
┌─────────────────────────────────────┐
│ 📄 Reviewing entire tender           │
│ [📋 Section] [📄 Tender✓]            │
│ Context: All sections + metadata     │
└─────────────────────────────────────┘
        ↓
Ask: "Is my tender structurally
complete?"
        ↓
Get suggestions about:
• Overall organization
• Missing cross-section connections
• Completeness across all mandatory
  sections
```

---

## 🧠 AI Behavior Matrix

| User Action | AI Response | Applied? | Content | Notes |
|-------------|------------|----------|---------|-------|
| "What's missing?" | Specific gaps | ✓ Suggest | Append | Only if gaps exist |
| "How's this?" | General review | ✓ Suggest | Append | Constructive feedback |
| "Fix this section" | Explanation | ✗ Never | Explain | Empowers user to fix |
| "Make it longer" | Suggestions | ✓ Suggest | Append | Ideas to choose from |
| "Is it complete?" | Checklist | ✓ Suggest | Append | Compliance checks |
| Idle (no question) | Blank | N/A | Empty | Waits for user input |

---

## 📊 Suggestion Card States

### State 1: Collapsed (Normal)
```
┌─────────────────────────────────────┐
│ ⚠️ Missing delivery timeline         │
│ Click to review and apply            │
└─────────────────────────────────────┘
```
**User sees:** Observation only, small footprint

### State 2: Expanded (Details)
```
┌─────────────────────────────────────┐
│ ⚠️ Missing delivery timeline         │
├─────────────────────────────────────┤
│ Observation: [full text]             │
│                                     │
│ Suggested Addition:                  │
│ [Code block with suggested text]    │
│                                     │
│ Why: [explanation]                   │
├─────────────────────────────────────┤
│ [✅ Apply] [❌ Ignore]              │
└─────────────────────────────────────┘
```
**User sees:** Full details, decision options

### State 3: Applied
```
┌─────────────────────────────────────┐
│ ✅ Missing delivery timeline         │
│ [Applied]                            │
└─────────────────────────────────────┘
```
**User sees:** Confirmation, can collapse

---

## 🔐 Permission & Role Matrix

| Action | Admin/Authority | Bidder | Unauthenticated |
|--------|-----------------|--------|-----------------|
| View Step 1-3 | ✓ Yes | ✗ No | ✗ No |
| View AI Panel | ✓ Yes | ✗ No | ✗ No |
| Send AI Message | ✓ Yes | ✗ No | ✗ No |
| Apply Suggestions | ✓ Yes | ✗ No | ✗ No |
| Query Published Tender AI | ✓ Yes | ✓ Yes | ✗ No |

---

## ⚙️ Technical Request/Response

### Request Example
```javascript
{
  mode: "section",
  sectionType: "scope_of_work",
  existingContent: "We need custom software development...",
  tenderMetadata: {
    title: "Software Development RFP",
    authorityName: "Municipal IT Department",
    sector: "IT & Software Development",
    tenderType: "RFP",
    estimatedValue: "500000"
  },
  userQuestion: "What technical requirements should I add?"
}
```

### Response Example
```javascript
{
  suggestions: [
    {
      observation: "Missing specification for technology stack",
      suggestedText: "The technology stack must be:\n- Backend: Node.js/Python\n- Frontend: React/Vue\n- Database: PostgreSQL",
      reason: "Clarifies technical expectations and reduces proposal variations"
    },
    {
      observation: "No mention of support/maintenance period",
      suggestedText: "Software support and maintenance coverage: Minimum 12 months of free support",
      reason: "Essential for government compliance and lifecycle management"
    }
  ]
}
```

---

## 📱 Mobile Responsiveness

### Desktop (3-column, preferred)
```
┌─────────────────────────────┐
│ Sections │ Editor │ AI Panel │
│ 30%      │ 50%    │ 20%      │
└─────────────────────────────┘
```

### Tablet (2-column, responsive)
```
┌─────────────────────┐
│ Sections │ Editor  │
│ 40%      │ 60%     │
│ [AI Panel scrolls down] │
└─────────────────────┘
```

### Mobile (1-column, stacked)
```
┌─────────────────────┐
│ Sections            │
├─────────────────────┤
│ Editor              │
├─────────────────────┤
│ AI Panel            │
└─────────────────────┘
```

---

## 🎯 Context Indicator Examples

### Section Mode
```
📋 Assisting: Scope of Work
   ↓
   Only considers:
   - Current section content
   - Section description
   - User question
```

### Tender Mode
```
📄 Reviewing entire tender
   ↓
   Considers:
   - All section summaries
   - Tender metadata (title, sector, type)
   - Cross-section relationships
   - User question
```

---

## ✅ Quality Indicators

### Suggestion Quality Checklist

A **Good Suggestion** has:
- [✓] Specific observation (not vague)
- [✓] Actionable text (can be inserted)
- [✓] Clear reasoning (why it matters)
- [✓] Relevant to government standards
- [✓] Non-controversial (standard practice)

A **Bad Suggestion** would be:
- [✗] Generic advice ("be clear")
- [✗] Fragmented text (incomplete sentences)
- [✗] No reasoning (just says "add this")
- [✗] Proprietary recommendations
- [✗] Controversial positions

---

## 🚨 Error States

### Error 1: Network Failure
```
┌─────────────────────────────────────┐
│ ❌ Failed to get AI assistance.      │
│    Please check your connection     │
│    and try again.                   │
│                                     │
│                        [← Retry]    │
└─────────────────────────────────────┘
```

### Error 2: Empty Question
```
┌─────────────────────────────────────┐
│ [Ask about this section...] [↑ disabled]
│ (Cannot send empty message)         │
└─────────────────────────────────────┘
```

### Error 3: Service Unavailable
```
┌─────────────────────────────────────┐
│ 🔴 AI service temporarily unavailable│
│    The OpenAI API is not responding. │
│    Please try again in a moment.    │
└─────────────────────────────────────┘
```

---

## 🎓 Key UI Principles

| Principle | Implementation |
|-----------|-----------------|
| **Transparency** | Show exactly what AI sees (context label) |
| **Control** | Explicit "Apply" button, never auto-apply |
| **Clarity** | Show observation + reasoning |
| **Safety** | Append-only, never overwrite |
| **Feedback** | Show "Applied" status on cards |
| **Helpfulness** | Provide 2-3 suggestions max (not overwhelming) |
| **Accessibility** | Large buttons, clear colors, readable text |

---

**Visual Guide Complete. All components rendered as specified.**

Ready for user testing and feedback.
