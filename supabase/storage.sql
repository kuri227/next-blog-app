-- Run this after the Prisma schema has been applied.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'cover-image',
  'cover-image',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public."User" as app_user
    where app_user."supabaseId" = (select auth.uid())::text
      and app_user.role = 'ADMIN'
  )
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "cover_image_admin_select" on storage.objects;
drop policy if exists "cover_image_admin_insert" on storage.objects;
drop policy if exists "cover_image_admin_update" on storage.objects;
drop policy if exists "cover_image_admin_delete" on storage.objects;

create policy "cover_image_admin_select"
on storage.objects
for select
to authenticated
using (bucket_id = 'cover-image' and public.is_admin());

create policy "cover_image_admin_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'cover-image' and public.is_admin());

create policy "cover_image_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'cover-image' and public.is_admin())
with check (bucket_id = 'cover-image' and public.is_admin());

create policy "cover_image_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'cover-image' and public.is_admin());
