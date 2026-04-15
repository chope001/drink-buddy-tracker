-- Create groups table (no RLS policies yet)
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Create group_members table
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Now add policies that reference both tables
CREATE POLICY "Group members can view groups" ON public.groups FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = id AND gm.user_id = auth.uid()));
CREATE POLICY "Authenticated users can create groups" ON public.groups FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members can view group members" ON public.group_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members gm2 WHERE gm2.group_id = group_id AND gm2.user_id = auth.uid()));
CREATE POLICY "Authenticated users can insert members" ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.created_by = auth.uid()));

-- Create group_invites table
CREATE TABLE public.group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invite creators can view invites" ON public.group_invites FOR SELECT TO authenticated
  USING (invited_by = auth.uid());
CREATE POLICY "Members can create invites" ON public.group_invites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = invited_by);

-- Create drinks table
CREATE TABLE public.drinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  drink_type TEXT NOT NULL CHECK (drink_type IN ('beer', 'wine', 'shot')),
  multiplier INTEGER NOT NULL DEFAULT 1,
  session_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.drinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own drinks" ON public.drinks FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (group_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = drinks.group_id AND gm.user_id = auth.uid())));
CREATE POLICY "Users can insert own drinks" ON public.drinks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own drinks" ON public.drinks FOR UPDATE TO authenticated
  USING (user_id = auth.uid());