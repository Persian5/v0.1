# Technical Discovery Document
**Project:** Iranopedia Persian Academy  
**Date:** November 3, 2025  
**Status:** Pre-Launch (90% Complete)  
**Author:** Technical Inventory Specialist  

---

## 1. PROJECT OVERVIEW

### Purpose
A gamified Persian (Farsi) language learning SaaS web application, designed as a "Duolingo replacement for Persian" targeting diaspora users and Persian learners worldwide.

### Current State
- **Technical Completion:** 90%
- **Content Completion:** Modules 1-3 built (Module 1 free, 2-3 premium)
- **Deployment:** Live on Vercel at app.iranopedia.com (subdomain)
- **Payment Status:** Stripe Sandbox (test mode), not yet live
- **Launch Target:** November 28, 2025 (controlled soft launch)

### Key Features
- Gamified lessons with multiple game types (flashcards, quizzes, matching, story conversations)
- XP system with leaderboards
- Spaced repetition vocabulary tracking
- Adaptive remediation for struggling words
- Review mode with 4 game types (audio definitions, memory game, word rush, matching marathon)
- Premium subscription paywall ($4.99/month)

---

## 2. TECHNICAL STACK

### Programming Languages
- **TypeScript** (primary) - All application code
- **JavaScript** - Next.js configuration files
- **SQL** - Supabase migrations and RLS policies

### IDE & Development Environment
- **Editor:** Cursor 1.7.28 (Universal) - Latest stable version
- **Version Control:** Git via Cursor + GitHub Cloud
- **Package Manager:** npm (v9+)
- **Node.js:** v18+ (required for Next.js 14)

### Frontend Framework & Libraries

**Core Framework:**
- **Next.js 14.2.18** - React framework with App Router
- **React 18.3.1** - UI library
- **React DOM 18.3.1** - DOM rendering

**UI & Styling:**
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **shadcn/ui** (Radix UI components):
  - `@radix-ui/react-aspect-ratio 1.1.1`
  - `@radix-ui/react-avatar 1.1.2`
  - `@radix-ui/react-dialog 1.1.4`
  - `@radix-ui/react-label 2.1.1`
  - `@radix-ui/react-progress 1.1.1`
  - `@radix-ui/react-separator 1.1.1`
  - `@radix-ui/react-slot 1.1.1`
- **class-variance-authority 0.7.1** - Component variant management
- **clsx 2.1.1** - Class name utility
- **tailwind-merge 2.5.5** - Tailwind class merging
- **tailwindcss-animate 1.0.7** - Animation utilities
- **next-themes 0.4.4** - Dark mode support (not actively used)

**Animation & Effects:**
- **Framer Motion 12.7.4** - React animation library
- **canvas-confetti 1.9.3** - Celebration animations

**Icons:**
- **lucide-react 0.454.0** - Icon library

### Backend & Database

**Backend-as-a-Service:**
- **Supabase** (Postgres 15+)
  - `@supabase/supabase-js 2.50.2` - Client library
  - `@supabase/ssr 0.6.1` - Server-side rendering support
  - `@supabase/auth-helpers-nextjs 0.10.0` - Auth integration

**Database:**
- **PostgreSQL 15+** (via Supabase)
- **9 tables:**
  - `user_profiles` - User accounts and XP
  - `user_subscriptions` - Stripe subscription status
  - `user_xp_transactions` - XP award history (idempotent)
  - `user_lesson_progress` - Lesson completion tracking
  - `user_sessions` - Session tracking (not actively used yet)
  - `user_attempts` - Generic attempt tracking (not actively used yet)
  - `vocabulary_performance` - Per-word mastery tracking
  - `vocabulary_attempts` - Per-word attempt history
  - (Auth tables managed by Supabase Auth)

**Database Features:**
- Row Level Security (RLS) policies on all tables
- Indexes for performance optimization
- JSONB columns for flexible metadata
- Unique constraints for idempotency
- Check constraints for data validation

### Payment Processing
- **Stripe 19.0.0** - Payment processing (server-side)
- **@stripe/stripe-js 8.0.0** - Stripe.js client library
- **Mode:** Sandbox/Test (not live)
- **Pricing:** $4.99/month subscription

### Testing
- **Vitest 1.6.1** - Unit testing framework
- **@vitest/ui 1.6.1** - Vitest UI dashboard
- **Coverage:** Limited (WordBankService has unit tests)

### Analytics & Monitoring
- **@vercel/analytics 1.5.0** - Basic Vercel analytics (page views, sessions, Web Vitals)
- **Supabase Database Tracking** - All user actions tracked via database rows (XP, progress, attempts)
- **Custom Event Tracking:** None implemented
- **PostHog:** Planned for future (not yet implemented)
- **User Request:** Wants tracking but doesn't know how to implement custom events

### TypeScript Configuration
- **TypeScript 5.x** - Strict mode enabled
- **ESLint 8.57.1** - Code linting
- **eslint-config-next 15.3.4** - Next.js ESLint rules

---

## 3. INFRASTRUCTURE & DEPLOYMENT

### Source Control
- **Platform:** GitHub Cloud
- **Repository:** https://github.com/Persian5/v0.1
- **Visibility:** Public (open source)
- **Note:** Code is publicly viewable. Verify no sensitive data in commit history.
- **Integration:** Connected to Cursor for automatic sync
- **Branching:** Multiple feature branches (review-game-polish, controlled-launch-prep, etc.)
- **Main Branch:** `main`
- **Commits:** 42 commits ahead of origin/main (as of session start)

### Hosting & Deployment
- **Platform:** Vercel
- **Domain:** app.iranopedia.com (subdomain of iranopedia.com)
- **Framework Preset:** Next.js
- **Build Command:** `next build`
- **Install Command:** `npm install`
- **Output Directory:** `.next`

**Domain Configuration:**
- **Current Domain:** app.iranopedia.com (subdomain only)
- **Parent Site:** iranopedia.com (separate site with 15,000 monthly users)
- **App Name:** Not decided yet (flexible, can change)
- **Domain Strategy:** Flexible, user is open to changing domain
- **Other Domains:** None configured for this app

### CI/CD Pipeline
- **Platform:** Vercel auto-deploy
- **Trigger:** Git push to connected branches
- **Build:** Automatic on push
- **Preview Deployments:** Yes (for branches)
- **Production:** Deploys from `main` branch
- **Environment Variables:** Managed in Vercel dashboard

### Environments

**Development (Local):**
- Runs in Cursor IDE
- `npm run dev` (Next.js dev server)
- Port: 3000 (default)
- Environment: `.env.local` (gitignored)
- Database: Supabase production (shared with prod)

**Production (Vercel):**
- URL: https://app.iranopedia.com
- Environment: Production env vars in Vercel
- Database: Supabase production
- SSL: Automatic via Vercel
- CDN: Vercel Edge Network

**Staging:** Not configured (preview deployments serve this purpose)

### Environment Variables

**Required Variables:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...           # Public
NEXT_PUBLIC_SUPABASE_ANON_KEY=...      # Public (safe for client)
SUPABASE_SERVICE_ROLE_KEY=...          # Private (server-only)

# Stripe
STRIPE_SECRET_KEY=sk_test_...          # Private (test mode currently)
STRIPE_PRICE_ID=price_...              # Private (subscription plan)
STRIPE_WEBHOOK_SECRET=whsec_...        # Private (webhook verification)
```

**Management:**
- Local: `.env.local` file (in `.gitignore`)
- Production: Vercel dashboard → Environment Variables
- Security: No API keys in code, server-only keys not exposed to client

---

## 4. ARCHITECTURE & DESIGN PATTERNS

### Service Layer Architecture

**Pattern:** Service-oriented architecture with clear separation of concerns

**Core Services:**

1. **XpService** (`lib/services/xp-service.ts`)
   - XP calculations and awards
   - Idempotent XP transactions (stepUid-based)
   - Cache versioning for UID changes
   - Supabase integration via `user_xp_transactions`

2. **LessonProgressService** (`lib/services/lesson-progress-service.ts`)
   - Lesson completion tracking
   - Dynamic navigation logic
   - Supabase integration via `user_lesson_progress`

3. **VocabularyService** (`lib/services/vocabulary-service.ts`)
   - Vocabulary data fetching (still uses localStorage)
   - Curriculum integration
   - Word filtering and lookup

4. **VocabularyTrackingService** (`lib/services/vocabulary-tracking-service.ts`)
   - Per-word performance tracking
   - Mastery level calculation
   - Spaced repetition scheduling
   - Remediation queue management
   - Supabase integration via `vocabulary_performance` and `vocabulary_attempts`

5. **ReviewSessionService** (`lib/services/review-session-service.ts`)
   - Daily XP cap management (1000 XP for review mode)
   - Timezone handling
   - Review game vocabulary selection
   - Supabase integration via `user_profiles`

6. **WordBankService** (`lib/services/word-bank-service.ts`)
   - Word bank generation for sequence games
   - Distractor selection (semantic groups)
   - Answer validation (normalization, synonym handling)
   - Phrase detection and filtering
   - In-memory LRU cache (100 entries)

7. **ModuleAccessService** (`lib/services/module-access-service.ts`)
   - Premium access checking
   - Module paywall enforcement
   - Supabase integration via `user_subscriptions`

8. **SmartAuthService** (`lib/services/smart-auth-service.ts`)
   - Authentication state management
   - XP reconciliation (localStorage → Supabase)
   - Session persistence

9. **AudioService** (`lib/services/audio-service.ts`)
   - Audio playback for vocabulary

**Service Benefits:**
- Abstraction layer between UI and data
- Easy to test and mock
- Storage implementation can change without UI changes
- Business logic centralized

### Data Flow Architecture

```
Curriculum (Source of Truth)
    ↓
Services (Business Logic)
    ↓
React Components (UI)
    ↓
Supabase (Persistence) / localStorage (legacy)
```

### State Management

**Pattern:** Hooks + Context + Service Layer

**React Hooks:**
- `useSmartXp` - XP state with optimistic updates
- `useSmartProgress` - Lesson progress state
- `use-xp` - Legacy XP hook (being replaced)
- `use-progress` - Legacy progress hook (being replaced)

**Context Providers:**
- `AuthProvider` - Authentication state
- `SmartAuthProvider` - Enhanced auth with XP reconciliation
- `XpContext` - XP state (legacy, being replaced)

**Pattern Benefits:**
- Optimistic UI updates
- Automatic Supabase synchronization
- Fallback to localStorage if Supabase fails

### Routing Architecture

**Pattern:** Dynamic routing via Next.js App Router

**Key Routes:**
- `/` - Homepage
- `/modules` - Module overview
- `/modules/[moduleId]/[lessonId]` - Dynamic lesson pages
- `/review` - Review mode hub
- `/review/audio-definitions` - Audio review game
- `/review/memory-game` - Memory card game
- `/review/word-rush` - Word rush game
- `/review/matching-marathon` - Matching marathon game
- `/account` - User account page
- `/pricing` - Pricing page
- `/billing/success` - Stripe success redirect
- `/billing/canceled` - Stripe cancel redirect
- `/api/checkout` - Stripe checkout session creation
- `/api/webhooks` - Stripe webhook handler
- `/api/check-premium` - Premium status check
- `/api/check-module-access` - Module access check
- `/api/user-stats` - Dashboard stats

**Navigation Logic:**
- NO hardcoded lesson paths
- All navigation uses `LessonProgressService.getFirstAvailableLesson()`
- Dynamic redirects based on user progress

### Content Architecture

**Single Source of Truth:** `lib/config/curriculum.ts`

**Structure:**
```typescript
{
  modules: [
    {
      id: "module1",
      lessons: [
        {
          id: "lesson1",
          steps: [
            { type: "welcome", points: 0, data: {...} },
            { type: "flashcard", points: 2, data: {...} },
            { type: "audio-sequence", points: 5, data: {...} },
            ...
          ]
        }
      ]
    }
  ],
  vocabulary: [
    { id: "salam", en: "hello", finglish: "salam", ... }
  ]
}
```

**Game Types:**
- `welcome` - Lesson introduction
- `flashcard` - Vocabulary cards
- `audio-meaning` - Listen and choose meaning
- `text-sequence` - Build sentence from words
- `audio-sequence` - Build sentence from audio
- `matching` - Match Persian to English
- `story-conversation` - Text message conversation
- `final-challenge` - Multi-step conversation

### Security Architecture

**Authentication:**
- Supabase Auth (email/password)
- JWT tokens for session management
- Server-side session validation

**Authorization:**
- Row Level Security (RLS) policies on all tables
- Policy pattern: Users can only access their own data
- Example: `user_id = auth.uid()`

**API Security:**
- Server-only API routes (`/api/*`)
- Stripe webhook signature verification
- Environment variable protection
- No client-side secrets

**Payment Security:**
- Stripe handles all PCI compliance
- Webhook verification prevents fake events
- Idempotent subscription updates
- Metadata validation before granting access

---

## 5. EXTERNAL INTEGRATIONS

### Supabase Integration

**Services Used:**
- **Authentication:** Email/password, OAuth (future)
- **Database:** PostgreSQL with RLS
- **Storage:** Planned for audio files (currently in /public)
- **Realtime:** Not currently used

**Client Libraries:**
- `@supabase/supabase-js` - Universal client
- `@supabase/ssr` - Server-side rendering
- `@supabase/auth-helpers-nextjs` - Next.js integration

**Usage Patterns:**
- `createClient()` - Client-side operations
- `createClient()` from `server.ts` - Server-side operations with auth
- Service role key for admin operations (webhooks only)

**Backup Strategy:**
- **Supabase Backups:** Not yet verified/configured
- **Current Data:** Only test data (solo founder testing)
- **Supabase Free Tier:** Includes daily automatic backups (need to confirm enabled)
- **Action Required:** Verify backups are enabled before launch
- **Backup Access:** Check Supabase dashboard → Database → Backups

### Stripe Integration

**Services Used:**
- **Checkout:** Hosted checkout pages
- **Subscriptions:** Recurring monthly billing
- **Webhooks:** Event-driven subscription updates
- **Customer Portal:** Not yet implemented

**Mode:** Test/Sandbox (not live)

**Implementation:**
- Server-side only (no client-side Stripe Secret Key)
- Webhook endpoint: `/api/webhooks`
- Checkout session: `/api/checkout`
- Success redirect: `/billing/success`
- Cancel redirect: `/billing/canceled`

**Webhook Events Handled:**
- `checkout.session.completed` - New subscription
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Subscription cancellation

**Metadata Strategy:**
- Checkout metadata includes `supabase_user_id`
- Used to link Stripe customer to Supabase user

### Vercel Integration

**Services Used:**
- **Hosting:** Serverless Next.js deployment
- **CDN:** Global edge network
- **Analytics:** Basic web analytics
- **Environment Variables:** Secure variable storage
- **Automatic HTTPS:** SSL certificates
- **Preview Deployments:** Branch-based previews

**Configuration:** `vercel.json`
```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "next dev"
}
```

### External APIs & SDKs

**Currently Used:**
- Supabase JavaScript SDK
- Stripe Node.js SDK

**NOT Currently Used (No External APIs Beyond Above):**
- No translation APIs
- No email service provider (email setup pending)
- No SMS/notification services
- No social media APIs
- No analytics beyond Vercel Analytics

**Email Service Status:**
- **Provider:** Resend (account exists)
- **Emails Collected:** Yes (email list exists)
- **Sending Configuration:** NOT configured (launch blocker)
- **User Knowledge:** Doesn't know how to send emails through Resend
- **Needed Emails:** Welcome sequence, password reset, payment confirmation, subscription updates

---

## 6. CONTENT & ASSETS

### Curriculum Structure

**Source:** `lib/config/curriculum.ts`

**Content Organization:**
- **3 modules** (Module 1 free, 2-3 premium)
- **Multiple lessons per module**
- **10-20 steps per lesson**
- **200+ vocabulary words across all modules**

**Module Status:**
- Module 1: Complete, free access
- Module 2: Complete, requires premium
- Module 3: Complete, requires premium

### Audio Assets

**Location:** `/public/audio/`

**Format:** MP3 files

**Naming Convention:** `{vocabulary_id}.mp3` (e.g., `salam.mp3`)

**Total Files:** 50+ audio files for vocabulary

**Playback:** HTML5 Audio API via AudioService

**CDN:** Served via Vercel CDN (in /public)

**Future:** May migrate to Supabase Storage for better management

### Static Assets

**Location:** `/public/`

**Assets:**
- `favicon.png` - Site favicon
- `placeholder-logo.png` - Logo placeholder
- `tehran-silhouette.svg` - Background graphic
- `tehran.png` - Tehran city image
- `worldmap.png` - World map graphic
- `carpet-border.svg` - Persian carpet border
- `girih-tile.svg` - Islamic geometric pattern
- Icons in `/public/icons/`

**Image Optimization:** Next.js automatic image optimization

### Grammar Concepts

**Source:** `lib/config/grammar-concepts.ts`

**Content:** Persian grammar explanations (not actively used in current version)

---

## 7. DEVELOPMENT WORKFLOW

### Local Development Setup

**Prerequisites:**
- Node.js 18+
- npm 9+
- Git
- Cursor IDE (or VS Code)

**Setup Steps:**
1. Clone repository
2. `npm install`
3. Create `.env.local` with Supabase + Stripe keys
4. `npm run dev`
5. Open http://localhost:3000

**Documentation:** `LOCAL_DEV_SETUP.md` (exists in repo)

### Development Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run Vitest unit tests
npm run test:ui      # Vitest UI dashboard
npm run test:coverage # Test coverage report
```

### Testing Strategy

**Current State:**
- Unit tests for `WordBankService` (7 tests)
- Manual testing for all other components
- No integration tests yet
- No E2E tests yet

**Testing Philosophy:**
- Test critical business logic (XP, tracking, word banks)
- Manual testing for UI/UX
- Real-world curriculum testing

**Future Testing:**
- Integration tests for review games
- E2E tests for signup → payment → lesson flow
- Performance testing for database queries

### Git Workflow

**Branch Strategy:**
- `main` - Production branch (deployed to Vercel)
- Feature branches for each task
- Merge to `main` when complete

**Commit Patterns:**
- Descriptive commit messages
- Multiple commits per feature
- No squashing (full history preserved)

**Current Branch:** `main` (42 commits ahead of origin)

### Database Migrations

**Location:** `/supabase/migrations/`

**Tool:** Supabase CLI (or direct SQL in Supabase dashboard)

**Migration Files:**
- `20250101000000_vocabulary_tracking.sql`
- `20250102000000_review_xp_tracking.sql`
- `add_xp_idempotency_key.sql`
- `add_xp_transactions_unique_constraint.sql`
- `create_award_step_xp_function.sql`
- `fix_xp_idempotency_constraint.sql`
- `update_award_step_xp_return_value.sql`

**Migration Strategy:**
- Run migrations in Supabase dashboard (SQL Editor)
- OR use Supabase CLI for local → remote migration
- Test migrations on production database (shared with dev)

**Safety:** Migration safety review planned before launch (2 hours allocated)

---

## 8. SECURITY & COMPLIANCE

### Authentication & Authorization

**Authentication Provider:** Supabase Auth

**Supported Methods:**
- Email/password (currently)
- OAuth (planned: Google, Apple)

**Session Management:**
- JWT tokens stored in cookies
- Server-side session validation
- Automatic token refresh

**Authorization Model:**
- Row Level Security (RLS) policies
- User isolation: `WHERE user_id = auth.uid()`
- No user can access another user's data

### Environment Variable Security

**Protection Measures:**
- `.env.local` in `.gitignore` (never committed)
- Vercel env vars encrypted at rest
- Server-only keys not exposed to client
- `NEXT_PUBLIC_*` prefix for safe public vars

**Security Audit Planned:**
- Verify no API keys in code/logs
- Check client can't access server-only keys
- Confirm env vars set correctly in Vercel

### Payment Security

**PCI Compliance:** Handled by Stripe (no card data touches servers)

**Webhook Security:**
- Signature verification using `STRIPE_WEBHOOK_SECRET`
- Prevents fake webhook attacks
- Idempotent updates (duplicate webhooks safe)

**Access Control:**
- Premium access checked server-side
- No client-side subscription status trusting
- RLS policies enforce access at database level

### Data Protection

**User Data:**
- Minimal personal data collected (email, display name)
- Passwords hashed by Supabase (bcrypt)
- No sensitive data in logs

**GDPR Considerations:**
- Account deletion option (planned)
- Data export (not yet implemented)
- Privacy Policy (needs completion)
- Terms of Service (needs completion)

**Legal Documentation Status:**
- [ ] Privacy Policy (in progress, launch blocker)
- [ ] Terms of Service (in progress, launch blocker)
- [ ] Refund Policy (in progress, launch blocker)
- [ ] Contact form (in progress, launch blocker)

---

## 9. MONITORING & OPERATIONS

### Current Monitoring

**Vercel Analytics:**
- Page views
- User sessions
- Performance metrics (Web Vitals)
- No custom event tracking (yet)

**Console Logging:**
- Extensive console logs in services
- XP awards, tracking, errors logged
- Not production-ready (needs proper logging service)

### Planned Monitoring

**PostHog (Future):**
- Custom event tracking
- User behavior analytics
- Funnel analysis
- Feature flags

**Error Monitoring:**
- Not yet implemented
- Planned: Sentry or similar

**Performance Monitoring:**
- Not yet implemented
- Planned: Supabase query performance
- Planned: API response time tracking

### Cost Monitoring

**Supabase:**
- Free tier: 500MB database, 1GB file storage, 2GB bandwidth
- Current usage: Unknown (monitoring setup planned)
- Upgrade trigger: ~500-1,000 paying users
- Pro plan: $25/month (8GB database)

**Billing Alerts Planned:**
- Email at 80% of free tier
- Weekly usage review
- Cost per user calculation

**Stripe:**
- No fixed monthly cost
- 2.9% + $0.30 per transaction
- $4.99/month * 15% conversion * signups = revenue

**Vercel:**
- Free tier: 100GB bandwidth/month
- Hobby: $20/month (unlimited bandwidth)
- Current: Unknown if on free or paid plan

---

## 10. DOCUMENTATION INDEX

### Project Documentation Files

**Planning & Vision:**
- `PRODUCT_VISION.md` - Product goals and vision
- `V0.1_LAUNCH_CHECKLIST.md` - Comprehensive launch checklist (407 lines)
- `LAUNCH_ROADMAP_AGGRESSIVE.md` - Nov/Dec 2025 launch plan (482 lines)
- `LAUNCH_ROADMAP_REALISTIC.md` - Alternative realistic timeline (347 lines)
- `SESSION_REPORT_2025-01-02.md` - Latest session report (322 lines)

**Technical Architecture:**
- `SYSTEM_ARCHITECTURE.md` - System architecture overview (251 lines)
- `database_schema.md` - Database schema documentation (107 lines)
- `rls_policies.md` - Row Level Security policies
- `DEVELOPMENT_RULES.md` - Development guidelines and patterns
- `AI_ASSISTANT_GUIDE.md` - Guide for AI assistants working on project
- `MODULE_TEMPLATES.md` - Module/lesson structure templates

**Setup Guides:**
- `LOCAL_DEV_SETUP.md` - Local development setup instructions
- `ENV_VARS_REQUIRED.md` - Required environment variables
- `SESSION_STARTUP_TEMPLATE.md` - Session startup checklist

**Stripe Integration:**
- `STRIPE_SETUP_GUIDE.md` - Stripe setup instructions
- `STRIPE_INTEGRATION_COMPLETE.md` - Stripe integration summary
- `STRIPE_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `STRIPE_QUICK_START.md` - Quick start guide
- `README_STRIPE_INTEGRATION.md` - Stripe README
- `STRIPE_FILES_CHECKLIST.md` - Stripe file checklist

**Testing & QA:**
- `REVIEW_MODE_TEST_PLAN.md` - Review mode testing plan (55 lines)
- `REVIEW_MODE_E2E_TEST_PLAN.md` - E2E test plan (356 lines)
- `REVIEW_MODE_UI_IMPROVEMENTS.md` - UI improvement notes (150 lines)
- `TECHNICAL_REPORT_WORD_BANK_SYSTEM.md` - Word bank system report

**Other:**
- `README.md` - Project README
- `components.json` - shadcn/ui configuration

---

## 11. MCP INTEGRATION ANALYSIS

### What is MCP?

MCP (Model Context Protocol) enables AI assistants to interact with external services through standardized interfaces. For this project, MCP could automate repetitive tasks and provide real-time data access.

### Potential MCP Integration Points

#### 1. **Supabase SDK MCP Integration**

**Use Cases:**
- Real-time database queries during development
- Automated migration execution
- Schema inspection and validation
- RLS policy testing
- User data queries for debugging

**Benefits:**
- AI can directly query database for troubleshooting
- Automated schema changes
- Real-time data validation during development
- Performance query analysis

**Implementation Complexity:** Medium (Supabase has JavaScript SDK)

**Priority:** High (database is core to project)

---

#### 2. **Stripe API MCP Integration**

**Use Cases:**
- Subscription status checks
- Payment history queries
- Webhook event inspection
- Customer data lookup
- Refund processing (admin tasks)

**Benefits:**
- Real-time payment troubleshooting
- Automated subscription management
- Customer support automation
- Revenue analytics

**Implementation Complexity:** Medium (Stripe has well-documented API)

**Priority:** Medium (payment is important but less frequent)

---

#### 3. **Vercel Deployment MCP Integration**

**Use Cases:**
- Automated deployment triggers
- Build status monitoring
- Environment variable management
- Log inspection
- Performance metrics

**Benefits:**
- Deploy from chat interface
- Real-time build monitoring
- Automated rollbacks
- Environment variable updates without dashboard

**Implementation Complexity:** High (Vercel API less commonly used)

**Priority:** Low (manual deployments work fine)

---

#### 4. **GitHub Repository MCP Integration**

**Use Cases:**
- Automated commits and pushes
- Branch management
- PR creation
- Code review assistance
- Issue tracking

**Benefits:**
- Commit directly from AI chat
- Automated branching strategy
- Issue creation from chat
- Code review automation

**Implementation Complexity:** Low (GitHub has excellent API)

**Priority:** Medium (useful for workflow automation)

---

#### 5. **Vocabulary/Curriculum Management MCP**

**Use Cases:**
- Add/edit vocabulary in curriculum.ts
- Generate new lessons
- Validate curriculum structure
- Audio file management
- Content consistency checks

**Benefits:**
- Rapid content creation
- Automated validation
- Content import from external sources
- Curriculum versioning

**Implementation Complexity:** Low (file-based operations)

**Priority:** High (content is core to product)

---

#### 6. **Testing & QA MCP Integration**

**Use Cases:**
- Run test suites
- Generate test reports
- Execute E2E tests
- Performance benchmarking
- Coverage analysis

**Benefits:**
- Real-time test execution
- Automated regression testing
- Performance monitoring
- Test case generation

**Implementation Complexity:** Medium (depends on test framework)

**Priority:** Medium (testing not yet mature)

---

### Recommended MCP Integration Priorities

**Phase 1 (High Priority):**
1. **Supabase SDK MCP** - Database queries, migrations, schema inspection
2. **Vocabulary/Curriculum MCP** - Content management and validation

**Phase 2 (Medium Priority):**
3. **GitHub Repository MCP** - Automated commits, branching, PR creation
4. **Stripe API MCP** - Payment troubleshooting, subscription management

**Phase 3 (Low Priority):**
5. **Vercel Deployment MCP** - Deployment automation
6. **Testing & QA MCP** - Automated testing workflows

---

## 12. CLARIFICATION QUESTIONS

### Questions Requiring User Response

1. **[Question]** What version of Cursor are you using? Is it the latest stable version?
   **[Answer]** Cursor 1.7.28 (Universal) - This is the latest stable version as of November 2025.

2. **[Question]** What is the exact GitHub repository URL? Is it private or public?
   **[Answer]** https://github.com/Persian5/v0.1 - Public repository. Repository visibility is PUBLIC which means code is open source. This is fine for an educational product, though consider if any sensitive configuration exists in commit history.

3. **[Question]** Are there any analytics currently implemented beyond @vercel/analytics? Any custom event tracking?
   **[Answer]** No analytics beyond Vercel basic analytics. No custom event tracking. All tracking is via Supabase database rows (user actions, XP, progress) or Vercel's built-in analytics. User wants tracking but doesn't know how to implement.

4. **[Question]** Is there an email service provider configured (SendGrid, Resend, etc.) or is that part of "email not fixed" from earlier?
   **[Answer]** Resend account exists with collected emails, but sending functionality is NOT configured. User doesn't know how to send emails through Resend. This is a launch blocker for welcome emails, password resets, payment confirmations.

5. **[Question]** Is app.iranopedia.com the only domain, or are there other subdomains/domains in use?
   **[Answer]** app.iranopedia.com is the only domain for this app currently. User hasn't decided on final app name yet. Domain strategy is flexible and can be changed.

6. **[Question]** Are Supabase automatic backups enabled, or is there a separate backup strategy?
   **[Answer]** No backups configured yet. Only test data exists (solo founder testing). Supabase free tier includes automatic backups (daily snapshots), but user hasn't verified this is enabled. Need to confirm before launch.

---

## 13. NEXT STEPS

### Immediate Actions Post-Discovery

1. **Complete Clarification Questions** - Get answers from user
2. **Security Audit** - Verify env protection, cost monitoring, auth flows (6 hours)
3. **Legal Documentation** - Complete Privacy Policy, Terms, Refund Policy (7 hours)
4. **Email Setup** - Configure email service provider (3 hours)
5. **Stripe LIVE** - Switch from sandbox to live mode (4 hours)

### Launch Readiness Assessment

**Based on this discovery:**
- **Technical:** 90% complete ✅
- **Content:** 95% complete ✅
- **Infrastructure:** 100% complete ✅
- **Security:** 70% complete (audit needed) ⚠️
- **Legal/Compliance:** 30% complete (blocker) 🚨
- **Monitoring:** 40% complete (basic only) ⚠️

**Estimated Hours to Launch:** 112 hours over 4 weeks

**Recommended Launch Date:** November 28, 2025 (controlled soft launch)

---

**End of Discovery Document**

