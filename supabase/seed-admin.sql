-- ============================================================================
-- Grant an existing Supabase Auth user access to /admin.
--
-- Run this AFTER the migrations, and after the person exists in
-- Authentication → Users. Signing in is not enough on its own: `is_admin()`
-- checks this allow-list, and every RLS policy in the project is built on it.
--
-- This is the bootstrap path only — it creates the *first* owner. Everyone
-- after that is added from Settings → Users in the admin itself, which enforces
-- the rank rules that a raw SQL insert bypasses.
--
-- Edit the email below, then run the whole file.
-- ============================================================================

insert into public.admin_users (user_id, email, role)
select u.id, u.email, 'owner'
  from auth.users u
 where u.email = 'nasrzaid100@gmail.com'
on conflict (user_id) do update
  set role = 'owner',
      disabled_at = null;

-- Verify: should return exactly one active owner.
select au.user_id, au.email, au.role, au.disabled_at, au.created_at
  from public.admin_users au
 order by au.created_at;

-- To suspend someone without losing their row or their history:
--   update public.admin_users set disabled_at = now() where email = '…';
--
-- To revoke access entirely (this does not delete the auth user):
--   delete from public.admin_users where email = '…';
--
-- Neither will let you remove the last active owner — a trigger refuses it.
