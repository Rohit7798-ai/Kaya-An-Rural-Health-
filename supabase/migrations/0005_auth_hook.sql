-- ============================================================================
-- Migration: 0005_auth_hook.sql
-- Description: Custom Access Token Hook for Supabase Auth to inject clinic_id
-- and user_role into JWT claims for client offline sync scoping and RLS.
-- ============================================================================

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  user_clinic_id uuid;
  user_role text;
begin
  -- Fetch clinic_id and role from public.users
  select clinic_id, role
  into user_clinic_id, user_role
  from public.users
  where id = (event->>'user_id')::uuid
    and deleted_at is null;

  claims := event->'claims';

  -- Inject clinic_id claim for PowerSync token authorization
  if user_clinic_id is not null then
    claims := jsonb_set(claims, '{clinic_id}', to_jsonb(user_clinic_id));
  end if;

  -- Inject role claim for quick client RBAC checks
  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Secure execution permissions for Supabase Auth engine
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
