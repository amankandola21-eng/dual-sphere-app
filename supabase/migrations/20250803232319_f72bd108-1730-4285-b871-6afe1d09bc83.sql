-- Add fields for tracking actual work time and pro-rated billing
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_hours_worked DECIMAL,
ADD COLUMN IF NOT EXISTS final_amount DECIMAL;

-- Add profile photo support for cleaners
ALTER TABLE cleaners
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Create storage bucket for cleaner profile photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cleaner-photos', 'cleaner-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for cleaner photos
CREATE POLICY "Cleaner photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cleaner-photos');

CREATE POLICY "Cleaners can upload their own photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'cleaner-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Cleaners can update their own photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'cleaner-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Cleaners can delete their own photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'cleaner-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update the booking totals calculation function for pro-rated billing
CREATE OR REPLACE FUNCTION public.calculate_final_booking_amount()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Only calculate if we have actual work times
  IF NEW.actual_start_time IS NOT NULL AND NEW.actual_end_time IS NOT NULL THEN
    -- Calculate actual hours worked (with precision)
    NEW.actual_hours_worked = EXTRACT(EPOCH FROM (NEW.actual_end_time - NEW.actual_start_time)) / 3600.0;
    
    -- Calculate final amount based on actual time worked
    NEW.final_amount = NEW.hourly_rate * NEW.actual_hours_worked;
    
    -- Calculate platform commission on final amount
    NEW.platform_commission = (NEW.final_amount * NEW.commission_rate) / 100;
    
    -- Calculate cleaner earnings (final amount minus commission)
    NEW.cleaner_earnings = NEW.final_amount - NEW.platform_commission;
  ELSE
    -- Keep original estimated calculations if no actual times
    NEW.total_price = NEW.hourly_rate * NEW.estimated_hours;
    NEW.platform_commission = (NEW.total_price * NEW.commission_rate) / 100;
    NEW.cleaner_earnings = NEW.total_price - NEW.platform_commission;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for final booking calculations
DROP TRIGGER IF EXISTS calculate_final_booking_totals ON bookings;
CREATE TRIGGER calculate_final_booking_totals
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION calculate_final_booking_amount();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_actual_times ON bookings(actual_start_time, actual_end_time);
CREATE INDEX IF NOT EXISTS idx_cleaners_photo ON cleaners(profile_photo_url) WHERE profile_photo_url IS NOT NULL;