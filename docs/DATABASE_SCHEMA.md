# Database Schema
## School of Discipleship — Supabase PostgreSQL

**Application roles:** Student and Admin only.  
**Admin includes:** facilitator, trainer, and administrator responsibilities.  
**No separate facilitator, trainer, or director roles are to be created.**

---

## 1. Conventions

- PostgreSQL on Supabase.
- UUID primary keys, generally generated with `gen_random_uuid()`.
- `TIMESTAMPTZ` for timestamps.
- `NUMERIC` for scores and percentages.
- Monetary values stored as integer minor units plus ISO currency code.
- Foreign keys and CHECK constraints for integrity.
- RLS enabled on all application tables.
- Use migrations; do not rely on manual production edits.

Use `auth.users.id` as the identity source. `public.profiles.id` references it.

## 2. Role model

Use exactly two role values:

- `student`
- `admin`

Recommended implementation: a `profiles.role` column with a database CHECK constraint, or a protected role-assignment table if multi-role extensibility is genuinely required. For this application, a single role column is simpler and avoids unnecessary role complexity.

The role must never be editable by a Student. Only a trusted Admin-authorized operation or secure provisioning process can assign Admin.

## 3. Tables

### 3.1 `profiles`

One application profile per Supabase Auth user.

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK, FK to `auth.users.id`, ON DELETE CASCADE |
| `role` | TEXT | NOT NULL, CHECK in (`student`, `admin`), default `student` |
| `first_name` | TEXT | NOT NULL |
| `last_name` | TEXT | NOT NULL |
| `email` | TEXT | NOT NULL |
| `phone` | TEXT | NULL |
| `avatar_path` | TEXT | NULL; storage object path |
| `address` | TEXT | NULL |
| `is_active` | BOOLEAN | NOT NULL default true |
| `created_at` | TIMESTAMPTZ | NOT NULL default now() |
| `updated_at` | TIMESTAMPTZ | NOT NULL default now() |

Email should be kept synchronized with the Auth identity through a trusted trigger or backend process. Do not allow a Student to change `role` or `is_active`.

### 3.2 `branches`

Optional organizational locations if the school operates multiple branches.

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `name` | TEXT | NOT NULL |
| `description` | TEXT | NULL |
| `location` | TEXT | NULL |
| `is_active` | BOOLEAN | NOT NULL default true |
| `created_at` | TIMESTAMPTZ | NOT NULL default now() |

### 3.3 `cohorts`

Groups of students taking a programme together.

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `branch_id` | UUID | FK `branches.id`, NULL |
| `name` | TEXT | NOT NULL |
| `description` | TEXT | NULL |
| `start_date` | DATE | NULL |
| `end_date` | DATE | NULL |
| `status` | TEXT | CHECK: planned, active, completed, cancelled |
| `created_at` | TIMESTAMPTZ | NOT NULL default now() |

### 3.4 `applications`

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `student_id` | UUID | FK `profiles.id`, NOT NULL |
| `branch_id` | UUID | FK `branches.id`, NULL |
| `application_number` | TEXT | UNIQUE, NOT NULL |
| `status` | TEXT | CHECK: draft, submitted, under_review, additional_information_required, approved, rejected, withdrawn |
| `personal_information` | JSONB | NOT NULL default `{}` |
| `motivation` | TEXT | NULL |
| `reviewed_by` | UUID | FK `profiles.id`, NULL |
| `reviewed_at` | TIMESTAMPTZ | NULL |
| `review_notes` | TEXT | NULL |
| `submitted_at` | TIMESTAMPTZ | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL default now() |
| `updated_at` | TIMESTAMPTZ | NOT NULL default now() |

Only the owner Student can create and view their application. Only Admin can change review status and review fields.

### 3.5 `programmes`

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `title` | TEXT | NOT NULL |
| `slug` | TEXT | UNIQUE, NOT NULL |
| `description` | TEXT | NULL |
| `cover_image_path` | TEXT | NULL |
| `duration_weeks` | INTEGER | NULL, CHECK > 0 |
| `is_published` | BOOLEAN | NOT NULL default false |
| `created_by` | UUID | FK `profiles.id` |
| `created_at` | TIMESTAMPTZ | NOT NULL default now() |
| `updated_at` | TIMESTAMPTZ | NOT NULL default now() |

### 3.6 `enrollments`

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `student_id` | UUID | FK `profiles.id`, NOT NULL |
| `programme_id` | UUID | FK `programmes.id`, NOT NULL |
| `cohort_id` | UUID | FK `cohorts.id`, NULL |
| `application_id` | UUID | FK `applications.id`, NULL |
| `status` | TEXT | CHECK: pending, active, completed, suspended, withdrawn |
| `enrolled_at` | TIMESTAMPTZ | NULL |
| `completed_at` | TIMESTAMPTZ | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL default now() |

Add a suitable uniqueness rule to prevent accidental duplicate active enrollments for the same student and programme. Confirm whether re-enrollment is permitted before choosing a partial unique index.

### 3.7 `modules`

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `programme_id` | UUID | FK `programmes.id`, NOT NULL |
| `title` | TEXT | NOT NULL |
| `slug` | TEXT | NOT NULL |
| `description` | TEXT | NULL |
| `learning_objectives` | JSONB | NOT NULL default `[]` |
| `sequence_number` | INTEGER | NOT NULL, CHECK > 0 |
| `is_published` | BOOLEAN | NOT NULL default false |
| `created_at` | TIMESTAMPTZ | NOT NULL default now() |
| `updated_at` | TIMESTAMPTZ | NOT NULL default now() |

Unique constraints: `(programme_id, sequence_number)` and `(programme_id, slug)`.

### 3.8 `lessons`

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `module_id` | UUID | FK `modules.id`, NOT NULL |
| `title` | TEXT | NOT NULL |
| `slug` | TEXT | NOT NULL |
| `description` | TEXT | NULL |
| `content` | JSONB | NULL; structured lesson content |
| `video_url` | TEXT | NULL |
| `duration_minutes` | INTEGER | NULL, CHECK >= 0 |
| `sequence_number` | INTEGER | NOT NULL, CHECK > 0 |
| `is_required` | BOOLEAN | NOT NULL default true |
| `is_published` | BOOLEAN | NOT NULL default false |
| `created_at` | TIMESTAMPTZ | NOT NULL default now() |
| `updated_at` | TIMESTAMPTZ | NOT NULL default now() |

Unique constraints: `(module_id, sequence_number)` and `(module_id, slug)`.

### 3.9 `lesson_progress`

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `student_id` | UUID | FK `profiles.id`, NOT NULL |
| `lesson_id` | UUID | FK `lessons.id`, NOT NULL |
| `status` | TEXT | CHECK: not_started, in_progress, completed |
| `progress_percentage` | INTEGER | NOT NULL default 0, CHECK between 0 and 100 |
| `started_at` | TIMESTAMPTZ | NULL |
| `completed_at` | TIMESTAMPTZ | NULL |
| `last_accessed_at` | TIMESTAMPTZ | NULL |
| `updated_at` | TIMESTAMPTZ | NOT NULL default now() |

Unique constraint: `(student_id, lesson_id)`. Students can update only their own progress, but completion validation should be performed by trusted backend logic.

### 3.10 `quizzes`

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `lesson_id` | UUID | FK `lessons.id`, NOT NULL |
| `title` | TEXT | NOT NULL |
| `description` | TEXT | NULL |
| `pass_mark` | NUMERIC(5,2) | NOT NULL default 70, CHECK 0–100 |
| `max_attempts` | INTEGER | NULL, CHECK > 0 |
| `is_published` | BOOLEAN | NOT NULL default false |
| `created_at` | TIMESTAMPTZ | NOT NULL default now() |

### 3.11 `questions`

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `quiz_id` | UUID | FK `quizzes.id`, NOT NULL |
| `question_text` | TEXT | NOT NULL |
| `question_type` | TEXT | CHECK: multiple_choice, true_false |
| `options` | JSONB | NULL |
| `correct_answer` | JSONB | NOT NULL; restricted from Student access |
| `explanation` | TEXT | NULL; reveal only according to quiz policy |
| `points` | NUMERIC(8,2) | NOT NULL default 1, CHECK > 0 |
| `sequence_number` | INTEGER | NOT NULL, CHECK > 0 |

Student-facing API responses must use a safe question DTO that excludes `correct_answer` and any pre-submission grading data. Do not grant Students direct SELECT access to this table if that would expose answer keys; use a safe view or backend endpoint.

### 3.12 `quiz_attempts`

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `quiz_id` | UUID | FK `quizzes.id`, NOT NULL |
| `student_id` | UUID | FK `profiles.id`, NOT NULL |
| `attempt_number` | INTEGER | NOT NULL, CHECK > 0 |
| `score` | NUMERIC(5,2) | NULL |
| `passed` | BOOLEAN | NULL |
| `status` | TEXT | CHECK: in_progress, submitted, graded |
| `started_at` | TIMESTAMPTZ | NOT NULL default now() |
| `submitted_at` | TIMESTAMPTZ | NULL |

Unique constraint: `(quiz_id, student_id, attempt_number)`. Score and pass status must be written by trusted grading logic.

### 3.13 `quiz_answers`

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `attempt_id` | UUID | FK `quiz_attempts.id`, NOT NULL |
| `question_id` | UUID | FK `questions.id`, NOT NULL |
| `answer` | JSONB | NOT NULL |
| `awarded_points` | NUMERIC(8,2) | NULL |
| `is_correct` | BOOLEAN | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL default now() |

Unique constraint: `(attempt_id, question_id)`. Students may submit answers only for their own in-progress attempt. Grading fields are backend-controlled.

### 3.14 `resources`

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `lesson_id` | UUID | FK `lessons.id`, NULL |
| `title` | TEXT | NOT NULL |
| `description` | TEXT | NULL |
| `file_path` | TEXT | NULL |
| `external_url` | TEXT | NULL |
| `resource_type` | TEXT | CHECK: document, video, link, audio, other |
| `is_downloadable` | BOOLEAN | NOT NULL default true |
| `created_at` | TIMESTAMPTZ | NOT NULL default now() |

Require at least one of `file_path` or `external_url`.

### 3.15 `payments`

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `enrollment_id` | UUID | FK `enrollments.id`, NOT NULL |
| `student_id` | UUID | FK `profiles.id`, NOT NULL |
| `amount_minor` | BIGINT | NOT NULL, CHECK >= 0 |
| `currency` | TEXT | NOT NULL |
| `provider` | TEXT | NOT NULL |
| `provider_reference` | TEXT | UNIQUE, NOT NULL |
| `status` | TEXT | CHECK: pending, successful, failed, refunded, cancelled |
| `verified_at` | TIMESTAMPTZ | NULL |
| `paid_at` | TIMESTAMPTZ | NULL |
| `metadata` | JSONB | NOT NULL default `{}` |
| `created_at` | TIMESTAMPTZ | NOT NULL default now() |

Students can read their own payment records. Only trusted backend webhook/verification logic can change payment status.

### 3.16 `announcements`

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `title` | TEXT | NOT NULL |
| `body` | TEXT | NOT NULL |
| `target_type` | TEXT | CHECK: all, programme, cohort, individual |
| `target_id` | UUID | NULL |
| `published_by` | UUID | FK `profiles.id`, NOT NULL |
| `published_at` | TIMESTAMPTZ | NULL |
| `expires_at` | TIMESTAMPTZ | NULL |
| `is_published` | BOOLEAN | NOT NULL default false |
| `created_at` | TIMESTAMPTZ | NOT NULL default now() |

### 3.17 `notifications`

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK `profiles.id`, NOT NULL |
| `title` | TEXT | NOT NULL |
| `message` | TEXT | NOT NULL |
| `notification_type` | TEXT | NOT NULL |
| `related_entity_id` | UUID | NULL |
| `is_read` | BOOLEAN | NOT NULL default false |
| `created_at` | TIMESTAMPTZ | NOT NULL default now() |

### 3.18 `certificates`

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `enrollment_id` | UUID | FK `enrollments.id`, NOT NULL |
| `student_id` | UUID | FK `profiles.id`, NOT NULL |
| `certificate_number` | TEXT | UNIQUE, NOT NULL |
| `issued_at` | TIMESTAMPTZ | NOT NULL |
| `file_path` | TEXT | NULL |
| `status` | TEXT | CHECK: issued, revoked |
| `created_at` | TIMESTAMPTZ | NOT NULL default now() |

Certificate issuance and revocation are Admin/backend-controlled. Consider a unique constraint on `enrollment_id` if only one certificate per enrollment is allowed.

### 3.19 `audit_logs`

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `actor_id` | UUID | FK `profiles.id`, NULL |
| `action` | TEXT | NOT NULL |
| `entity_type` | TEXT | NOT NULL |
| `entity_id` | UUID | NULL |
| `metadata` | JSONB | NOT NULL default `{}` |
| `created_at` | TIMESTAMPTZ | NOT NULL default now() |

Append-only for application users. Admin actions such as application decisions, role changes, payment adjustments, and certificate issuance/revocation should be logged.

## 4. Initial curriculum seed data

Create one initial programme and three ordered modules:

1. Foundations of Faith
   - Repentance
   - Salvation
   - Water Baptism
2. The Holy Spirit
   - Baptism of the Holy Spirit
   - Gifts of the Spirit
   - Fruit of the Spirit
3. Christian Disciplines
   - Fasting
   - Prayer
   - Word Study

Seed titles and ordering only unless full lesson content is supplied. Do not invent lesson text.

## 5. Required indexes

At minimum, index:

- `profiles.role`
- `applications.student_id`, `applications.status`, `applications.created_at`
- `enrollments.student_id`, `enrollments.programme_id`, `enrollments.status`, `enrollments.cohort_id`
- `modules.programme_id`
- `lessons.module_id`
- `lesson_progress.student_id`, `lesson_progress.lesson_id`
- `quiz_attempts.student_id`, `quiz_attempts.quiz_id`
- `payments.student_id`, `payments.enrollment_id`, `payments.status`
- `announcements.is_published`, `announcements.published_at`
- `notifications.user_id`, `notifications.is_read`
- `certificates.student_id`, `certificates.certificate_number`

Unique constraints and foreign keys may already create supporting indexes; avoid redundant indexes after inspecting the migration.

## 6. RLS and authorization matrix

Enable RLS on every application table.

| Resource | Student | Admin |
|---|---|---|
| Own profile | Read/update permitted fields | Read/manage permitted profile fields |
| Other profiles | No access | Read/manage |
| Own application | Read/create/submit | Read/review/manage |
| Programmes/modules/lessons | Read published and enrolled content | Create/read/update/delete |
| Own lesson progress | Read and permitted progress actions | Read/manage |
| Quizzes | Take published eligible quizzes | Create/manage |
| Correct answers | Never directly exposed | Manage |
| Own quiz attempts/results | Read and submit answers | Read/manage |
| Payments | Read own records | Read/manage; status updates only through trusted verification |
| Announcements | Read targeted published announcements | Create/manage |
| Notifications | Read/update own read state | Create/manage as authorized |
| Certificates | Read own issued certificates | Issue/revoke/manage |
| Audit logs | No access | Read authorized logs |

RLS must be backed by appropriate policies and secure database functions/API endpoints. Avoid broad policies such as `USING (true)` on private tables.

## 7. Storage buckets

Recommended buckets:

- `avatars` — profile images; validate owner path and file type.
- `lesson-resources` — private learning resources.
- `lesson-media` — private or signed-URL media, if media is stored in Supabase.
- `certificates` — private certificate files.

Store object paths in tables. Use signed URLs for private content. For large video delivery, consider a dedicated video host and store the video URL in `lessons.video_url`.

## 8. Implementation notes

- Create SQL migrations in dependency order.
- Create `profiles` safely when a new Auth user is created.
- Do not let public signup choose the `admin` role.
- Provision the first Admin through a secure, documented process.
- Do not expose `questions.correct_answer` to Students.
- Do not accept quiz scores, payment verification, role changes, or certificate eligibility from browser input.
- Add `updated_at` triggers where needed.
- Use transactions for operations that update multiple related records.
- Test RLS using both Student and Admin accounts.
