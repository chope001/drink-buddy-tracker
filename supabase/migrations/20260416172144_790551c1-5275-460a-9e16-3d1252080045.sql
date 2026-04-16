
-- Add token column to group_invites
ALTER TABLE public.group_invites
  ADD COLUMN IF NOT EXISTS token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS group_invites_token_idx ON public.group_invites(token);

-- Public lookup function: anyone (even unauthenticated) can resolve a token to group info
CREATE OR REPLACE FUNCTION public.get_invite_by_token(_token uuid)
RETURNS TABLE(group_id uuid, group_name text, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gi.group_id, g.name AS group_name, gi.status
  FROM public.group_invites gi
  JOIN public.groups g ON g.id = gi.group_id
  WHERE gi.token = _token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_by_token(uuid) TO anon, authenticated;

-- Redemption function: authenticated user redeems a token to join the group
CREATE OR REPLACE FUNCTION public.redeem_invite(_token uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _group_id uuid;
  _invite_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT group_id, status INTO _group_id, _invite_status
  FROM public.group_invites
  WHERE token = _token
  LIMIT 1;

  IF _group_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite token';
  END IF;

  -- Add user to group if not already a member
  INSERT INTO public.group_members (group_id, user_id)
  VALUES (_group_id, auth.uid())
  ON CONFLICT DO NOTHING;

  -- Mark invite as accepted
  UPDATE public.group_invites
  SET status = 'accepted'
  WHERE token = _token;

  RETURN _group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_invite(uuid) TO authenticated;

-- Prevent duplicate group_members rows
CREATE UNIQUE INDEX IF NOT EXISTS group_members_unique_idx ON public.group_members(group_id, user_id);
