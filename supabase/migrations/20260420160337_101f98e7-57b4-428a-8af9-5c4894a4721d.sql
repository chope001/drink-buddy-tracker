ALTER TABLE public.drinks
  ADD CONSTRAINT drinks_multiplier_range
  CHECK (multiplier >= 1 AND multiplier <= 10);