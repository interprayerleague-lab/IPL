# Creating the First Admin User

## Method: Manual UPDATE After First User Signup

### Steps:

1. **Create your first user account** through the application signup:
   - Go to the signup page
   - Register with your admin email address
   - Complete email verification if required
   - A `student` profile will be created automatically

2. **Find your user ID** using Supabase MCP or Dashboard:
   
   ```sql
   -- Option A: Using email
   SELECT id, email, role FROM public.profiles WHERE email = 'your-admin-email@example.com';
   
   -- Option B: List all profiles
   SELECT id, email, role, created_at FROM public.profiles ORDER BY created_at;
   ```

3. **Promote to Admin** using SQL:

   ```sql
   -- Replace 'your-user-id-here' with the actual UUID from step 2
   UPDATE public.profiles 
   SET role = 'admin' 
   WHERE id = 'your-user-id-here';
   ```

4. **Verify the change**:

   ```sql
   SELECT id, email, role, first_name, last_name, created_at 
   FROM public.profiles 
   WHERE role = 'admin';
   ```

5. **Log out and log back in** for the role change to take effect

## Using Supabase MCP Tools

You can execute these commands through the AI agent:

```javascript
// Step 2: Find user
execute_sql("SELECT id, email, role FROM public.profiles WHERE email = 'your@email.com';")

// Step 3: Promote to admin (replace UUID)
execute_sql("UPDATE public.profiles SET role = 'admin' WHERE id = 'uuid-here';")

// Step 4: Verify
execute_sql("SELECT * FROM public.profiles WHERE role = 'admin';")
```

## Security Notes

- ✅ Students **cannot** change their own role (protected by RLS)
- ✅ Only admins can promote other users to admin
- ✅ This manual promotion is secure because:
  - It requires database access (service role)
  - Students don't have UPDATE permission on the `role` column
  - The RLS policy blocks role changes from students

## After Creating First Admin

Once you have one admin user:
- That admin can promote other users through the application
- No more manual SQL updates needed
- The admin dashboard will have user management features
