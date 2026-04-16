
-- Allow group creator to delete the group
CREATE POLICY "Creator can delete group"
ON public.groups
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Allow members to be deleted (cascade needs this)
CREATE POLICY "Allow delete group members"
ON public.group_members
FOR DELETE
TO authenticated
USING (true);

-- Allow delete group invites
CREATE POLICY "Allow delete group invites"
ON public.group_invites
FOR DELETE
TO authenticated
USING (true);

-- Allow delete drinks for group
CREATE POLICY "Users can delete own drinks"
ON public.drinks
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Add cascade FK from drinks to groups
ALTER TABLE public.drinks DROP CONSTRAINT IF EXISTS drinks_group_id_fkey;
ALTER TABLE public.drinks
  ADD CONSTRAINT drinks_group_id_fkey
  FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

-- Add cascade FK from group_members to groups
ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;
ALTER TABLE public.group_members
  ADD CONSTRAINT group_members_group_id_fkey
  FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

-- Add cascade FK from group_invites to groups  
ALTER TABLE public.group_invites DROP CONSTRAINT IF EXISTS group_invites_group_id_fkey;
ALTER TABLE public.group_invites
  ADD CONSTRAINT group_invites_group_id_fkey
  FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
