import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MapPin, Clock, Star, Bell, AlertCircle } from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";
import BookingFlow from "@/components/customer/BookingFlow";
import BookingHistory from "@/components/customer/BookingHistory";
import ProfileSection from "@/components/customer/ProfileSection";
import { NoShowAppeal } from "@/components/customer/NoShowAppeal";
import { NotificationPreferencesPanel } from "@/components/shared/NotificationPreferencesPanel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const CustomerDashboard = () => {
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [bookingsWithCharges, setBookingsWithCharges] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchBookingsWithCharges();
    }
  }, [user]);

  const fetchBookingsWithCharges = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user?.id)
        .eq('no_show_detected', true)
        .not('no_show_charge_amount', 'is', null);

      if (error) throw error;
      setBookingsWithCharges(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch bookings",
        variant: "destructive",
      });
    }
  };

  if (showBookingFlow) {
    return <BookingFlow onBack={() => setShowBookingFlow(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-md mx-auto p-4 pt-16 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">CleanerConnect</h1>
          <p className="text-muted-foreground">Professional cleaning at your fingertips</p>
        </div>

        {/* No-Show Charge Alert */}
        {bookingsWithCharges.length > 0 && (
          <Card className="border-destructive">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  You have {bookingsWithCharges.length} charge(s) that can be appealed
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Book Button */}
        <Button 
          onClick={() => setShowBookingFlow(true)}
          className="w-full h-16 text-lg"
          size="lg"
        >
          <Plus className="mr-2 h-6 w-6" />
          Book a Cleaner
        </Button>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">5.0</p>
                  <p className="text-xs text-muted-foreground">Your Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="appeals" className="relative">
              Appeals
              {bookingsWithCharges.length > 0 && (
                <span className="ml-1 h-2 w-2 bg-destructive rounded-full"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Bell className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Bookings</CardTitle>
                <CardDescription>Your scheduled cleaning appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">No upcoming bookings</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <BookingHistory />
          </TabsContent>

          <TabsContent value="appeals" className="space-y-4">
            {bookingsWithCharges.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No charges to appeal</p>
                </CardContent>
              </Card>
            ) : (
              bookingsWithCharges.map((booking) => (
                <NoShowAppeal 
                  key={booking.id} 
                  booking={booking} 
                  onAppealSubmitted={fetchBookingsWithCharges}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="settings">
            <NotificationPreferencesPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerDashboard;