# Discovery Plan - Iranopedia Persian Academy

**Date:** November 3, 2025  
**Project:** Iranopedia Persian Academy (Persian Language Learning SaaS)  
**Status:** Pre-Launch (90% complete)

---

## Discovery Checklist

### 1. Technical Stack Inventory
- [ ] Programming languages (TypeScript, JavaScript, SQL)
- [ ] IDE/editor and version
- [ ] Frontend framework and version
- [ ] UI/styling libraries
- [ ] Animation libraries
- [ ] Component libraries
- [ ] State management approach

### 2. Infrastructure & Deployment
- [ ] Source control platform
- [ ] Repository location and access
- [ ] CI/CD platform and configuration
- [ ] Hosting platform
- [ ] Deployment process
- [ ] Environment configuration (dev, staging, prod)
- [ ] Domain setup

### 3. Backend & Database
- [ ] Database type and provider
- [ ] Database schema documentation
- [ ] Authentication provider
- [ ] File storage solution
- [ ] RLS (Row Level Security) policies
- [ ] Database migrations approach
- [ ] Backup strategy

### 4. Payment & Monetization
- [ ] Payment processor
- [ ] Current mode (sandbox vs live)
- [ ] Pricing model
- [ ] Subscription management
- [ ] Webhook configuration
- [ ] Refund/cancellation policies

### 5. External Integrations
- [ ] External APIs (list all)
- [ ] SDKs in use
- [ ] Third-party services
- [ ] Email service provider
- [ ] Analytics platform
- [ ] Error monitoring/logging

### 6. Development Environment
- [ ] Local development setup
- [ ] Environment variables documentation
- [ ] Required tools/dependencies
- [ ] Development workflow
- [ ] Testing approach

### 7. Content & Data
- [ ] Curriculum structure
- [ ] Audio assets location
- [ ] Static assets organization
- [ ] Content management approach
- [ ] Localization/i18n support

### 8. Architecture Patterns
- [ ] Service layer architecture
- [ ] Data access patterns
- [ ] State synchronization strategy
- [ ] Caching strategy
- [ ] Error handling approach

### 9. Security & Compliance
- [ ] Authentication flow
- [ ] Authorization model (RLS)
- [ ] Environment variable security
- [ ] API key management
- [ ] GDPR/privacy considerations
- [ ] Legal documentation status

### 10. Monitoring & Observability
- [ ] Current monitoring setup
- [ ] Planned monitoring tools
- [ ] Error tracking
- [ ] Performance monitoring
- [ ] User analytics
- [ ] Cost monitoring (Supabase, Stripe)

### 11. Documentation Inventory
- [ ] README files
- [ ] Architecture documentation
- [ ] API documentation
- [ ] Development guides
- [ ] Launch checklists
- [ ] Roadmap documents

### 12. MCP Integration Opportunities
- [ ] Supabase SDK integration points
- [ ] Stripe API integration points
- [ ] Vercel deployment hooks
- [ ] Database operations candidates
- [ ] File management operations
- [ ] Analytics integration

---

## Questions Requiring Clarification

### IDE/Editor
**[Question]** What version of Cursor are you using? Is it the latest stable version?

### GitHub Repository
**[Question]** What is the exact GitHub repository URL? Is it private or public?

### Monitoring & Analytics
**[Question]** You mentioned "may add PostHog later" - are there any analytics currently implemented (even basic ones)?

### Email Service
**[Question]** Is there an email service provider configured (SendGrid, Resend, etc.) or is that part of "email not fixed" from earlier?

### Domain Configuration
**[Question]** Is app.iranopedia.com the only domain, or are there other subdomains/domains in use?

### Database Backups
**[Question]** Are Supabase automatic backups enabled, or is there a separate backup strategy?

---

## Discovery Document Sections

The final `/planning/discovery.md` will contain:

1. **Project Overview** - Purpose, status, timeline
2. **Technical Stack** - Languages, frameworks, libraries
3. **Infrastructure** - Hosting, deployment, environments
4. **Architecture** - Services, patterns, data flow
5. **Integrations** - External services, APIs, SDKs
6. **Security & Compliance** - Auth, RLS, legal docs
7. **Content & Assets** - Curriculum, audio, static files
8. **Development Workflow** - Local setup, testing, deployment
9. **Monitoring & Operations** - Logging, analytics, cost tracking
10. **Documentation Index** - Links to all existing docs
11. **MCP Integration Analysis** - Opportunities for automation

---

## Next Steps

1. ✅ Create this discovery plan
2. ⏳ Gather answers to clarification questions
3. ⏳ Review codebase for missing details
4. ⏳ Create comprehensive `/planning/discovery.md`
5. ⏳ Identify MCP integration opportunities


