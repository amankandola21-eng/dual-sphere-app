-- Add RLS policy for CleanerConnect table (fixing the security warning)
CREATE POLICY "CleanerConnect is viewable by everyone" 
ON CleanerConnect 
FOR SELECT 
USING (true);