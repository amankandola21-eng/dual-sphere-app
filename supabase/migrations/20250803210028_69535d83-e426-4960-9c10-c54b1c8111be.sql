-- Fix function security by setting search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Fix calculate_booking_totals function security
CREATE OR REPLACE FUNCTION public.calculate_booking_totals()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Calculate total price based on hourly rate and estimated hours
  NEW.total_price = NEW.hourly_rate * NEW.estimated_hours;
  
  -- Calculate platform commission
  NEW.platform_commission = (NEW.total_price * NEW.commission_rate) / 100;
  
  -- Calculate cleaner earnings (total minus commission)
  NEW.cleaner_earnings = NEW.total_price - NEW.platform_commission;
  
  RETURN NEW;
END;
$$;