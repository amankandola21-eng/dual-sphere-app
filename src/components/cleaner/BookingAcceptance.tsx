import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, DollarSign, User, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BookingAcceptanceProps {
  booking: {
    id: string;
    scheduled_date: string;
    scheduled_time: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    postal_code: string;
    total_price: number;
    hourly_rate: number;
    estimated_hours: number;
    special_instructions?: string;
    status: string;
    customer?: {
      display_name: string;
    };
  };
  onBookingUpdated: () => void;
}

export const BookingAcceptance = ({ booking, onBookingUpdated }: BookingAcceptanceProps) => {
  const [loading, setLoading] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('process-booking-action', {
        body: {
          booking_id: booking.id,
          action: 'accept'
        }
      });

      if (error) throw error;

      toast({
        title: "Booking Accepted",
        description: "You have successfully accepted this booking request.",
      });
      
      onBookingUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for declining this booking.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('process-booking-action', {
        body: {
          booking_id: booking.id,
          action: 'decline',
          declined_reason: declineReason
        }
      });

      if (error) throw error;

      toast({
        title: "Booking Declined",
        description: "You have declined this booking request.",
      });
      
      onBookingUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to decline booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowDeclineForm(false);
      setDeclineReason('');
    }
  };

  const formatAddress = () => {
    const parts = [booking.address_line1];
    if (booking.address_line2) parts.push(booking.address_line2);
    parts.push(`${booking.city}, ${booking.postal_code}`);
    return parts.join(', ');
  };

  const formatDateTime = () => {
    const date = new Date(booking.scheduled_date);
    return `${date.toLocaleDateString()} at ${booking.scheduled_time}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            New Booking Request
          </CardTitle>
          <Badge variant="secondary">{booking.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Customer:</span>
              <span>{booking.customer?.display_name || 'Unknown'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Date & Time:</span>
              <span>{formatDateTime()}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Address:</span>
              <span className="text-xs">{formatAddress()}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Rate:</span>
              <span>${booking.hourly_rate}/hour</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Duration:</span>
              <span>{booking.estimated_hours} hours</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Total:</span>
              <span className="font-bold">${booking.total_price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {booking.special_instructions && (
          <div className="space-y-2">
            <span className="font-medium text-sm">Special Instructions:</span>
            <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">
              {booking.special_instructions}
            </p>
          </div>
        )}

        {booking.status === 'pending' && (
          <div className="space-y-3 pt-4 border-t">
            {!showDeclineForm ? (
              <div className="flex gap-3">
                <Button 
                  onClick={handleAccept}
                  disabled={loading}
                  className="flex-1"
                  size="lg"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Booking
                </Button>
                <Button 
                  onClick={() => setShowDeclineForm(true)}
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  placeholder="Please provide a reason for declining this booking..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-3">
                  <Button 
                    onClick={handleDecline}
                    disabled={loading || !declineReason.trim()}
                    variant="destructive"
                    className="flex-1"
                  >
                    Confirm Decline
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowDeclineForm(false);
                      setDeclineReason('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};