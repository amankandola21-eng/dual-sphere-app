-- Add foreign key constraint between cleaners and profiles
ALTER TABLE public.cleaners 
ADD CONSTRAINT cleaners_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;