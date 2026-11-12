# School of Discipleship - Project Context

## Overview
A comprehensive web application for a School of Discipleship that supports student applications, enrollment, course delivery, assessments, progress tracking, payments, and certificates.

## Key Documentation
All project documentation is located in the `docs/` folder:
- **PRD.md** - Product Requirements Document
- **DATABASE_SCHEMA.md** - Complete database schema and RLS policies
- **TASKLIST.md** - Phased development roadmap
- **UI Prototype** - HTML reference design (School of Discipleship – UI Prototype.html)

Reference these files using: `#[[file:docs/PRD.md]]`, `#[[file:docs/DATABASE_SCHEMA.md]]`, etc.

## Architecture Stack
- **Frontend**: Next.js + React + TypeScript + Tailwind CSS
- **Backend**: Python + FastAPI
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (email/password + Google OAuth)
- **Storage**: Supabase Storage
- **Payment**: Paystack (primary), Flutterwave (future)

## Role Model (CRITICAL)
**Only TWO roles exist in this system:**
1. **student** - learners who apply, enroll, and complete courses
2. **admin** - handles facilitator, trainer, and administrator duties

**NEVER create separate facilitator, trainer, or director roles.**

## Security Requirements
1. Enable RLS on ALL application tables
2. Never expose quiz answer keys to students
3. Backend must verify all privileged operations:
   - Payment status changes
   - Quiz grading
   - Certificate eligibility
   - Role assignments
   - Application approvals
4. Students can ONLY access their own data
5. Use Supabase service role key ONLY on backend
6. Frontend uses publishable anon key only

## Database Conventions
- UUID primary keys with `gen_random_uuid()`
- `TIMESTAMPTZ` for all timestamps
- Foreign keys reference `auth.users.id` for user identity
- `profiles.id` is the FK to `auth.users.id`
- All monetary values stored as integer minor units + currency code
- Migrations only - no manual production edits

## Development Phases (from TASKLIST.md)
0. **Project structure** - Create directories (COMPLETE)
1. **Scaffold applications** - Next.js frontend + FastAPI backend
2. **Database & Supabase** - Migrations, RLS, seed data
3. **Auth & roles** - Login, OAuth, role enforcement
4. **Public website** - Homepage, application form
5. **Student portal** - Dashboard, learning, progress
6. **Admin portal** - Management, reviews, reports
7. **Quizzes** - Assessment engine with backend grading
8. **Payments** - Paystack integration with webhook verification
9. **Certificates** - Eligibility check and issuance
10. **Testing** - E2E, security, RLS validation
11. **Deployment** - Production config and docs

## Current Supabase Project
- **URL**: https://zlsijkmythaxtqrjocza.supabase.co
- **MCP**: Connected via workspace `.kiro/settings/mcp.json`
- **Authentication**: Browser OAuth (already logged in)

## Initial Curriculum (Seed Data)
### Module 1: Foundations of Faith
- Repentance
- Salvation  
- Water Baptism

### Module 2: The Holy Spirit
- Baptism of the Holy Spirit
- Gifts of the Spirit
- Fruit of the Spirit

### Module 3: Christian Disciplines
- Fasting
- Prayer
- Word Study

## Implementation Rules
1. Read PRD and DATABASE_SCHEMA before coding
2. Follow the phased approach in TASKLIST.md
3. Keep exactly two roles (student/admin)
4. Never trust browser-submitted security-critical data
5. Never expose answer keys
6. Keep secrets out of source control
7. Write tests for RLS and business rules
8. Report assumptions instead of inventing requirements
9. Use the UI prototype as the visual reference

## File References
To include full documentation in context, use:
- `#[[file:docs/PRD.md]]`
- `#[[file:docs/DATABASE_SCHEMA.md]]`
- `#[[file:docs/TASKLIST.md]]`
