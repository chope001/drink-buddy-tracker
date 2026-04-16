
ALTER TABLE public.group_members
  ADD CONSTRAINT group_members_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
