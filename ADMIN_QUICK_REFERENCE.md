# Admin Side - Quick Reference Guide

## 🎯 Key Files & Locations

### Routing
- **Main routing**: `src/App.jsx` (SINGLE SOURCE OF TRUTH)
- **Layout**: `src/layouts/AdminLayout.jsx` (wraps all /admin/* routes)
- **Navigation**: `src/components/shared/Sidebar.jsx`
- **Access control**: `src/components/shared/ProtectedRoute.jsx`

### Pages
| Page | Path | File | Purpose |
|------|------|------|---------|
| Dashboard | `/admin/dashboard` | `src/pages/admin/Dashboard/Dashboard.jsx` | Main control center |
| Tenders List | `/admin/tenders` | `src/pages/admin/TendersList/TendersList.jsx` | Browse all tenders |
| Tender Detail | `/admin/tender/view/:id` | `src/pages/admin/TenderView/TenderView.jsx` | Read-only detail view |
| Create Tender | `/admin/tender/create` | `src/pages/admin/TenderCreate/TenderCreate.jsx` | Multi-step form |
| Edit Tender | `/admin/tender/edit/:id` | `src/pages/admin/TenderCreate/TenderCreate.jsx` | Edit mode (drafts only) |
| Bid Evaluation | `/admin/bid-evaluation` | `src/pages/admin/BidEvaluation/BidEvaluationList.jsx` | List published tenders |
| Bid Detail | `/admin/bid-evaluation/:id` | `src/pages/admin/BidEvaluation/BidEvaluation.jsx` | Evaluate bids |
| Analytics | `/admin/analytics` | `src/pages/admin/Analytics/Analytics.jsx` | Real-time metrics |
| Profile | `/admin/profile` | `src/pages/admin/Profile/Profile.jsx` | User settings |

### Components
| Component | File | Usage |
|-----------|------|-------|
| StatsCard | `src/pages/admin/Dashboard/components/StatsCard.jsx` | Dashboard & Analytics metrics |
| TenderStatusBadge | `src/components/admin/TenderStatusBadge.jsx` | Status display (DRAFT, PUBLISHED, CLOSED) |
| DraftTenderList | `src/pages/admin/Dashboard/components/DraftTenderList.jsx` | Dashboard draft list |
| PublishedTenderList | `src/pages/admin/Dashboard/components/PublishedTenderList.jsx` | Dashboard published list |

### Services
- **Tenders API**: `src/services/tenderService.js`
  - `listTenders(token)` - Get all user's tenders
  - `getTender(id, token)` - Get single tender detail
  - `createTender(payload, token)` - Create new tender
  - `updateTender(id, payload, token)` - Update tender
  - `publishTender(id, token)` - Publish tender
  - `deleteTender(id, token)` - Delete tender

---

## 🔄 Common Workflows

### Adding a New Admin Page
1. Create page file in `src/pages/admin/NewPage/`
2. Import in `src/App.jsx`
3. Add route in the `/admin` route group
4. Add navigation item to `src/components/shared/Sidebar.jsx` (adminMenu array)
5. Test route protection (should auto-work via ProtectedRoute)

### Fetching Tender Data
```javascript
import useAuth from "../../../hooks/useAuth";
import { tenderService } from "../../../services/tenderService";

export default function MyComponent() {
  const { token } = useAuth();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { tenders: data } = await tenderService.listTenders(token);
        setTenders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token]);

  // Your component logic...
}
```

### Adding Sidebar Navigation
In `src/components/shared/Sidebar.jsx`, add to `adminMenu` array:
```javascript
{ 
  label: "My Page", 
  href: "/admin/my-page", 
  icon: MyIcon, 
  rootPath: "/admin/my-page" // for nested route highlighting
}
```

### Creating a Tender Detail Link
```javascript
// For published tenders (view-only)
<Link to={`/admin/tender/view/${tender.tender_id}`}>View</Link>

// For draft tenders (edit)
<Link to={`/admin/tender/edit/${tender.tender_id}`}>Edit</Link>

// For bid evaluation
<Link to={`/admin/bid-evaluation/${tender.tender_id}`}>Evaluate</Link>
```

---

## 🛡️ Role-Based Access

### Authority Access
- ✅ Can view dashboard
- ✅ Can create tenders
- ✅ Can edit own draft tenders
- ✅ Can publish tenders
- ✅ Can view published tenders (read-only)
- ✅ Can evaluate bids
- ✅ Can view analytics

### Bidder Access
- ❌ No access to `/admin/*` routes
- ✅ Redirected to `/bidder/*` routes

### Unauthenticated Access
- ❌ All `/admin/*` redirected to login
- ✅ Redirected to `/login`

---

## 📊 Dashboard Metrics Explanation

| Metric | Calculation | Source |
|--------|-------------|--------|
| Total | Count of all tenders | `tenders.length` |
| Draft | Count of status='DRAFT' | Filter tenders |
| Published | Count of status='PUBLISHED' | Filter tenders |
| Closed | Count of status='CLOSED' | Filter tenders |
| Upcoming | Published tenders with deadline in next 7 days | Calculate from submission_deadline |

---

## 🔍 Debugging Tips

### Issue: Sidebar doesn't highlight nested route
- Check `rootPath` property in menu item
- Example: `/admin/tender/edit/123` needs `rootPath: "/admin/tender"`
- The `isRouteActive()` function uses `startsWith()` matching

### Issue: Dashboard doesn't show tenders
- Check network tab for `/api/tenders` call
- Verify token is passed: `await tenderService.listTenders(token)`
- Check backend logs for 401/403 errors
- Verify role is "authority" (case-sensitive)

### Issue: Can't navigate to tender view
- Verify route exists: `/admin/tender/view/:tenderId` in App.jsx
- Check Link href: `to={'/admin/tender/view/' + id}` or template literals
- Verify tender ID is correct (should be `tender_id` from DB)

### Issue: "Not found" error on TenderView
- Likely 404 from backend - tender doesn't exist
- Check if tender is actually published (only authority can view)
- Try direct API call: GET `/api/tenders/:id`

---

## 📝 Status Badge Reference

| Status | Badge Style | Used In |
|--------|-------------|---------|
| DRAFT | Gray background | TendersList, Dashboard (future) |
| PUBLISHED | Green background | TendersList, Analytics, Dashboard |
| CLOSED | Red background | TendersList, Analytics |

---

## 🚀 Performance Considerations

### Data Fetching
- Dashboard: Single API call on mount
- TendersList: Single API call, filtered in memory
- Analytics: Single API call, computed metrics
- **No duplicate calls** - proper useEffect dependencies

### Optimization Opportunities (Future)
- Pagination for large tender lists
- Server-side filtering/search
- Caching with React Query or SWR
- Lazy load sections content
- Virtualize long tables

---

## 🔐 Security Checklist

- ✅ All /admin routes protected by ProtectedRoute
- ✅ Role checked: `allowedRoles={["authority"]}`
- ✅ Token required for all API calls
- ✅ Tender ID from backend (not user input)
- ✅ Publish action locked to backend validation
- ✅ Edit/Delete restricted to own tenders

---

## 📖 API Endpoints Used

### Tenders
- `GET /api/tenders` - List user's tenders
- `GET /api/tenders/:id` - Get tender detail
- `POST /api/tenders` - Create tender
- `PUT /api/tenders/:id` - Update tender
- `DELETE /api/tenders/:id` - Delete tender
- `POST /api/tenders/:id/publish` - Publish tender
- `POST /api/tenders/:id/sections` - Add section
- `PUT /api/tenders/sections/:id` - Update section

### Related
- `GET /auth/me` - Current user info (from AuthContext)

---

## 🎨 Styling Guidelines

### Colors Used
- **Primary**: `bg-primary-600`, `text-primary-600`
- **Success**: `bg-emerald-50`, `text-emerald-700`
- **Warning**: `bg-amber-600`, `text-amber-700`
- **Error**: `bg-red-50`, `text-red-700`
- **Neutral**: `bg-neutral-50`, `text-neutral-900`

### Common Classes
- Buttons: `px-4 py-2 rounded-md text-sm font-medium`
- Cards: `bg-white border border-neutral-200 rounded-lg p-6`
- Section headers: `text-base font-semibold text-neutral-900`

---

## ✨ Best Practices

1. **Always check loading state** before rendering data
2. **Always handle errors** with user-friendly messages
3. **Always use token from useAuth()** for API calls
4. **Always validate role before rendering** sensitive content
5. **Use TenderStatusBadge** for status display consistency
6. **Link to real pages**, never use `href="#"`
7. **Test navigation flows** across all pages
8. **Update Sidebar menu** when adding new admin pages

---

## 📞 Support

For issues or questions about the admin system:
1. Check ADMIN_REFACTOR_SUMMARY.md for overview
2. Check ADMIN_VERIFICATION_CHECKLIST.md for detailed features
3. Review the specific component file
4. Check backend logs for API errors
5. Verify role is "authority" and token is valid
