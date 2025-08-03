-- Insert some sample cleaner profiles for testing
-- First, we need to create user profiles for cleaners
INSERT INTO public.profiles (user_id, display_name) VALUES
(gen_random_uuid(), 'Sarah Johnson'),
(gen_random_uuid(), 'Mike Chen'),
(gen_random_uuid(), 'Lisa Rodriguez');

-- Then create cleaner profiles using the profile user_ids
INSERT INTO public.cleaners (user_id, hourly_rate, bio, experience_years, rating, total_jobs)
SELECT 
  p.user_id,
  CASE 
    WHEN p.display_name = 'Sarah Johnson' THEN 28.00
    WHEN p.display_name = 'Mike Chen' THEN 35.00
    WHEN p.display_name = 'Lisa Rodriguez' THEN 25.00
  END as hourly_rate,
  CASE 
    WHEN p.display_name = 'Sarah Johnson' THEN 'Professional house cleaning with eco-friendly products. Specializing in deep cleaning and organization.'
    WHEN p.display_name = 'Mike Chen' THEN 'Commercial and residential cleaning expert. Detail-oriented with 8+ years of experience.'
    WHEN p.display_name = 'Lisa Rodriguez' THEN 'Reliable and thorough cleaning service. Great with pets and families.'
  END as bio,
  CASE 
    WHEN p.display_name = 'Sarah Johnson' THEN 5
    WHEN p.display_name = 'Mike Chen' THEN 8
    WHEN p.display_name = 'Lisa Rodriguez' THEN 3
  END as experience_years,
  CASE 
    WHEN p.display_name = 'Sarah Johnson' THEN 4.8
    WHEN p.display_name = 'Mike Chen' THEN 4.9
    WHEN p.display_name = 'Lisa Rodriguez' THEN 4.7
  END as rating,
  CASE 
    WHEN p.display_name = 'Sarah Johnson' THEN 127
    WHEN p.display_name = 'Mike Chen' THEN 203
    WHEN p.display_name = 'Lisa Rodriguez' THEN 89
  END as total_jobs
FROM public.profiles p
WHERE p.display_name IN ('Sarah Johnson', 'Mike Chen', 'Lisa Rodriguez');