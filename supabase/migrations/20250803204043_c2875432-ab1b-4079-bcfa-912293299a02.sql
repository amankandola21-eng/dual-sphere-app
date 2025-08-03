-- Drop the CleanerConnect table as it appears to be unused and has no proper schema
DROP TABLE IF EXISTS public.CleanerConnect;

-- Add missing DELETE policy for bookings 
CREATE POLICY "Users can delete their own bookings" 
ON public.bookings 
FOR DELETE 
USING (auth.uid() = user_id);