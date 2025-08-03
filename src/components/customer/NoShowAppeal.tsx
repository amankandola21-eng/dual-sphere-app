import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileText, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NoShowAppealProps {
  booking: {
    id: string;
    no_show_charge_amount?: number;
    no_show_charged_at?: string;
    scheduled_date: string;
    scheduled_time: string;
  };
  onAppealSubmitted: () => void;
}

const appealReasons = [
  { value: 'was_present', label: 'I was present at the scheduled time' },
  { value: 'cleaner_late', label: 'Cleaner arrived late' },
  { value: 'cleaner_no_show', label: 'Cleaner did not show up' },
  { value: 'emergency', label: 'Emergency situation' },
  { value: 'miscommunication', label: 'Miscommunication about timing' },
  { value: 'technical_issue', label: 'Technical issue with access' },
  { value: 'other', label: 'Other reason' }
];

export const NoShowAppeal = ({ booking, onAppealSubmitted }: NoShowAppealProps) => {
  const [appealReason, setAppealReason] = useState('');
  const [appealDescription, setAppealDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmitAppeal = async () => {
    if (!appealReason || !appealDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a reason and provide a detailed description.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('charge_appeals')
        .insert({
          booking_id: booking.id,
          customer_id: (await supabase.auth.getUser()).data.user?.id,
          appeal_reason: appealReason,
          appeal_description: appealDescription
        });

      if (error) throw error;

      // Send notification to admins
      await supabase.functions.invoke('send-notification', {
        body: {
          user_id: 'admin', // This will need to be handled specially in the notification system
          title: 'New Charge Appeal Submitted',
          message: `A customer has appealed a no-show charge for booking ${booking.id}.`,
          type: 'appeal_submitted',
          data: { booking_id: booking.id },
          send_push: true
        }
      });

      toast({
        title: "Appeal Submitted",
        description: "Your appeal has been submitted and will be reviewed by our admin team.",
      });
      
      onAppealSubmitted();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit appeal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatChargeDate = () => {
    if (!booking.no_show_charged_at) return '';
    return new Date(booking.no_show_charged_at).toLocaleString();
  };

  const formatBookingDate = () => {
    const date = new Date(booking.scheduled_date);
    return `${date.toLocaleDateString()} at ${booking.scheduled_time}`;
  };

  if (!booking.no_show_charge_amount) {
    return null;
  }

  return (
    <Card className="w-full border-destructive">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            No-Show Charge Applied
          </CardTitle>
          <Badge variant="destructive">
            ${booking.no_show_charge_amount.toFixed(2)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-destructive/10 p-4 rounded-lg">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">Charge Amount:</span>
              <span>${booking.no_show_charge_amount.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Booking Date:</span>
              <span>{formatBookingDate()}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Charged On:</span>
              <span>{formatChargeDate()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Dispute This Charge</h4>
            <p className="text-sm text-muted-foreground mb-4">
              If you believe this no-show charge was applied in error, you can submit an appeal. 
              Our admin team will review your case and make a fair decision.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Reason for Appeal
              </label>
              <Select value={appealReason} onValueChange={setAppealReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason for your appeal" />
                </SelectTrigger>
                <SelectContent>
                  {appealReasons.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Detailed Description
              </label>
              <Textarea
                placeholder="Please provide a detailed explanation of why you believe this charge should be reversed. Include any relevant details about what happened during the scheduled appointment time."
                value={appealDescription}
                onChange={(e) => setAppealDescription(e.target.value)}
                rows={5}
              />
            </div>

            <Button 
              onClick={handleSubmitAppeal}
              disabled={loading || !appealReason || !appealDescription.trim()}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Submit Appeal
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-secondary p-3 rounded-md">
          <p><strong>Note:</strong> Appeals are reviewed by our admin team within 24-48 hours. 
          If your appeal is approved, the charge will be refunded to your original payment method.</p>
        </div>
      </CardContent>
    </Card>
  );
};