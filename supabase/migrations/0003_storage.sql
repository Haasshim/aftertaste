-- Private Storage bucket for photos and voice notes. Files are stored under the
-- path `{user_id}/{dish_log_id}/{uuid}.ext`; the policies below match the first
-- path segment to the caller's uid, so a user can only read/write their own
-- files and the bucket is never publicly listable.

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists att_read_own   on storage.objects;
drop policy if exists att_insert_own on storage.objects;
drop policy if exists att_update_own on storage.objects;
drop policy if exists att_delete_own on storage.objects;

create policy att_read_own on storage.objects
  for select using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy att_insert_own on storage.objects
  for insert with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy att_update_own on storage.objects
  for update using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy att_delete_own on storage.objects
  for delete using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
