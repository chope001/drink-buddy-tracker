
-- Create a private profile table for sensitive PII (phone)
CREATE TABLE IF NOT EXISTS public.private_profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.private_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own private profile"
  ON public.private_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own private profile"
  ON public.private_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own private profile"
  ON public.private_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can delete own private profile"
  ON public.private_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

CREATE TRIGGER update_private_profiles_updated_at
  BEFORE UPDATE ON public.private_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing phone data
INSERT INTO public.private_profiles (id, phone)
SELECT id, phone FROM public.profiles
WHERE phone IS NOT NULL
ON CONFLICT (id) DO UPDATE SET phone = EXCLUDED.phone;

-- Remove phone from public profiles
ALTER TABLE public.profiles DROP COLUMN phone;
