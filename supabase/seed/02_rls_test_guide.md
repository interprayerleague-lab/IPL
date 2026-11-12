# RLS Policy Testing Guide

This guide provides SQL test queries to verify Row Level Security (RLS) policies are working correctly.

## Prerequisites

1. Create two test users via Supabase Auth (or frontend signup):
   - **Student user**: student@test.com
   - **Admin user**: admin@test.com

2. Get their user IDs from `auth.users`:
   ```sql
   SELECT id, email FROM auth.users WHERE email IN ('student@test.com', 'admin@test.com');
   ```

3. Set the admin role for the admin user:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE id = '<admin_user_id>';
   ```

## Test Queries

### 1. Test Student Profile Access

**As Student (should see only own profile):**
```sql
SET request.jwt.claims = '{"sub": "<student_user_id>"}';
SELECT * FROM public.profiles;
-- Should return: only student's own profile
```

**As Admin (should see all profiles):**
```sql
SET request.jwt.claims = '{"sub": "<admin_user_id>"}';
SELECT * FROM public.profiles;
-- Should return: all profiles
```

### 2. Test Quiz Answer Protection

**As Student (should NOT see correct_answer):**
```sql
SET request.jwt.claims = '{"sub": "<student_user_id>"}';
SELECT * FROM public.questions;
-- Should return: ERROR or empty (no direct access)
```

**Use safe view instead:**
```sql
SET request.jwt.claims = '{"sub": "<student_user_id>"}';
SELECT * FROM public.questions_safe;
-- Should return: questions WITHOUT correct_answer column
```

**As Admin (should see all including correct_answer):**
```sql
SET request.jwt.claims = '{"sub": "<admin_user_id>"}';
SELECT * FROM public.questions;
-- Should return: all questions with correct_answer
```

### 3. Test Payment Status Protection

**Create test enrollment and payment:**
```sql
-- As Admin, create enrollment
INSERT INTO public.enrollments (student_id, programme_id, status)
VALUES ('<student_user_id>', (SELECT id FROM public.programmes LIMIT 1), 'active');

-- As Admin, create test payment
INSERT INTO public.payments (enrollment_id, student_id, amount_minor, currency, provider, provider_reference, status)
VALUES (
    (SELECT id FROM public.enrollments WHERE student_id = '<student_user_id>' LIMIT 1),
    '<student_user_id>',
    10000,
    'NGN',
    'paystack',
    'TEST_' || gen_random_uuid()::text,
    'pending'
);
```

**As Student (should see but NOT update payment status):**
```sql
SET request.jwt.claims = '{"sub": "<student_user_id>"}';
SELECT * FROM public.payments WHERE student_id = '<student_user_id>';
-- Should return: student's own payments

UPDATE public.payments SET status = 'successful' WHERE student_id = '<student_user_id>';
-- Should return: ERROR (permission denied)
```

**As Admin (should update payment status):**
```sql
SET request.jwt.claims = '{"sub": "<admin_user_id>"}';
UPDATE public.payments SET status = 'successful', verified_at = now() 
WHERE student_id = '<student_user_id>';
-- Should return: UPDATE 1 (success)
```

### 4. Test Certificate Access

**As Admin, issue test certificate:**
```sql
SET request.jwt.claims = '{"sub": "<admin_user_id>"}';
INSERT INTO public.certificates (enrollment_id, student_id, certificate_number, issued_at, status)
VALUES (
    (SELECT id FROM public.enrollments WHERE student_id = '<student_user_id>' LIMIT 1),
    '<student_user_id>',
    'CERT-2026-00001',
    now(),
    'issued'
);
-- Should return: INSERT successful
```

**As Student (should see only own issued certificates):**
```sql
SET request.jwt.claims = '{"sub": "<student_user_id>"}';
SELECT * FROM public.certificates;
-- Should return: student's own certificate with status='issued'
```

**Test revoked certificate visibility:**
```sql
-- As Admin, revoke certificate
SET request.jwt.claims = '{"sub": "<admin_user_id>"}';
UPDATE public.certificates SET status = 'revoked' WHERE student_id = '<student_user_id>';

-- As Student, try to see revoked certificate
SET request.jwt.claims = '{"sub": "<student_user_id>"}';
SELECT * FROM public.certificates;
-- Should return: empty (students cannot see revoked certificates)
```

### 5. Test Audit Log Protection

**As Student (should have NO access):**
```sql
SET request.jwt.claims = '{"sub": "<student_user_id>"}';
SELECT * FROM public.audit_logs;
-- Should return: empty (no permission)

INSERT INTO public.audit_logs (action, entity_type) VALUES ('test', 'test');
-- Should return: ERROR (permission denied)
```

**As Admin (should have full access):**
```sql
SET request.jwt.claims = '{"sub": "<admin_user_id>"}';
SELECT * FROM public.audit_logs;
-- Should return: all audit logs

INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id)
VALUES (auth.uid(), 'test_action', 'test_entity', gen_random_uuid());
-- Should return: INSERT successful
```

### 6. Test Cross-Student Data Access

**Create second student:**
```sql
-- Assume student2@test.com exists with user_id '<student2_user_id>'

-- As Student 1, try to see Student 2's data
SET request.jwt.claims = '{"sub": "<student_user_id>"}';
SELECT * FROM public.profiles WHERE id = '<student2_user_id>';
-- Should return: empty (cannot see other students)

SELECT * FROM public.lesson_progress WHERE student_id = '<student2_user_id>';
-- Should return: empty (cannot see other students' progress)

SELECT * FROM public.quiz_attempts WHERE student_id = '<student2_user_id>';
-- Should return: empty (cannot see other students' quiz attempts)
```

## Expected Results Summary

| Resource | Student Access | Admin Access |
|----------|----------------|--------------|
| Own profile | Read/Update (limited fields) | Full |
| Other profiles | None | Full |
| Quiz questions (direct) | None | Full |
| Quiz questions (safe view) | Read (no answers) | N/A (use direct) |
| Correct answers | Never | Full |
| Own payments | Read only | Full |
| Payment status updates | Never | Full |
| Own quiz grading | Read only | Full |
| Quiz score/pass updates | Never | Full |
| Own certificates (issued) | Read only | Full |
| Certificates (revoked) | None | Full |
| Audit logs | None | Read/Insert |

## Automated Test Script

You can automate these tests using the backend's test suite once it's built. For now, manual verification using the queries above is sufficient.

## Notes

- Replace `<student_user_id>`, `<admin_user_id>`, `<student2_user_id>` with actual UUIDs
- The `SET request.jwt.claims` syntax works in Supabase SQL Editor for testing
- In production, these claims come from the actual JWT token
- Always test RLS after any policy changes
