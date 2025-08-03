-- Create missing database tables and relationships for CleanerConnect

-- First, let's add the missing columns to existing tables
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add stripe_account_id to cleaners table
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cleaner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  photos text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create messages table for chat functionality
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text',
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  data jsonb,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Create payment_releases table
CREATE TABLE IF NOT EXISTS public.payment_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  release_type text NOT NULL,
  released_by uuid REFERENCES auth.users(id),
  released_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_releases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Users can view reviews for their bookings"
ON public.reviews FOR SELECT
USING (
  customer_id = auth.uid() OR 
  cleaner_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Customers can create reviews for completed bookings"
ON public.reviews FOR INSERT
WITH CHECK (
  customer_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id AND user_id = auth.uid() AND status = 'completed'
  )
);

CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE
USING (customer_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
USING (sender_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for payment_releases
CREATE POLICY "Admins can manage all payment releases"
ON public.payment_releases FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their booking payment releases"
ON public.payment_releases FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id AND (b.user_id = auth.uid() OR b.cleaner_id = auth.uid())
  )
);

-- Create triggers for updated_at columns
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample services if they don't exist
INSERT INTO public.services (name, description, base_price, duration_hours) VALUES
  ('Standard Cleaning', 'Regular cleaning service including dusting, vacuuming, mopping, and bathroom cleaning', 25.00, 2),
  ('Deep Cleaning', 'Thorough cleaning including inside appliances, baseboards, and detailed cleaning', 35.00, 3),
  ('Move In/Out Cleaning', 'Complete cleaning for moving in or out of a property', 40.00, 4),
  ('Post Construction Cleaning', 'Specialized cleaning after construction or renovation work', 45.00, 5),
  ('Rental Turnover', 'Professional cleaning between tenants', 35.00, 3)
ON CONFLICT (name) DO NOTHING;

-- Create default admin user role trigger (only if no admin exists)
CREATE OR REPLACE FUNCTION public.create_default_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if any admin role exists
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    -- This will be handled by the application when the first user signs up
    -- They can be manually promoted to admin in the Supabase dashboard
    NULL;
  END IF;
END;
$$;