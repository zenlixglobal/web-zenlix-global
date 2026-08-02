-- ============================================================================
-- Grant an existing Supabase Auth user access to /admin.
--
-- Run this AFTER 0001_init.sql, and after the person exists in
-- Authentication → Users. Signing in is not enough on its own: `is_admin()`
-- checks this allow-list, and every RLS policy in the project is built on it.
--
-- Edit the email below, then run the whole file.
-- ============================================================================

insert into public.admin_users (user_id, email)
select u.id, u.email
  from auth.users u
 where u.email = 'nasrzaid100@gmail.com'
on conflict (user_id) do nothing;

-- Verify: should return exactly one row.
select au.user_id, au.email, au.created_at
  from public.admin_users au
 order by au.created_at;

-- To revoke access later (this does not delete the auth user):
--   delete from public.admin_users where email = 'nasrzaid100@gmail.com';
