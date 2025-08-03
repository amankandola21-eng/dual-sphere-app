import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  Shield,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Booking {
  id: string;
  status: string;
  total_price: number;
  scheduled_date: string;
  scheduled_time: string;
  address_line1: string;
  city: string;
}

export const PaymentManagement = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, status, total_price, scheduled_date, scheduled_time, address_line1, city')
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'in_progress', 'completed', 'payment_held'])
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleReleasePayment = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const { data, error } = await supabase.functions.invoke('release-payment', {
        body: { bookingId, releaseType: 'full' }
      });

      if (error) throw error;

      toast({
        title: "Payment Released",
        description: "Payment has been released to the cleaner successfully.",
      });

      // Refresh bookings
      fetchBookings();
    } catch (error) {
      console.error('Error releasing payment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to release payment",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    }
    if (status === 'in_progress') {
      return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
    }
    if (status === 'confirmed') {
      return <Badge className="bg-purple-100 text-purple-800">Confirmed</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const isAutoReleaseApproaching = (autoReleaseDate: string) => {
    const releaseDate = new Date(autoReleaseDate);
    const now = new Date();
    const hoursUntilRelease = (releaseDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilRelease <= 6 && hoursUntilRelease > 0;
  };

  const isPaymentReleasable = (booking: Booking) => {
    return booking.status === 'completed';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No active bookings with payments found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Payment Management</h2>
        <p className="text-muted-foreground">Manage payments for your cleaning services</p>
      </div>

      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">
                    Cleaning Service
                  </CardTitle>
                  {getStatusBadge(booking.status)}
                </div>
                <div className="text-lg font-semibold">
                  ${booking.total_price.toFixed(2)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(booking.scheduled_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {booking.scheduled_time}
                </div>
              </div>

              <div className="text-sm">
                <strong>Address:</strong> {booking.address_line1}, {booking.city}
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Stripe Connect escrow payment system is now active for this booking.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};