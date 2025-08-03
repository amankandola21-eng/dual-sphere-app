import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GPSVerificationProps {
  booking: {
    id: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    postal_code: string;
    status: string;
    cleaner_arrived_at?: string;
    customer_confirmed_access: boolean;
    no_show_detected: boolean;
  };
  onArrivalConfirmed: () => void;
}

export const GPSVerification = ({ booking, onArrivalConfirmed }: GPSVerificationProps) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasArrived, setHasArrived] = useState(!!booking.cleaner_arrived_at);
  const { toast } = useToast();

  useEffect(() => {
    setHasArrived(!!booking.cleaner_arrived_at);
  }, [booking.cleaner_arrived_at]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    setLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setLocationError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const confirmArrival = async () => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please get your current location first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('handle-no-show', {
        body: {
          booking_id: booking.id,
          type: 'detected',
          lat: location.lat,
          lng: location.lng,
          customer_confirmed: false
        }
      });

      if (error) throw error;

      toast({
        title: "Arrival Confirmed",
        description: "Your arrival has been recorded. The customer will be notified.",
      });
      
      setHasArrived(true);
      onArrivalConfirmed();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm arrival",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = () => {
    const parts = [booking.address_line1];
    if (booking.address_line2) parts.push(booking.address_line2);
    parts.push(`${booking.city}, ${booking.postal_code}`);
    return parts.join(', ');
  };

  const formatArrivalTime = () => {
    if (!booking.cleaner_arrived_at) return null;
    return new Date(booking.cleaner_arrived_at).toLocaleString();
  };

  if (booking.status !== 'confirmed') {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            GPS Verification
          </CardTitle>
          {hasArrived && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Arrived
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <span className="font-medium">Destination:</span>
              <p className="text-muted-foreground">{formatAddress()}</p>
            </div>
          </div>

          {hasArrived && booking.cleaner_arrived_at && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Arrived at:</span>
              <span>{formatArrivalTime()}</span>
            </div>
          )}
        </div>

        {!hasArrived && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">GPS Verification Required</p>
                  <p className="text-blue-700 mt-1">
                    To protect against no-shows, please confirm your arrival at the customer's location 
                    using GPS verification. This helps ensure fair billing for both you and the customer.
                  </p>
                </div>
              </div>
            </div>

            {location && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span>Location obtained: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</span>
                </div>
              </div>
            )}

            {locationError && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-sm text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span>{locationError}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={getCurrentLocation}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Get Current Location
              </Button>
              <Button 
                onClick={confirmArrival}
                disabled={loading || !location}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Arrival
              </Button>
            </div>
          </div>
        )}

        {hasArrived && !booking.customer_confirmed_access && !booking.no_show_detected && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Waiting for Customer Access</p>
                <p className="text-yellow-700 mt-1">
                  You've confirmed your arrival. The customer has been notified and should provide 
                  access soon. If access is not granted within 15 minutes, a no-show charge may be applied.
                </p>
              </div>
            </div>
          </div>
        )}

        {booking.customer_confirmed_access && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800">Access Confirmed</p>
                <p className="text-green-700 mt-1">
                  The customer has confirmed your access. You can now begin the cleaning service.
                </p>
              </div>
            </div>
          </div>
        )}

        {booking.no_show_detected && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800">No-Show Detected</p>
                <p className="text-red-700 mt-1">
                  A no-show has been detected for this booking. The customer has been charged accordingly.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};