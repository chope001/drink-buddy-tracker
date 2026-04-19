DROP POLICY IF EXISTS "Members can create invites" ON public.group_invites;

CREATE POLICY "Members can create invites" ON public.group_invites
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = invited_by
  AND public.is_group_member(group_id, auth.uid())
);