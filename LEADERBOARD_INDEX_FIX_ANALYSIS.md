# Leaderboard Index Staleness - Analysis & Long-Term Solutions

## Current Situation

**Problem:** Leaderboard shows stale XP (50) when database has correct XP (85)
**Root Cause:** Database index `idx_user_profiles_leaderboard` is stale
**Current Fix:** Fetch all users, sort in memory (works but inefficient)

## Does Current Fix Work for Others?

✅ **YES** - When someone earns XP and refreshes:
- The table updates immediately (total_xp = 85)
- Our query fetches from the table (not the stale index)
- They see their correct rank immediately

**However:** This fix is inefficient for large datasets (1000+ users)

## Is Current Fix Long-Term?

❌ **NO** - It's a bandaid because:
1. **Inefficient:** Fetches ALL users every time (slow with 1000+ users)
2. **Doesn't fix root cause:** Index is still stale
3. **Not scalable:** Will break with growth

## Long-Term Solutions (Ranked by Priority)

### Option 1: Rebuild Index Periodically (RECOMMENDED)
**Best for:** Production, minimal code changes

**How:**
1. Run `REINDEX INDEX idx_user_profiles_leaderboard;` daily via cron
2. Or trigger rebuild when XP updates exceed threshold

**Pros:**
- Fast queries (uses index)
- Accurate data
- Minimal code changes

**Cons:**
- Requires database access for REINDEX
- Index rebuild takes time (seconds for large tables)

**Implementation:**
```sql
-- Run this daily via Supabase cron or scheduled job
REINDEX INDEX idx_user_profiles_leaderboard;
```

### Option 2: Hybrid Approach (CURRENT IMPLEMENTATION)
**Best for:** Development, gradual migration

**How:**
- Use index in production (trust it)
- Verify freshness in development
- Fallback to full fetch if stale detected

**Pros:**
- Works in both dev and prod
- Detects staleness automatically
- Safe fallback

**Cons:**
- Still inefficient if index is stale
- Extra query for verification

### Option 3: Database Function with Fresh Query
**Best for:** Guaranteed freshness, performance

**How:**
- Create RPC function that forces fresh query
- Use `FORCE INDEX SCAN` or similar

**Pros:**
- Always fresh
- Can optimize at database level

**Cons:**
- More complex
- Requires database migration

### Option 4: Materialized View with Auto-Refresh
**Best for:** Very large datasets, read-heavy workloads

**How:**
- Create materialized view
- Refresh on XP updates (trigger) or periodically

**Pros:**
- Very fast queries
- Can refresh on-demand

**Cons:**
- More complex setup
- Requires trigger maintenance

## Recommended Long-Term Solution

**For Now (Next 1-2 weeks):**
- Keep current hybrid approach (works, detects staleness)
- Monitor performance

**For Production (After 100+ users):**
1. **Set up daily index rebuild:**
   ```sql
   -- Add to Supabase cron jobs or scheduled tasks
   REINDEX INDEX idx_user_profiles_leaderboard;
   ```

2. **Or add trigger to rebuild index when XP changes significantly:**
   ```sql
   -- Rebuild index when total_xp changes by > 10%
   -- (More complex, but automatic)
   ```

3. **Monitor index health:**
   - Check `pg_stat_user_indexes` for index usage
   - Alert if staleness detected

## Why Index Gets Stale

PostgreSQL indexes **should** auto-update, but can become stale due to:
1. **Transaction isolation:** Long-running transactions
2. **Index corruption:** Rare, but possible
3. **Query plan cache:** Cached plans using old index state
4. **Vacuum lag:** Index not vacuumed properly

## Testing

**To verify fix works:**
1. User A earns XP → refreshes leaderboard → sees correct rank ✅
2. User B earns XP → User A refreshes → sees User B's new rank ✅
3. Multiple users earn XP → all see correct ranks ✅

**To test index staleness:**
1. Check terminal logs for `⚠️ Index staleness detected!`
2. If seen, index needs rebuild
3. Run `REINDEX INDEX idx_user_profiles_leaderboard;`

## Next Steps

1. ✅ Current fix works (others can see rank changes)
2. ⏳ Monitor for index staleness in production
3. ⏳ Set up daily index rebuild (when you have 100+ users)
4. ⏳ Consider materialized view if leaderboard becomes slow

