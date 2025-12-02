# Quick Reference Guide - TheFeed Data Quality Improvements

## 📋 Quick Links

- **Overview & Planning**: `README.md`
- **Phase 1 (Urgent)**: `phase-1-critical-fixes.md` - Start here!
- **Phase 2**: `phase-2-data-integrity.md`
- **Phase 3**: `phase-3-trust-and-ux.md`
- **Phase 4**: `phase-4-performance-and-scale.md`
- **Phase 5 (Optional)**: `phase-5-community-engagement.md`
- **Testing & Deployment**: `supporting-documentation.md`

---

## 🚨 Priority Order

### URGENT (Do First)
1. **Enhancement API Fix** - Phase 1.1
   - Currently broken, blocking admin workflow
   - Estimated: 2-3 hours
   
2. **Geocoding Bug** - Phase 1.3
   - Prevents (0,0) coordinate insertions
   - Estimated: 2 hours

3. **Feed Pagination** - Phase 1.2
   - Fixes performance issue on map
   - Estimated: 2 hours

### HIGH PRIORITY (This Sprint)
4. **Database Indices** - Phase 1.4
   - Massive performance improvement
   - Estimated: 1 hour

5. **Request Timeouts** - Phase 1.5
   - Prevents hanging requests
   - Estimated: 2-3 hours

### IMPORTANT (Next Sprint)
6. **Confidence Scoring** - Phase 2.1
   - Better data quality decisions
   - Estimated: 4-5 hours

7. **Duplicate Detection** - Phase 2.2
   - Reduces duplicates in system
   - Estimated: 5-6 hours

---

## 📊 Current State Summary

### What's Broken
- ❌ Enhancement API (schema error)
- ❌ Feed pagination (logic bug)
- ❌ Geocoding failures insert (0,0)
- ❌ No database indices (slow queries)
- ❌ No request timeouts (can hang)

### What's Working But Needs Improvement
- ⚠️ Confidence scoring (subjective LLM scores)
- ⚠️ Duplicate detection (slow O(n²))
- ⚠️ No data versioning
- ⚠️ No audit trail

### What's Working Well
- ✅ Core architecture
- ✅ Discovery pipeline structure
- ✅ Admin dashboard UI
- ✅ Resource normalization

---

## 🎯 Success Criteria by Phase

### Phase 1 Goals
- [ ] Enhancement API returns 200
- [ ] Zero (0,0) coordinates
- [ ] Queries use indices
- [ ] Map loads in <2s

### Phase 2 Goals
- [ ] Confidence score 90%+ accurate
- [ ] Duplicate rate <5%
- [ ] Phone/website validated
- [ ] Version history tracked

### Phase 3 Goals
- [ ] Verification badges visible
- [ ] Source attribution shown
- [ ] Users can report errors
- [ ] Trust signals clear

### Phase 4 Goals
- [ ] Map query <100ms
- [ ] Supports 10k+ resources
- [ ] Feed paginated
- [ ] PostGIS implemented

### Phase 5 Goals (Optional)
- [ ] 50+ verifications/week
- [ ] Provider claims working
- [ ] Gamification active
- [ ] Email notifications sent

---

## 🔧 Common Commands

### Development
```bash
# Run dev server
pnpm dev

# Run database migrations
pnpm run db:generate
pnpm run db:migrate

# Run tests
pnpm test

# Type check
pnpm tsc --noEmit
```

### Testing Specific Fixes

**Test Enhancement API:**
```bash
curl -X POST http://localhost:3000/api/admin/resources/{id}/enhance \
  -H "Cookie: better-auth.session_token={token}" \
  -H "Content-Type: application/json"
```

**Test Feed Pagination:**
```bash
curl "http://localhost:3000/api/locations?limit=10&offset=0&includeStatuses=official"
```

**Check for (0,0) coordinates:**
```sql
SELECT COUNT(*) FROM food_banks 
WHERE latitude = 0 AND longitude = 0;
-- Should return 0 after fix
```

**Test query performance:**
```sql
EXPLAIN ANALYZE 
SELECT * FROM food_banks 
WHERE LOWER(address) = LOWER('123 Main St')
  AND LOWER(city) = LOWER('Sacramento')
  AND LOWER(state) = LOWER('CA');
-- Should use idx_foodbanks_address
```

---

## 📝 Key Files to Modify

### Phase 1
- `/src/lib/admin-enhancer.ts` - Enhancement API fix
- `/src/lib/resource-feed.ts` - Pagination fix
- `/src/lib/discovery/tavily-search.ts` - Geocoding fix
- `/drizzle/0XXX_add_indices.sql` - Database indices
- `/src/lib/timeout.ts` - New timeout utility

### Phase 2
- `/src/lib/discovery/confidence-scoring.ts` - NEW FILE
- `/src/lib/discovery/duplicate-detector.ts` - NEW FILE
- `/src/lib/validation.ts` - NEW FILE
- `/src/lib/versioning.ts` - NEW FILE
- `/src/lib/schema.ts` - Add new tables

### Phase 3
- `/src/components/resource-card.tsx` - Add badges
- `/src/components/source-attribution.tsx` - NEW FILE
- `/src/app/api/resources/[id]/report/route.ts` - NEW FILE
- UI components for trust signals

### Phase 4
- `/drizzle/0XXX_postgis.sql` - PostGIS migration
- `/src/lib/geo.ts` - NEW FILE
- `/src/app/api/locations/route.ts` - Pagination
- Query optimizations

---

## 🐛 Known Issues & Workarounds

### Enhancement API Fails
**Issue:** Schema validation error  
**Workaround:** Use Option B (pure JSON parsing) if Option A fails  
**Permanent Fix:** Phase 1.1

### Map Loads Slowly
**Issue:** No pagination, full table scan  
**Workaround:** Limit query to verified resources only  
**Permanent Fix:** Phase 1.2, Phase 1.4

### Geocoding Returns (0,0)
**Issue:** Failed geocoding not handled  
**Workaround:** Manual review in admin dashboard  
**Permanent Fix:** Phase 1.3

### Duplicates Not Detected
**Issue:** O(n²) algorithm, slow  
**Workaround:** Manual deduplication  
**Permanent Fix:** Phase 2.2

---

## 📞 Getting Help

### Questions About...

**Technical Implementation**
- Review the specific phase document
- Check `supporting-documentation.md` for testing strategy
- Look at existing code for patterns

**Timeline & Prioritization**
- See `README.md` for overview
- Discuss with team during standups
- Flag blockers immediately

**Deployment & Rollback**
- See `supporting-documentation.md`
- Follow deployment checklist
- Have rollback plan ready

---

## ✅ Pre-Deployment Checklist

Before deploying ANY phase:

- [ ] All tests passing locally
- [ ] TypeScript builds without errors
- [ ] Tested on staging environment
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Rollback plan reviewed
- [ ] Team notified of deployment
- [ ] Monitoring configured
- [ ] Database backup created

---

## 📈 Progress Tracking

### Phase 1 Progress
- [ ] 1.1 Enhancement API (__ hours)
- [ ] 1.2 Feed Pagination (__ hours)
- [ ] 1.3 Geocoding Fix (__ hours)
- [ ] 1.4 Database Indices (__ hours)
- [ ] 1.5 Request Timeouts (__ hours)

**Total Phase 1:** __ / 10-12 hours

### Phase 2 Progress
- [ ] 2.1 Confidence Scoring (__ hours)
- [ ] 2.2 Duplicate Detection (__ hours)
- [ ] 2.3 Validation (__ hours)
- [ ] 2.4 Versioning (__ hours)

**Total Phase 2:** __ / 16-20 hours

---

**Last Updated:** January 2025  
**Use this guide for quick reference during implementation**
