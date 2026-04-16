
DROP POLICY IF EXISTS "Allow delete group members" ON public.group_members;
CREATE POLICY "Creator can delete group members"
ON public.group_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
  )
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Allow delete group invites" ON public.group_invites;
CREATE POLICY "Creator can delete group invites"
ON public.group_invites
FOR DELETE
TO authenticated
USING (invited_by = auth.uid());
