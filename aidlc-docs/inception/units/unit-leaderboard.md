# UNIT-005: Leaderboard

**Status:** Planned  
**Epic:** EP-005  
**Story Points:** 8  
**Priority:** Medium - Social motivation

---

## Unit Overview

### Purpose
Provide social motivation through competitive leaderboards showing top learners by XP.

### Scope
- Global leaderboard (top 100 users)
- User ranking display
- Real-time updates

### Business Value
- Drives engagement through competition
- Social proof (users see others succeeding)
- Viral potential (users share rankings)
- Gamification element (compete for top spots)

### Out of Scope (V1)
- Friend leaderboards
- Weekly/monthly leaderboards
- Category leaderboards (by module)

---

## Related User Stories

### US-035: Global Leaderboard (Top 100)
**Status:** Planned → Needs Implementation  
**Priority:** Medium  
**Story Points:** 5

**Acceptance Criteria:**
1. Display top 100 users by `total_xp`
2. Each entry: Rank, display name, total XP, optional avatar
3. Current user highlighted (even if outside top 100)
4. If user not in top 100: Show rank below list
5. Updates in real-time or on page load
6. Ties handled by earliest achiever
7. Pagination or infinite scroll (optional)
8. Mobile responsive

**Implementation:**
- Page: `app/leaderboard/page.tsx` (new)
- Query: `SELECT display_name, total_xp FROM user_profiles ORDER BY total_xp DESC LIMIT 100`
- Index: `CREATE INDEX idx_profiles_xp ON user_profiles(total_xp DESC)`

---

### US-036: User Ranking Display
**Status:** Planned → Needs Implementation  
**Priority:** Low  
**Story Points:** 2

**Acceptance Criteria:**
1. User's rank displayed on dashboard/profile
2. Format: "Rank #X" with icon
3. Rank updates when XP changes
4. For users with 0 XP: "Unranked"
5. Clicking rank links to leaderboard

**Implementation:**
- Display on dashboard
- Query: `SELECT COUNT(*) + 1 FROM user_profiles WHERE total_xp > user.total_xp`

---

### US-037: Friend Leaderboards (Future)
**Status:** Planned → Out-of-Scope (V2)  
**Priority:** Low  
**Story Points:** 8

**Deferred to V2 - requires friend system**

---

## Technical Architecture

### Pages
```
/app/leaderboard/page.tsx  # Leaderboard page (new)
```

### Components
```
/app/components/Leaderboard.tsx      # Leaderboard component
/app/components/LeaderboardEntry.tsx # Individual entry
```

---

## Data Models

### Query: Top 100 Users
```sql
SELECT 
  display_name,
  total_xp,
  ROW_NUMBER() OVER (ORDER BY total_xp DESC) as rank
FROM user_profiles
WHERE total_xp > 0
ORDER BY total_xp DESC
LIMIT 100;
```

### Index for Performance
```sql
CREATE INDEX idx_profiles_xp 
ON user_profiles(total_xp DESC);
```

---

## Dependencies

### Depends On
- **UNIT-003 (XP/Progress):** Requires `total_xp` tracking

---

## Security Considerations

### Privacy
- Only show display names (not emails)
- Users can opt out of leaderboard (future)
- No sensitive information exposed

### RLS
- Leaderboard data is public (read-only)
- Users cannot modify others' XP

---

## Testing Strategy

### Unit Tests
- Rank calculation logic
- Query performance

### E2E Tests
- View leaderboard
- See own rank
- Rank updates after earning XP

---

## Implementation Notes

### Current Status
- ❌ Not yet implemented (10 hours estimated)

### Remaining Work
1. Create leaderboard page (3 hours)
2. Implement leaderboard component (3 hours)
3. Add rank display to dashboard (2 hours)
4. Test and polish (2 hours)

**Total: ~10 hours**

---

## Success Criteria

UNIT-005 is complete when:
1. ✅ Leaderboard shows top 100 users
2. ✅ User's rank displays on dashboard
3. ✅ Leaderboard updates when XP changes
4. ✅ Performance acceptable (query < 100ms)
5. ✅ Mobile responsive

---

**End of UNIT-005: Leaderboard**
