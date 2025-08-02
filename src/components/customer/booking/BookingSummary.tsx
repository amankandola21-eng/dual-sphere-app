import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Clock, CreditCard, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookingSummaryProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

const BookingSummary = ({ data, onUpdate, onNext }: BookingSummaryProps) => {
  const { toast } = useToast();

  const handleConfirmBooking = () => {
    toast({
      title: "Booking Confirmed!",
      description: "Your cleaning appointment has been scheduled. You'll receive a confirmation email shortly.",
    });
    // Here you would typically save the booking to the database
    // For now, we'll just show the success message
  };

  const subtotal = data.serviceType?.basePrice || 0;
  const platformFee = Math.round(subtotal * 0.05); // 5% platform fee
  const total = subtotal + platformFee;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Booking Summary</h3>
        <p className="text-sm text-muted-foreground">Review your details before confirming</p>
      </div>

      {/* Service Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{data.serviceType?.name}</CardTitle>
          <CardDescription>{data.serviceType?.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span>{data.date?.toLocaleDateString()} at {data.time}</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{data.serviceType?.duration} hours</span>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p>{data.address?.street}</p>
              {data.address?.aptUnit && <p>Apt {data.address.aptUnit}</p>}
              <p>{data.address?.city}, {data.address?.state} {data.address?.zipCode}</p>
            </div>
          </div>

          {data.specialInstructions && (
            <div className="flex items-start gap-3 text-sm">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-muted-foreground">{data.specialInstructions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Service Fee</span>
            <span>${subtotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Platform Fee</span>
            <span>${platformFee}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${total}</span>
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              Payment will be held for 24 hours after job completion. 
              You can rate and review your cleaner before the payment is released.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cleaner Assignment */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <Badge variant="secondary">Cleaner Assignment</Badge>
            <p className="text-sm text-muted-foreground">
              We'll assign the best available cleaner to your booking and notify you within 30 minutes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Button */}
      <Button 
        onClick={handleConfirmBooking}
        className="w-full h-12 text-lg"
        size="lg"
      >
        Confirm Booking - ${total}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By confirming, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
};

export default BookingSummary;