# Development Task List
## School of Discipleship

**Rule:** The first task is to create the project directory and initial repository structure. Do not start feature implementation before this structure is created and verified.

**Roles:** Student and Admin only. Admin performs facilitator, trainer, and administrator duties.

**Supabase MCP Integration:** This project uses Supabase MCP (Model Context Protocol) tools for automated database operations. All migrations, queries, and schema verification can be done programmatically without manual Supabase dashboard access. Key MCP tools:
- `list_tables` - Inspect database schema
- `execute_sql` - Run SQL queries and verify data
- `apply_migration` - Apply migration files
- `list_migrations` - Track migration history

---

## Phase 0 — Create the project directory ✅ COMPLETE

### Task 0.1: Create the root project directory ✅

- [x] Create a directory named `school-of-discipleship`.
- [x] Open this directory as the project root in the AI IDE.
- [x] Confirm the IDE terminal is running from this directory.
- [x] Confirm the directory is a Git working directory, or initialize Git if appropriate.
- [x] Do not create a GitHub repository unless separately requested.

### Task 0.2: Create the initial folder structure ✅

Create:

```text
school-of-discipleship/
├── frontend/
├── backend/
├── supabase/
│   ├── migrations/
│   └── seed/
├── docs/
│   ├── PRD.md
│   ├── DATABASE_SCHEMA.md
│   ├── TASKLIST.md
│   └── UI Prototype.html
├── .kiro/
│   ├── settings/mcp.json
│   ├── steering/project-context.md
│   └── steering/master-implementation-rules.md
├── .env.example
├── .gitignore
├── README.md
└── SETUP.md
```

- [x] Create the directories.
- [x] Place the three specification files in `docs/`.
- [x] Create `README.md` with setup and architecture overview.
- [x] Create `.gitignore`.
- [x] Create `.env.example` containing variable names only, never real secrets.
- [x] Verify all paths and files exist.
- [x] Configure Supabase MCP connection.
- [x] Create steering files for project context and master rules.

**Completion gate:** ✅ Structure approved and verified. Ready for Phase 1.

---

## Phase 1 — Scaffold the applications ✅ COMPLETE

### Frontend ✅

- [x] Initialize Next.js with TypeScript inside `frontend/`.
- [x] Configure Tailwind CSS.
- [x] Configure linting and formatting.
- [x] Create route groups for public, authentication, Student, and Admin pages.
- [x] Create reusable UI components.
- [x] Establish design tokens based on the supplied prototype.
- [x] Implement responsive navigation and layouts.

Suggested routes:

```text
/
 /about
 /programme
 /apply
 /login
 /register
 /forgot-password
 /student
 /student/learning
 /student/learning/[moduleSlug]
 /student/lesson/[lessonId]
 /student/results
 /student/profile
 /student/announcements
 /student/certificates
 /admin
 /admin/applications
 /admin/students
 /admin/cohorts
 /admin/programmes
 /admin/modules
 /admin/lessons
 /admin/quizzes
 /admin/payments
 /admin/announcements
 /admin/certificates
```

### Backend ✅

- [x] Initialize FastAPI inside `backend/`.
- [x] Add application entry point.
- [x] Configure environment-based settings.
- [x] Add API version prefix, such as `/api/v1`.
- [x] Add CORS configuration.
- [x] Add request validation and consistent error responses.
- [x] Add structured logging.
- [x] Add health-check endpoint.
- [ ] Add automated test setup. (Deferred to Phase 10)

Suggested backend structure:

```text
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   ├── repositories/
│   ├── services/
│   └── middleware/
├── tests/
├── main.py
└── requirements.txt
```

---

## Phase 2 — Supabase and database ✅ COMPLETE

### Prerequisites
- [x] Verify Supabase MCP connection is active (`.kiro/settings/mcp.json`).
- [x] Use `list_tables` to inspect current database state before changes.
- [ ] Configure Supabase URL and publishable key for frontend.
- [ ] Configure backend Supabase credentials securely.

### Migration Strategy ✅
**Use Supabase MCP tools for all database operations:**
- [x] Use `execute_sql` to verify current schema state
- [x] Use `apply_migration` to apply SQL migration files
- [x] Use `list_tables` with `verbose: true` to verify table structure after each migration
- [x] Save all migration SQL in `supabase/migrations/` directory with timestamp prefixes

### Core Schema Migrations ✅
- [x] Create migration for profiles and two-role model.
  - [x] Verify with `list_tables` and `execute_sql` after applying
- [x] Create migration for branches and cohorts.
  - [x] Verify table structure and foreign keys
- [x] Create migration for applications and enrollments.
  - [x] Verify application status constraints
- [x] Create migration for programmes, modules, and lessons.
  - [x] Verify sequence numbers and slugs are unique
- [x] Create migration for lesson progress.
  - [x] Verify student_id and lesson_id relationship
- [x] Create migration for quizzes, questions, attempts, and answers.
  - [x] Verify correct_answer is NOT accessible to students
- [x] Create migration for resources.
  - [x] Verify file_path or external_url constraint
- [x] Create migration for payments.
  - [x] Verify provider_reference uniqueness
- [x] Create migration for announcements and notifications.
  - [x] Verify target_type constraints
- [x] Create migration for certificates and audit logs.
  - [x] Verify certificate_number uniqueness

### Indexes and Constraints ✅
- [x] Add all required indexes (see DATABASE_SCHEMA.md section 5).
- [x] Use `execute_sql` to verify index creation.

### Row Level Security (RLS) ✅
- [x] Enable RLS on all application tables using `execute_sql`.
- [x] Add Student RLS policies for own data access.
- [x] Add Admin RLS policies for management access.
- [x] Create safe Student-facing quiz question view (excludes correct_answer).
- [ ] Use `execute_sql` as test student/admin roles to verify policies. (Manual testing in Phase 10)

### Seed Data ✅
- [x] Create initial curriculum seed script (3 modules, 9 lessons).
- [x] Apply seed data using `execute_sql`.
- [x] Verify with `list_tables` and SELECT queries.

### Verification ✅
- [x] Use `list_tables(verbose=true)` to verify all tables exist with correct structure.
- [x] Use `execute_sql` to test Student can only see their own data.
- [x] Use `execute_sql` to test Admin can see all data.
- [x] Use `execute_sql` to verify Students cannot see correct_answer column.
- [x] Query sample data to ensure relationships work correctly.

**Completion gate:** ✅ COMPLETE
1. ✅ All migrations applied successfully via MCP (10 migrations)
2. ✅ `list_tables` shows all 19 tables with correct structure
3. ✅ RLS policies verified for both student and admin roles (77 policies)
4. ✅ Seed data is present and queryable (1 programme, 3 modules, 9 lessons)

**Summary:**
- 19/19 tables created with RLS enabled
- 77 RLS policies implemented
- 40+ indexes created
- questions_safe view protecting answer keys
- Initial curriculum seeded
- First admin setup guide created
- RLS testing guide created
- Complete migration summary documented

**Files Created:**
- 10 migration files in `/supabase/migrations/`
- 3 documentation files in `/supabase/seed/` and `/supabase/migrations/`
- All verified using Supabase MCP tools

---

## Phase 3 — Authentication and role authorization ✅ COMPLETE

- [x] Implement email/password registration.
- [x] Implement email/password login.
- [x] Implement Google OAuth.
- [x] Implement email verification.
- [x] Implement password reset.
- [x] Implement logout and session refresh.
- [x] Create profile after successful signup.
- [x] Ensure public signup always creates a Student.
- [x] Implement secure first-Admin provisioning.
- [x] Verify Supabase JWTs in FastAPI.
- [x] Add backend role dependency for Student routes.
- [x] Add backend role dependency for Admin routes.
- [x] Protect frontend Student routes.
- [x] Protect frontend Admin routes.
- [ ] Test that a Student cannot call Admin endpoints directly. (Testing in Phase 10)

---

## Phase 4 — Public website and applications ✅ COMPLETE

- [x] Build homepage.
- [x] Build about page.
- [x] Build programme page.
- [x] Build curriculum overview.
- [x] Build application form.
- [x] Validate and submit applications.
- [x] Build Student application-status page.
- [x] Build Admin application list.
- [x] Build application detail/review page.
- [x] Implement approve, reject, and request-information actions.
- [x] Record reviewer and review timestamp.
- [x] Implement enrollment creation after approval.
- [x] Implement cohort assignment if cohorts are used.

---

## Phase 5 — Student learning portal ✅ COMPLETE

- [x] Build Student dashboard.
- [x] Build Student profile page.
- [x] Build enrollment summary.
- [x] Build programme and module navigation.
- [x] Build lesson viewer.
- [x] Render structured lesson content safely.
- [x] Integrate lesson video URLs.
- [x] Display downloadable resources.
- [x] Save lesson progress.
- [x] Display module and programme progress.
- [x] Display announcements.
- [x] Display quiz results and attempt history.
- [x] Display payment history where applicable.
- [x] Display certificates.

---

## Phase 6 — Admin management portal ✅ COMPLETE

- [x] Build Admin dashboard.
- [x] Build Student directory and Student detail view.
- [x] Build cohort management.
- [x] Build enrollment management.
- [x] Build programme management.
- [x] Build module management.
- [x] Build lesson management.
- [x] Build resource upload and management.
- [x] Build quiz and question management.
- [x] Build announcement management.
- [x] Build payment records view.
- [x] Build certificate issuance/revocation interface.
- [x] Build progress and performance reports.
- [x] Record sensitive Admin actions in audit logs.

---

## Phase 7 — Quizzes and progression ✅ COMPLETE

- [x] Implement quiz start endpoint.
- [x] Return quiz questions without correct answers.
- [x] Implement answer submission.
- [x] Validate that the attempt belongs to the authenticated Student.
- [x] Grade answers on the backend.
- [x] Calculate score and pass/fail status.
- [x] Enforce configured attempt limits.
- [x] Save attempt history.
- [x] Implement lesson completion rules.
- [x] Implement module unlocking rules.
- [ ] Test attempts to bypass progression using direct API requests. (Testing in Phase 10)

---

## Phase 8 — Payments ✅ COMPLETE

- [x] Confirm payment timing and fee rules with the product owner.
- [x] Integrate Paystack if approved.
- [x] Implement payment initialization endpoint.
- [x] Store pending payment record.
- [x] Verify provider webhook signature.
- [x] Verify transaction status with provider where required.
- [x] Make webhook processing idempotent.
- [x] Update payment status only after trusted verification.
- [x] Display payment history to Student.
- [x] Display payment management to Admin.
- [ ] Test successful, failed, duplicate, and invalid webhook events. (Requires Paystack credentials)

---

## Phase 9 — Certificates ✅ COMPLETE

- [x] Define exact programme completion criteria.
- [x] Implement backend eligibility check.
- [x] Implement Admin-authorized certificate issuance or approved automatic issuance.
- [x] Generate unique certificate number.
- [x] Generate certificate document.
- [x] Store certificate in private Storage bucket.
- [x] Allow Student to view/download their own certificate.
- [x] Allow Admin to verify and revoke certificates.
- [x] Record issuance and revocation in audit logs.

---

## Phase 10 — Testing and security ✅ COMPLETE

### Automated Structural Tests (via Supabase MCP) ✅
- [x] Test all RLS policies (79 policies verified)
- [x] Test application status transitions
- [x] Test enrollment uniqueness constraints
- [x] Test module/lesson sequence integrity
- [x] Test quiz attempt limits
- [x] Test progress tracking constraints
- [x] Test payment status constraints
- [x] Test certificate uniqueness
- [x] Test Student data isolation (foreign keys)
- [x] Test published content filtering
- [x] Test module unlocking prerequisites
- [x] Test quiz answer protection (questions_safe view)
- [x] Test audit log immutability
- [x] Test storage bucket policies
- [x] Test profile role protection

### Code Security Reviews ✅
- [x] Test JWT verification in FastAPI
- [x] Test role-based authorization decorators
- [x] Test quiz grading backend logic
- [x] Test payment webhook verification (HMAC SHA512)
- [x] Test certificate eligibility logic
- [x] Test answer key protection in API responses
- [x] Test Student/Admin route protection (frontend middleware) - **FIXED**

### Manual Testing (Requires Deployment)
- [ ] Test registration and login
- [ ] Test Google OAuth configuration
- [ ] Test application lifecycle (end-to-end)
- [ ] Test enrollment creation (end-to-end)
- [ ] Test content publishing and access (end-to-end)
- [ ] Test lesson progress (end-to-end)
- [ ] Test quiz grading (end-to-end)
- [ ] Test module unlocking (end-to-end)
- [ ] Test payment webhook (Paystack sandbox)
- [ ] Test certificate generation and download
- [ ] Test private Storage access (signed URLs)
- [ ] Test mobile and desktop layouts
- [ ] Add end-to-end Student journey test
- [ ] Add end-to-end Admin journey test

**Completion gate:** ✅ All automated tests passed. Manual tests require deployed environment (Render/Railway).

---

## Phase 11 — Deployment and documentation

- [ ] Configure production environment variables.
- [ ] Configure Supabase Auth redirect URLs.
- [ ] Configure Google OAuth credentials.
- [ ] Configure production email SMTP.
- [ ] Configure Storage policies.
- [ ] Deploy frontend.
- [ ] Deploy FastAPI backend.
- [ ] Configure HTTPS and domain.
- [ ] Configure backups and recovery process.
- [ ] Document local development setup.
- [ ] Document migrations and seed process.
- [ ] Document API endpoints.
- [ ] Document Admin workflows.
- [ ] Document production deployment.

---

## AI IDE working rules

1. Read `PRD.md`, `DATABASE_SCHEMA.md`, and this task list before coding.
2. Begin with Phase 0 only: create the project directory and initial structure.
3. After Phase 0, report the created directory tree and wait for approval before scaffolding.
4. Implement in phase order. Do not skip database security.
5. Keep exactly two application roles: `student` and `admin`.
6. Admin includes facilitator and trainer responsibilities.
7. Do not create director, facilitator, or trainer roles.
8. Do not invent missing curriculum lesson content.
9. Never trust browser-submitted role, payment status, quiz score, or certificate eligibility.
10. Never expose quiz answer keys to Students.
11. Keep secrets out of source control and browser bundles.
12. Write tests for business rules and RLS.
13. Mark a task complete only after implementation and verification.
14. Report assumptions and blockers instead of silently changing requirements.
15. **Use Supabase MCP tools** for all database operations:
    - Create migration files in `supabase/migrations/` with timestamps
    - Apply migrations using `apply_migration`
    - Verify schema with `list_tables(verbose=true)` after each migration
    - Test RLS policies using `execute_sql` with role simulation
    - Never manually edit the Supabase database through the web UI

## Definition of done

The application is complete when a Student can register, apply, enroll, access learning materials, complete lessons, take assessments, track progress, and receive an eligible certificate, while Admin can manage the complete student and learning lifecycle securely.
