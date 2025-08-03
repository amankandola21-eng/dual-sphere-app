import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, User, DollarSign, Star, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PaymentFlow } from "./PaymentFlow";

interface BookingSummaryProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

const BookingSummary = ({ data, onUpdate, onNext }: BookingSummaryProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const totalCost = data.hourlyRate && data.estimatedHours 
    ? (data.hourlyRate * data.estimatedHours).toFixed(2)
    : '0.00';

  const handleConfirmBooking = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to complete your booking",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get current commission rate from admin settings
      const { data: settings } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'commission_rate')
        .single();

      const commissionRate = settings?.setting_value ? parseFloat(settings.setting_value) : 5.00;

      const bookingPayload = {
        user_id: user.id,
        cleaner_id: data.cleaner?.id,
        service_id: (await supabase.from('services').select('id').limit(1).single()).data?.id,
        scheduled_date: data.date.toISOString().split('T')[0],
        scheduled_time: convertTimeToSQL(data.time),
        address_line1: data.address?.street || '',
        address_line2: data.address?.aptUnit || null,
        city: data.address?.city || '',
        postal_code: data.address?.zipCode || '',
        special_instructions: data.specialInstructions || null,
        estimated_hours: data.estimatedHours,
        hourly_rate: data.hourlyRate,
        commission_rate: commissionRate,
        total_price: parseFloat(totalCost),
        status: 'pending', // Will be updated to payment_pending when payment intent is created
      };

      const { data: newBooking, error } = await supabase
        .from('bookings')
        .insert([bookingPayload])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setBookingId(newBooking.id);
      setShowPayment(true);

      toast({
        title: "Booking created!",
        description: "Please complete payment to confirm your booking.",
      });

    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking failed",
        description: "There was an error creating your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment successful!",
      description: "Your cleaning appointment is confirmed and payment is secured.",
    });
    onNext();
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment failed",
      description: error,
      variant: "destructive",
    });
  };

  // Helper function to convert time format
  const convertTimeToSQL = (timeString: string) => {
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Booking Summary</h3>
        <p className="text-sm text-muted-foreground">Review your booking details</p>
      </div>

      {/* Cleaner Info */}
      {data.cleaner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Your Cleaner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={data.cleaner.profiles?.avatar_url} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{data.cleaner.profiles?.display_name || 'Cleaner'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-muted-foreground">{data.cleaner.rating}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">${data.cleaner.hourly_rate}/hr</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date & Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date & Time
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Date:</span>
            <span className="text-sm font-medium">
              {data.date?.toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Time:</span>
            <span className="text-sm font-medium">{data.time}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Duration:</span>
            <span className="text-sm font-medium">{data.estimatedHours} hour{data.estimatedHours !== 1 ? 's' : ''}</span>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      {data.address && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Service Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>{data.address.street}</p>
              {data.address.aptUnit && <p>{data.address.aptUnit}</p>}
              <p>{data.address.city}, {data.address.state} {data.address.zipCode}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Hourly Rate:</span>
            <span className="text-sm">${data.hourlyRate}/hr</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Duration:</span>
            <span className="text-sm">{data.estimatedHours} hour{data.estimatedHours !== 1 ? 's' : ''}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="font-medium">Total:</span>
            <Badge variant="secondary" className="text-base">
              ${totalCost}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Special Instructions */}
      {data.specialInstructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Special Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{data.specialInstructions}</p>
          </CardContent>
        </Card>
      )}

      {/* Payment Flow or Confirm Button */}
      {showPayment && bookingId ? (
        <div className="flex justify-center">
          <PaymentFlow
            bookingId={bookingId}
            amount={parseFloat(totalCost)}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        </div>
      ) : (
        <Button 
          onClick={handleConfirmBooking} 
          className="w-full" 
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating Booking..." : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Continue to Payment
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default BookingSummary;