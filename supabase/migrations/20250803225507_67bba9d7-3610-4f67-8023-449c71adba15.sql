-- Add booking acceptance workflow fields
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS declined_reason TEXT;

-- Add GPS verification and no-show protection fields
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS cleaner_arrival_lat DECIMAL,
ADD COLUMN IF NOT EXISTS cleaner_arrival_lng DECIMAL,
ADD COLUMN IF NOT EXISTS cleaner_arrived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS customer_confirmed_access BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS no_show_detected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS no_show_charge_amount DECIMAL,
ADD COLUMN IF NOT EXISTS no_show_charged_at TIMESTAMP WITH TIME ZONE;

-- Create appeals table for disputed charges
CREATE TABLE IF NOT EXISTS charge_appeals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  appeal_reason TEXT NOT NULL,
  appeal_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on appeals table
ALTER TABLE charge_appeals ENABLE ROW LEVEL SECURITY;

-- Create policies for appeals
CREATE POLICY "Customers can create appeals for their bookings" 
ON charge_appeals 
FOR INSERT 
WITH CHECK (
  customer_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM bookings 
    WHERE id = booking_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own appeals" 
ON charge_appeals 
FOR SELECT 
USING (customer_id = auth.uid());

CREATE POLICY "Admins can manage all appeals" 
ON charge_appeals 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at on appeals
CREATE TRIGGER update_charge_appeals_updated_at
BEFORE UPDATE ON charge_appeals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_cleaner_status ON bookings(cleaner_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_charge_appeals_status ON charge_appeals(status);
CREATE INDEX IF NOT EXISTS idx_charge_appeals_booking ON charge_appeals(booking_id);