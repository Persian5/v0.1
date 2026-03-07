# UNIT-001: Authentication

**Status:** Planned  
**Epic:** EP-001  
**Story Points:** 21  
**Priority:** Critical - Foundation for all other units

---

## Unit Overview

### Purpose
Provide secure user authentication and account management using Supabase Auth, enabling users to create accounts, log in, manage sessions, and update profile settings.

### Scope
- User registration with email/password
- User login and logout
- Password reset flow via email
- Email verification
- Session management (JWT tokens)
- Account settings page

### Business Value
- Foundation for personalized learning (progress tracking, XP)
- Enables subscription management and payments
- Builds trust through secure authentication
- Facilitates user retention through account persistence

### Out of Scope (V1)
- OAuth social login (Google, Apple) - Deferred to V2
- Two-factor authentication (2FA) - Future enhancement
- Account deletion - Future feature

---

## Related User Stories

### US-001: User Registration with Email/Password
**Status:** Planned → In Progress (already implemented)  
**Priority:** Critical  
**Story Points:** 3

**As a** guest visitor  
**I want to** create an account with my email and password  
**So that** I can save my progress and access my lessons from any device

**Acceptance Criteria:**
1. Registration form includes email, password, and password confirmation fields
2. Email validation: Must be valid email format
3. Password validation: Minimum 8 characters, at least one letter and one number
4. Password and confirm password must match
5. Display error messages for invalid inputs
6. On successful registration:
   - Create user account in Supabase Auth
   - Create user profile in `user_profiles` table
   - Send verification email to user
   - Redirect to onboarding or first lesson
7. Show loading state during registration process
8. Handle errors gracefully (email already exists, network errors, etc.)
9. Mobile responsive design

---

### US-002: User Login
**Status:** Planned → In Progress (already implemented)  
**Priority:** Critical  
**Story Points:** 2

**As a** registered user  
**I want to** log in with my email and password  
**So that** I can access my saved progress and continue learning

**Acceptance Criteria:**
1. Login form includes email and password fields
2. Validate email format and password not empty
3. On successful login:
   - Authenticate user via Supabase Auth
   - Create session with JWT token
   - Redirect to dashboard or last visited lesson
4. On failed login:
   - Display error message ("Invalid email or password")
   - Do not reveal which field is incorrect (security)
5. Show loading state during login process
6. "Forgot password?" link visible
7. "Don't have an account? Sign up" link visible
8. Remember session across browser sessions (unless user logs out)
9. Mobile responsive design

---

### US-003: User Logout
**Status:** Planned → In Progress (already implemented)  
**Priority:** High  
**Story Points:** 1

**As a** logged-in user  
**I want to** log out of my account  
**So that** I can secure my account when using a shared device

**Acceptance Criteria:**
1. Logout button/link accessible from account menu or header
2. On logout:
   - Clear user session (Supabase Auth sign out)
   - Clear local storage/cached data
   - Redirect to homepage or login page
3. Show confirmation ("You've been logged out")
4. No authentication required to access homepage/pricing
5. After logout, attempting to access protected pages redirects to login

---

### US-004: Password Reset Flow
**Status:** Planned → Needs Implementation (launch blocker)  
**Priority:** High  
**Story Points:** 5

**As a** user who forgot my password  
**I want to** reset my password via email  
**So that** I can regain access to my account

**Acceptance Criteria:**
1. "Forgot password?" link on login page goes to password reset page
2. Password reset form includes email field
3. On submit:
   - Send password reset email via Supabase Auth
   - Display success message ("Check your email for reset link")
   - Do not reveal if email exists in system (security)
4. Reset email includes:
   - Link to password reset confirmation page
   - Link expires after 1 hour
   - Sender is from app domain (proper email config)
5. Password reset confirmation page:
   - Validates reset token
   - Shows new password and confirm password fields
   - Same password validation as registration (8+ chars, letter+number)
6. On successful reset:
   - Update password in Supabase Auth
   - Display success message
   - Redirect to login page
7. Handle expired or invalid tokens with clear error messages
8. Mobile responsive design

**Dependencies:**
- Requires Resend email configuration (currently not set up - launch blocker)

**Technical Notes:**
- Uses Supabase Auth password reset flow
- Email template needs to be configured in Resend
- Reset link format: `https://app.iranopedia.com/auth/reset-password?token=...`

---

### US-005: Email Verification
**Status:** Planned → Needs Implementation  
**Priority:** Medium  
**Story Points:** 3

**As a** newly registered user  
**I want to** verify my email address  
**So that** the platform knows I'm a real person and can send me important updates

**Acceptance Criteria:**
1. On registration, send verification email via Supabase Auth
2. Verification email includes:
   - Welcome message
   - Verification link
   - Link expires after 24 hours
3. User can still access app without verification (soft requirement)
4. Banner/notice displayed if email not verified
5. "Resend verification email" option available
6. On clicking verification link:
   - Validate token
   - Mark email as verified in Supabase
   - Display success message
   - Redirect to app
7. Handle expired or invalid tokens
8. Mobile responsive email template

**Dependencies:**
- Requires Resend email configuration

**Technical Notes:**
- Email verification is optional for V1 (soft enforcement)
- Can be strengthened in V2 (require verification for premium)

---

### US-006: Session Management
**Status:** Planned → In Progress (already implemented)  
**Priority:** High  
**Story Points:** 2

**As a** logged-in user  
**I want** my session to persist across browser tabs and refreshes  
**So that** I don't have to log in every time I visit the app

**Acceptance Criteria:**
1. JWT token stored securely (httpOnly cookie preferred)
2. Session persists across:
   - Browser refreshes
   - New tabs
   - Browser restarts (until explicit logout)
3. Token refresh handled automatically by Supabase
4. Protected routes redirect to login if no valid session
5. Session expires after 7 days of inactivity
6. On expired session:
   - Redirect to login
   - Display message ("Session expired, please log in again")
   - Remember intended destination (redirect after login)
7. Auth state checks are server-side (secure)

**Technical Notes:**
- Supabase handles token refresh automatically
- Uses SmartAuthService for auth state management
- Server-side session validation in API routes

---

### US-007: Account Settings Page
**Status:** Planned → In Progress (already implemented)  
**Priority:** Medium  
**Story Points:** 5

**As a** logged-in user  
**I want to** view and edit my account settings  
**So that** I can update my profile information

**Acceptance Criteria:**
1. Account settings page accessible from user menu
2. Display fields:
   - Email (read-only or with change email flow)
   - Display name (editable)
   - First name (editable)
   - Last name (editable)
3. Save button to update profile
4. On save:
   - Validate inputs (no empty display name)
   - Update `user_profiles` table in Supabase
   - Show success message
   - Reflect changes immediately in UI
5. Change password option (links to password change flow)
6. Account deletion option (future - out of scope for V1)
7. Show loading state while saving
8. Handle errors gracefully
9. Mobile responsive design

**Technical Notes:**
- Account page: `/app/account/page.tsx`
- Updates `user_profiles` table
- RLS policy: Users can only update their own profile

---

## Technical Architecture

### Frontend Components
```
/app/
  auth/
    verify/         # Email verification page
  account/
    page.tsx       # Account settings page

/components/
  auth/
    AuthGuard.tsx           # Protected route wrapper
    AuthModal.tsx           # Login/signup modal (if needed)
    AuthProvider.tsx        # Auth context provider
    SmartAuthProvider.tsx   # Enhanced auth with XP reconciliation
```

### Services
```
/lib/services/
  smart-auth-service.ts    # Main auth service
  auth-service.ts          # Legacy auth utilities (if still used)
```

### Key Functions
- `SmartAuthService.signUp(email, password)` - User registration
- `SmartAuthService.signIn(email, password)` - User login
- `SmartAuthService.signOut()` - User logout
- `SmartAuthService.resetPasswordForEmail(email)` - Send reset email
- `SmartAuthService.updatePassword(newPassword)` - Update password
- `SmartAuthService.getUser()` - Get current user

---

## Data Models

### `auth.users` (Managed by Supabase)
- `id` (uuid, primary key)
- `email` (text, unique)
- `encrypted_password` (text)
- `email_confirmed_at` (timestamptz, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### `user_profiles` (Custom table)
```sql
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  email text,
  first_name text,
  last_name text,
  total_xp integer NOT NULL DEFAULT 0,
  onboarding_completed boolean NOT NULL DEFAULT false,
  review_xp_earned_today integer NOT NULL DEFAULT 0,
  review_xp_reset_at timestamptz,
  timezone text NOT NULL DEFAULT 'America/Los_Angeles',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### RLS Policies
```sql
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

-- Auto-create profile on signup (via trigger or service)
CREATE POLICY "Service can insert profiles"
ON user_profiles FOR INSERT
WITH CHECK (true);
```

---

## API Endpoints

### Authentication (Supabase Auth)
- `POST /auth/v1/signup` - Create new user
- `POST /auth/v1/token?grant_type=password` - Login
- `POST /auth/v1/logout` - Logout
- `POST /auth/v1/recover` - Send password reset email
- `POST /auth/v1/user` - Update user (password change)

### Custom API Routes (if needed)
- None required for V1 (Supabase Auth handles everything)

---

## Dependencies

### Depends On
- **Supabase Auth:** Third-party service (already configured)
- **Resend:** Email service (needs configuration for password reset and verification)

### Depended On By
- **UNIT-003 (XP/Progress):** Requires `user_profiles.id` for XP tracking
- **UNIT-002 (Lessons):** Requires authenticated user for progress tracking
- **UNIT-004 (Payments):** Requires `user_profiles.id` for subscription management
- **UNIT-005 (Leaderboard):** Requires `user_profiles` for rankings
- **UNIT-006 (Dashboard):** Requires authenticated user for stats
- **UNIT-007 (Review Mode):** Requires authenticated user for vocabulary tracking

**Critical Path:** This unit MUST be completed first before any other unit can function.

---

## Security Considerations

### Password Security
- Passwords hashed by Supabase (bcrypt)
- Never store passwords in plain text
- Minimum requirements enforced (8+ chars, letter+number)

### Session Security
- JWT tokens stored in secure httpOnly cookies
- Tokens expire after 7 days of inactivity
- Token refresh handled automatically
- HTTPS only in production

### Email Security
- SPF and DKIM configured for Resend
- Password reset links expire after 1 hour
- Email verification links expire after 24 hours
- Do not reveal if email exists in system (prevent enumeration)

### RLS (Row Level Security)
- Users can only access their own profile data
- All `user_profiles` queries filtered by `auth.uid()`
- Server-side validation for all updates

### Attack Prevention
- Rate limiting on signup/login (handled by Supabase)
- CAPTCHA (future enhancement if needed)
- Email validation to prevent fake signups

---

## Testing Strategy

### Unit Tests
- Form validation logic
- Password strength checker
- Email format validation

### Integration Tests
- Signup flow: Form submission → Supabase → Profile creation
- Login flow: Credentials → Session creation
- Password reset: Email send → Token validation → Password update

### E2E Tests
1. **Happy Path:**
   - New user signs up → Receives verification email → Logs in → Accesses dashboard
   - User logs out → Redirected to homepage → Can log back in
   - User resets password → Receives email → Sets new password → Logs in

2. **Error Cases:**
   - Signup with existing email → Error message
   - Login with wrong password → Error message
   - Expired reset token → Error message
   - Invalid email format → Validation error

### Manual Testing Checklist
- [ ] Signup on desktop
- [ ] Signup on mobile
- [ ] Login on desktop
- [ ] Login on mobile
- [ ] Password reset flow
- [ ] Email verification flow
- [ ] Session persistence (refresh page)
- [ ] Session persistence (new tab)
- [ ] Session expiration (after 7 days)
- [ ] Logout functionality
- [ ] Account settings update

---

## Implementation Notes

### Current Status (As of Nov 2025)
- ✅ **US-001 (Registration):** Implemented
- ✅ **US-002 (Login):** Implemented
- ✅ **US-003 (Logout):** Implemented
- ⚠️ **US-004 (Password Reset):** Needs email configuration (launch blocker)
- ⚠️ **US-005 (Email Verification):** Needs email configuration
- ✅ **US-006 (Session Management):** Implemented
- ✅ **US-007 (Account Settings):** Implemented

### Remaining Work (Before Launch)
1. **Configure Resend for Email (3-4 hours):**
   - Set up Resend API key in environment variables
   - Configure email templates for:
     - Password reset
     - Email verification
   - Test email deliverability
   - Configure SPF/DKIM for domain

2. **Test Email Flows (2 hours):**
   - Test password reset end-to-end
   - Test email verification end-to-end
   - Test email on mobile devices

3. **Polish Account Page (1 hour):**
   - Add change password option
   - Improve error messages
   - Test on mobile

**Total Remaining: ~6 hours**

### Gotchas & Best Practices

**Gotcha #1: Email Configuration**
- Supabase Auth requires properly configured email settings
- Without Resend, password reset won't work (launch blocker)
- Test email deliverability in production environment

**Gotcha #2: Session Persistence**
- Sessions must persist across tabs and refreshes
- Use SmartAuthProvider to handle auth state globally
- Test thoroughly on mobile (Safari, Chrome)

**Gotcha #3: RLS Policies**
- All `user_profiles` queries must filter by `auth.uid()`
- Server-side API routes should use `createClient()` from `server.ts`
- Client-side queries use `createClient()` from `client.ts`

**Best Practice #1: Error Messages**
- Generic errors for security ("Invalid email or password" instead of "Email not found")
- User-friendly messages (avoid technical jargon)
- Clear next steps ("Check your email for reset link")

**Best Practice #2: Loading States**
- Show loading spinner during async operations
- Disable submit button during processing
- Provide feedback on success/failure

**Best Practice #3: Mobile UX**
- Large touch targets for buttons
- Auto-focus on first field
- Proper keyboard types (email, password)
- Test on real devices (not just emulator)

---

## Performance Considerations

- Auth checks are fast (< 50ms) due to local JWT validation
- Profile queries use RLS (already indexed by user_id)
- Session state cached in React context (no repeated API calls)
- Token refresh handled automatically by Supabase

---

## Monitoring & Observability

### Metrics to Track
- Signup conversion rate (visitors → signups)
- Login success rate
- Password reset requests
- Email verification rate
- Session duration
- Logout frequency

### Error Monitoring
- Failed signup attempts (with reason)
- Failed login attempts
- Email delivery failures
- Token expiration errors

### Logging
- Console logs for auth events (signup, login, logout)
- Error logs for Supabase Auth failures
- Future: Sentry for production error tracking

---

## Deployment Checklist

- [ ] Supabase Auth configured in production
- [ ] Resend API key set in Vercel env vars
- [ ] Email templates created and tested
- [ ] SPF/DKIM configured for domain
- [ ] RLS policies enabled on `user_profiles`
- [ ] HTTPS enforced (Vercel handles automatically)
- [ ] Session timeout configured (7 days)
- [ ] All auth flows tested in production
- [ ] Error messages reviewed for security
- [ ] Mobile responsiveness verified

---

## Success Criteria

UNIT-001 is complete when:
1. ✅ Users can sign up with email/password
2. ✅ Users can log in and log out
3. ✅ Password reset flow works end-to-end
4. ✅ Email verification flow works end-to-end
5. ✅ Sessions persist across tabs and refreshes
6. ✅ Account settings can be updated
7. ✅ All E2E tests passing
8. ✅ No critical security vulnerabilities
9. ✅ Mobile responsive on iPhone and Android
10. ✅ Deployed to production with monitoring

---

**End of UNIT-001: Authentication**
