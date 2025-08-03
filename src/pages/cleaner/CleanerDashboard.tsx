import { useState, useEffect } from 'react';
import { ConnectAccountSetup } from '@/components/cleaner/ConnectAccountSetup';
import { BookingAcceptance } from '@/components/cleaner/BookingAcceptance';
import { GPSVerification } from '@/components/cleaner/GPSVerification';
import { TimeTracking } from '@/components/cleaner/TimeTracking';
import { NotificationPreferencesPanel } from '@/components/shared/NotificationPreferencesPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  TrendingUp,
  MapPin,
  Star,
  Settings,
  Bell,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CleanerDashboard = () => {
  const [showConnectSetup, setShowConnectSetup] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState<any[]>([]);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      // Fetch cleaner's bookings
      const { data: cleanerData } = await supabase
        .from('cleaners')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (cleanerData) {
        // Fetch all bookings for this cleaner
        const { data: bookingsData, error } = await supabase
          .from('bookings')
          .select(`
            *,
            customer:profiles!bookings_user_id_fkey(display_name)
          `)
          .eq('cleaner_id', cleanerData.id)
          .order('scheduled_date', { ascending: true });

        if (error) throw error;

        const pending = bookingsData?.filter(b => b.status === 'pending') || [];
        const confirmed = bookingsData?.filter(b => b.status === 'confirmed') || [];
        
        setPendingBookings(pending);
        setBookings(confirmed);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock data - replace with real data from Supabase
  const earnings = {
    thisWeek: 450.00,
    thisMonth: 1850.00,
    totalEarnings: 8750.00
  };

  if (showConnectSetup) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Welcome to CleanConnect!</h1>
          <p className="text-muted-foreground">Let's get you set up to start earning money as a cleaner.</p>
        </div>
        
        <ConnectAccountSetup onSetupComplete={() => setShowConnectSetup(false)} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Cleaner Dashboard</h1>
          <p className="text-muted-foreground">Manage your cleaning business</p>
        </div>
        <div className="flex gap-2">
          {pendingBookings.length > 0 && (
            <Badge variant="destructive" className="px-3 py-1">
              <AlertCircle className="h-3 w-3 mr-1" />
              {pendingBookings.length} Pending
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => setActiveTab('settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests" className="relative">
            Requests
            {pendingBookings.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {pendingBookings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">Active Jobs</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">
            <Bell className="h-4 w-4 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">
            {/* Earnings Overview */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Week</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${earnings.thisWeek.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${earnings.thisMonth.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${earnings.totalEarnings.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    Since joining
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Schedule
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Payment History
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Star className="h-4 w-4 mr-2" />
                    Customer Reviews
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment Setup</span>
                    <Badge className="bg-green-100 text-green-800">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Profile Verification</span>
                    <Badge className="bg-green-100 text-green-800">Verified</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Background Check</span>
                    <Badge className="bg-green-100 text-green-800">Passed</Badge>
                  </div>
                  <Button className="w-full mt-4" variant="outline" size="sm">
                    Manage Payment Setup
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <div className="space-y-4">
            {pendingBookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending booking requests</p>
                </CardContent>
              </Card>
            ) : (
              pendingBookings.map((booking) => (
                <BookingAcceptance 
                  key={booking.id} 
                  booking={booking} 
                  onBookingUpdated={fetchBookings}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active jobs at this time</p>
                </CardContent>
              </Card>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Booking #{booking.id.slice(0, 8)}</CardTitle>
                        <Badge variant="default">{booking.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(booking.scheduled_date).toLocaleDateString()} at {booking.scheduled_time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.address_line1}, {booking.city}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>${booking.total_price?.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.estimated_hours} hours</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <GPSVerification 
                    booking={booking} 
                    onArrivalConfirmed={fetchBookings}
                  />
                  
                  <TimeTracking 
                    booking={booking} 
                    onTimeUpdated={fetchBookings}
                  />
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Booking history will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <NotificationPreferencesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CleanerDashboard;