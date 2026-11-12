# Product Requirements Document (PRD)
## School of Discipleship

**Status:** Implementation specification  
**Reference:** The supplied School of Discipleship UI prototype  
**Roles:** Student and Admin only

---

## 1. Product overview

Build a responsive web application for a School of Discipleship. It will support student applications and enrollment, discipleship course delivery, assessments, learning progress, payments, announcements, and certificates.

The supplied UI prototype is the visual and functional reference. Where the prototype does not define a behaviour, the AI IDE should record an assumption rather than silently inventing a business rule.

## 2. User roles

The system has exactly two application roles.

### 2.1 Student

A Student can:

- Register and sign in using email/password or Google OAuth.
- Verify their email and reset their password.
- Manage permitted profile information.
- Submit an application and view its status.
- View enrollment and cohort information assigned by Admin.
- Access the programme and published learning content available to them.
- Watch lesson videos and read lesson content.
- Access downloadable learning resources.
- Complete lessons and track their own progress.
- Take quizzes and view their own results and attempt history.
- View announcements intended for them.
- View payment records associated with their enrollment.
- View and download a certificate after meeting completion requirements.

A Student cannot:

- Change their application to approved.
- Assign themselves a cohort or enrollment.
- Change their role.
- Change payment status.
- Set their own quiz score or pass status.
- Unlock restricted modules by changing browser state or calling APIs directly.
- Issue or modify their own certificate.
- Access another student's private information.

### 2.2 Admin

Admin is the facilitator, trainer, and application administrator. There are no separate facilitator, trainer, or director roles.

Admin can:

- View the Admin dashboard and student records.
- Review, approve, reject, or request more information for applications.
- Create and manage student enrollments and cohorts.
- Create and manage programmes, modules, lessons, videos, and resources.
- Create and manage quizzes, questions, pass marks, and attempt rules.
- Monitor student lesson progress and quiz performance.
- Manage announcements.
- View and manage payment records, subject to verified payment-provider events.
- Issue or revoke certificates according to programme rules.
- Manage student accounts and permitted profile details.
- View relevant operational activity and reports.

Admin-only actions must be authorized by the backend and database policies, not merely hidden in the frontend.

## 3. Core features and requirements

### 3.1 Public website

Provide:

- Homepage.
- About the School.
- Programme and curriculum overview.
- Enrollment/application page.
- Login and registration pages.
- Contact information and calls to action.

### 3.2 Authentication

Support:

- Email/password registration and login.
- Google OAuth.
- Email verification.
- Password reset.
- Logout and session persistence.
- Protected Student and Admin areas.

A Gmail address can be used through Google OAuth or through email/password authentication. Gmail is not a separate authentication protocol.

### 3.3 Application and enrollment workflow

1. A prospective student creates an account.
2. The student completes and submits an application.
3. Admin reviews the application.
4. Admin approves, rejects, or requests additional information.
5. For an approved application, Admin creates or confirms the enrollment and assigns a cohort where cohorts are used.
6. The Student sees their application and enrollment status.
7. Access to the programme follows the enrollment and publication rules.

Application statuses:

- `draft`
- `submitted`
- `under_review`
- `additional_information_required`
- `approved`
- `rejected`
- `withdrawn`

### 3.4 Student dashboard

Display relevant information:

- Welcome and profile summary.
- Application/enrollment status.
- Assigned programme and cohort.
- Current module and learning progress.
- Completed and remaining lessons.
- Quiz results and attempts.
- Announcements.
- Payment status where applicable.
- Certificate status.

### 3.5 Learning programme

Initial curriculum:

**Module 1 — Foundations of Faith**
- Repentance
- Salvation
- Water Baptism

**Module 2 — The Holy Spirit**
- Baptism of the Holy Spirit
- Gifts of the Spirit
- Fruit of the Spirit

**Module 3 — Christian Disciplines**
- Fasting
- Prayer
- Word Study

Each module supports a description, learning objectives, ordered lessons, and associated assessments. Each lesson can contain formatted text, a video URL, and resources.

Curriculum content must be managed by Admin through the application. Do not hardcode lesson content into frontend components.

### 3.6 Learning progression

- Students can access published content permitted by their enrollment.
- Record lesson progress for each student.
- Support ordered lessons and modules.
- Default quiz pass mark is 70%, configurable by Admin.
- The next module can be locked until required lessons and assessments in the preceding module are completed and passed.
- Enforce all completion and unlocking rules on the backend.
- Do not rely on client-side state as proof of completion.

The exact rule for whether every lesson quiz is required must be configurable or confirmed against the prototype.

### 3.7 Quizzes

Support:

- Multiple-choice questions.
- True/false questions.
- Configurable pass mark.
- Optional attempt limit.
- Submission and grading.
- Score and pass/fail result.
- Attempt history.

Correct answers must never be included in student-facing quiz responses before submission. Grade submissions in trusted backend logic.

### 3.8 Announcements

Admin can create, publish, and manage announcements. Students can view announcements that apply to them. Support read/unread state if required by the prototype.

### 3.9 Payments

Store payment records and provider references. Proposed first provider: Paystack; Flutterwave may be added later.

Payment statuses:

- `pending`
- `successful`
- `failed`
- `refunded`
- `cancelled`

The backend must verify provider callbacks/webhooks. Never trust a payment status sent by the browser.

### 3.10 Certificates

- Determine eligibility using backend-verified completion data.
- Issue certificates through an Admin-authorized operation or an explicitly approved automatic workflow.
- Generate a unique certificate number.
- Store the certificate file in private storage.
- Allow the Student to view/download their own issued certificate.
- Support certificate revocation by Admin with an audit record.

### 3.11 Admin dashboard

Provide an operational overview of:

- Total students.
- New and pending applications.
- Approved applications and active enrollments.
- Student progress.
- Quiz performance.
- Payment summaries.
- Programme completion and certificates.

## 4. Non-functional requirements

### Security and privacy

- Use Supabase Auth for identity.
- Enable Row Level Security (RLS) on application tables.
- Verify access tokens in FastAPI.
- Enforce the two-role authorization model on the server.
- Keep Supabase secret/service-role credentials on the backend only.
- Keep quiz answer keys private.
- Protect private storage objects with policies and signed URLs.
- Validate uploaded file type and size.
- Verify payment webhooks.
- Record important Admin actions in audit logs.

### Usability and accessibility

- Responsive desktop, tablet, and mobile layouts.
- Accessible labels, keyboard navigation, and validation messages.
- Clear loading, empty, error, and success states.
- Follow the supplied prototype's visual language.

### Performance and maintainability

- Paginate large student and application lists.
- Index foreign keys and common filters.
- Use reusable UI components.
- Use typed API request/response schemas.
- Manage schema changes with SQL migrations.
- Include automated tests and setup documentation.

## 5. Acceptance criteria

The first usable release is acceptable when:

1. A user can register and sign in using email/password.
2. Google OAuth works after credentials and redirect URLs are configured.
3. A Student can submit an application.
4. Admin can review and decide on an application.
5. Admin can enroll an approved Student.
6. Admin can create and publish programmes, modules, lessons, and quizzes.
7. An enrolled Student can access permitted learning content.
8. Lesson progress is saved and displayed correctly.
9. A Student can submit a quiz and receive a backend-calculated result.
10. Passing required assessments unlocks the next required module.
11. Admin can monitor student progress.
12. Payment records can be stored and payment status verified securely.
13. Eligible students can receive and download certificates.
14. Students cannot access another student's private records or Admin functions.
15. Admin-only operations cannot be performed by a Student through direct API or database requests.

## 6. Technical architecture

- Frontend: Next.js + React + TypeScript + Tailwind CSS.
- Backend: Python + FastAPI.
- Database: Supabase PostgreSQL.
- Authentication: Supabase Auth.
- File storage: Supabase Storage.
- Frontend Supabase client: publishable key only.
- Backend: verify Supabase JWTs and use a server-side client or restricted database connection for privileged operations.

## 7. Assumptions to confirm during implementation

- Whether a student must pay before enrollment approval, before course access, or not at all.
- Whether cohorts are required for every programme.
- Whether every lesson has a quiz or only selected lessons/modules.
- Whether discussions or mentorship notes are in scope for the initial release. They are not mandatory in the first release unless confirmed by the prototype.
- Whether certificate issuance is automatic after completion or requires Admin approval.
