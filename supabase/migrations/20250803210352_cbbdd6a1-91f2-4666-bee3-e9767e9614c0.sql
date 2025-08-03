-- Create a cleaner profile for the current user (for testing)
INSERT INTO public.cleaners (user_id, hourly_rate, bio, experience_years, rating, total_jobs)
SELECT 
  p.user_id,
  28.00 as hourly_rate,
  'Professional house cleaning with eco-friendly products. Specializing in deep cleaning and organization.' as bio,
  5 as experience_years,
  4.8 as rating,
  127 as total_jobs
FROM public.profiles p
LIMIT 1;

-- Also give the user a cleaner role for testing
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'cleaner'::app_role
FROM public.profiles 
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;