# Project Decisions & Roadmap

This document captures architectural decisions made during development and outlines next steps for improving the project.

---

## Decisions Made

### Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Password Hashing | Argon2 | Modern, memory-hard algorithm resistant to GPU attacks |
| Charts | Recharts | React-native, composable, good TypeScript support |


### Security

| Decision | Implementation |
|----------|---------------|
| Rate Limiting | DB-backed fixed window (5 attempts, 15-min lockout) |
| Session Expiry | 7-day tokens with embedded expiry, server-side validation |
| Timing Attacks | `crypto.timingSafeEqual` for signature comparison |
| User Isolation | All data scoped to `userId` with ownership checks |
| Password Hashing | Argon2 with automatic salting (resistant to rainbow tables) |
| Authenticated Endpoints | All movement/workout endpoints require `authMiddleware` |

### Nutrition Feature Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Meal Types | Enum: breakfast, lunch, dinner, snack | Covers common use cases, simple UI |
| Macro Storage | Float for protein/carbs/fat, Int for calories | Precision for grams, whole numbers for kcal |
| Date Navigation | Client-side with arrows | Quick access to past days without page reload |
| Charts | 7/30 day toggle | Balance between detail and overview |
| Note Length | 100 chars max | Prevents UI overflow, encourages brevity |
| Calorie Goal | Optional per-user, stored in User model | Simple surplus/deficit tracking without complex meal planning |

---

## Known Issues & Observations

### Configuration
- **Port mismatch**: `.env` sets Vite URL as `3902` but Docker maps to `3000` - caused localhost not loading. The .env was updated locally but the fix was not committed since there's a warning to not change these variables

---

## Completed Improvements

| Category | Improvement | Why |
|----------|-------------|-----|
| Data Integrity | Database indexes on user-scoped tables | Fast queries as data grows |
| Data Integrity | Cascade delete rules | No orphaned records when user deleted |
| Data Integrity | Decimal weight support (Float) | Enables tracking 2.5kg plates |
| Validation | Unique movement names per user | Prevents duplicate entries |
| Validation | Whitespace trimming on inputs | Cleaner data, prevents " Bench Press" vs "Bench Press" |
| Performance | Memoized chart aggregations | Prevents recalculation on every render |
| Performance | User-scoped query keys | Prevents cache collisions between users |
| UX | Loading states on mutations | Prevents double-submissions |

---

## Additional Implementations (Beyond Initial Plan)

| Feature | Why |
|---------|-----|
| Settings page with name editing | Centralizes account management |
| Weight unit preference (lbs/kg) | International users expect metric support |
| Progression chart time selector | Different timeframes reveal different patterns |
| Calorie goal with surplus/deficit | Visual feedback on daily progress |

---

## Database Design Review

### Pending Issues

| Priority | Issue | Why | Fix |
|----------|-------|-----|-----|
| High | No pagination on list queries | Unbounded results slow down as data grows | Add `take`/`skip` with defaults |
| Medium | Redundant transaction in addSet | FK constraint already validates movementId | Remove transaction, handle FK error |

### Implemented ✅

- Database indexes on user-scoped tables
- Cascade delete rules on all relations
- `createdAt` timestamps on Workout and Set
- `MealType` enum for DB-level validation
- Atomic deletes and query optimizations

---

## Next Steps Recommendations

Items identified but not implemented (some may require more context on original decisions).

### High Priority - Security & Git Hygiene

| Recommendation | Why |
|----------------|-----|
| Remove `.env` from git, add `.gitignore` | Secrets can be exposed in git history |
| Create `.env.example` | Helps new developers without exposing real values |
| Add `db/` to `.gitignore` | Local DB files cause merge conflicts |
| CSRF protection | Prevents cross-site request forgery attacks |
| Stronger password requirements (8+ chars) | Current 6-char minimum is weak against brute-force |

### Medium Priority

| Recommendation | Why |
|----------------|-----|
| Proper labels on form inputs | Required for accessibility/screen readers |
| Error monitoring (Sentry) | Production errors go unnoticed without observability |

### Low Priority

| Recommendation | Why |
|----------------|-----|
| Soft deletes | Enables data recovery and audit trails |
| Auto-calculate calories from macros | Reduces manual entry errors |
