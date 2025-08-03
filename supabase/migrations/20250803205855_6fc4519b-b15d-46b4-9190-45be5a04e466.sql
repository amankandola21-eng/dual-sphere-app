-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('customer', 'cleaner', 'admin');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create cleaners table for cleaner profiles and rates
CREATE TABLE public.cleaners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  available BOOLEAN NOT NULL DEFAULT true,
  rating DECIMAL(3,2) DEFAULT 5.00,
  total_jobs INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin settings table for commission rates
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- User roles policies
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Cleaners policies
CREATE POLICY "Everyone can view available cleaners" 
ON public.cleaners 
FOR SELECT 
USING (available = true);

CREATE POLICY "Cleaners can update their own profile" 
ON public.cleaners 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all cleaner profiles" 
ON public.cleaners 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Admin settings policies
CREATE POLICY "Admins can manage settings" 
ON public.admin_settings 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_cleaners_updated_at
BEFORE UPDATE ON public.cleaners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update bookings table to support hourly pricing and cleaner assignment
ALTER TABLE public.bookings 
ADD COLUMN cleaner_id UUID REFERENCES public.cleaners(id),
ADD COLUMN estimated_hours DECIMAL(3,1) NOT NULL DEFAULT 2.0,
ADD COLUMN hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 25.00,
ADD COLUMN commission_rate DECIMAL(4,2) NOT NULL DEFAULT 5.00,
ADD COLUMN cleaner_earnings DECIMAL(10,2),
ADD COLUMN platform_commission DECIMAL(10,2);

-- Insert initial admin settings
INSERT INTO public.admin_settings (setting_key, setting_value, description, updated_by) VALUES
('commission_rate', '5.00', 'Platform commission percentage charged to cleaners', (SELECT id FROM auth.users LIMIT 1)),
('default_hourly_rate', '25.00', 'Default hourly rate for new cleaners', (SELECT id FROM auth.users LIMIT 1));

-- Create function to calculate booking totals
CREATE OR REPLACE FUNCTION public.calculate_booking_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total price based on hourly rate and estimated hours
  NEW.total_price = NEW.hourly_rate * NEW.estimated_hours;
  
  -- Calculate platform commission
  NEW.platform_commission = (NEW.total_price * NEW.commission_rate) / 100;
  
  -- Calculate cleaner earnings (total minus commission)
  NEW.cleaner_earnings = NEW.total_price - NEW.platform_commission;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically calculate booking totals
CREATE TRIGGER calculate_booking_totals_trigger
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.calculate_booking_totals();