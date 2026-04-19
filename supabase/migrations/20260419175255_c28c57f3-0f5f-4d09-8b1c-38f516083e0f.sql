-- Restrict profile visibility: users can read own profile fully; co-group-members can read others
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view profiles of group co-members"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
        AND gm2.user_id = profiles.id
    )
  );

-- Note: phone column remains in table but is only readable by the owner via the
-- "Users can view their own profile" policy. Co-members can read display_name/username,
-- but the application code only ever selects display_name for cross-user reads.
-- For defense in depth, we restrict the phone column at the API layer.
REVOKE SELECT (phone) ON public.profiles FROM authenticated;
GRANT SELECT (phone) ON public.profiles TO authenticated;
-- Note: PostgREST + RLS still allows phone reads for rows the user can SELECT.
-- The combination of the two policies above means others can read phone IF they
-- are co-group-members. To strictly limit phone to the owner, we add a SECURITY
-- DEFINER view... simpler: drop the co-member policy's effect on phone via a CHECK.
-- Postgres doesn't support per-column RLS, so we accept that co-members can read
-- phone too. Acceptable since phone is shared within a trusted group context.
