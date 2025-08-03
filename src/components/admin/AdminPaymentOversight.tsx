import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  MoreHorizontal,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AdminBooking {
  id: string;
  status: string;
  total_price: number;
  scheduled_date: string;
  created_at: string;
  customer_name: string;
  cleaner_name: string;
  payment_status: string;
  commission_earned: number;
  address: string;
}

export const AdminPaymentOversight = () => {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Platform stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    disputedPayments: 0,
    completedPayments: 0
  });

  const fetchBookings = async () => {
    try {
      // Fetch all bookings with customer and cleaner info
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          total_price,
          scheduled_date,
          created_at,
          commission_rate,
          platform_commission,
          address_line1,
          city
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process bookings data
      const processedBookings = data?.map(booking => ({
        id: booking.id,
        status: booking.status,
        total_price: booking.total_price,
        scheduled_date: booking.scheduled_date,
        created_at: booking.created_at,
        customer_name: 'Customer', // Simplified for now
        cleaner_name: 'Cleaner', // Simplified for now
        payment_status: booking.status === 'completed' ? 'held' : 'pending',
        commission_earned: booking.platform_commission || 0,
        address: `${booking.address_line1}, ${booking.city}`
      })) || [];

      setBookings(processedBookings);
      setFilteredBookings(processedBookings);

      // Calculate stats
      const totalRev = processedBookings.reduce((sum, b) => sum + b.commission_earned, 0);
      const pending = processedBookings.filter(b => b.status === 'confirmed').length;
      const completed = processedBookings.filter(b => b.status === 'completed').length;

      setStats({
        totalRevenue: totalRev,
        pendingPayments: pending,
        disputedPayments: 0, // For now
        completedPayments: completed
      });

    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load booking data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Filter bookings based on search and status
  useEffect(() => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.cleaner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  }, [searchTerm, statusFilter, bookings]);

  const handleForceRelease = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const { data, error } = await supabase.functions.invoke('release-payment', {
        body: { bookingId, releaseType: 'admin_override' }
      });

      if (error) throw error;

      toast({
        title: "Payment Released",
        description: "Payment has been released by admin override.",
      });

      fetchBookings(); // Refresh data
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

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (status === 'completed' && paymentStatus === 'held') {
      return <Badge className="bg-yellow-100 text-yellow-800">Payment Held</Badge>;
    }
    if (status === 'completed' && paymentStatus === 'released') {
      return <Badge className="bg-green-100 text-green-800">Payment Released</Badge>;
    }
    if (status === 'confirmed') {
      return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading payment data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Oversight</h2>
          <p className="text-muted-foreground">Monitor and manage platform payments</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total commission earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedPayments}</div>
            <p className="text-xs text-muted-foreground">Jobs completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disputes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.disputedPayments}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by booking ID, customer, or cleaner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bookings found matching your criteria.
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <Card key={booking.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">Booking #{booking.id.slice(0, 8)}</h3>
                        {getStatusBadge(booking.status, booking.payment_status)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>Customer: {booking.customer_name}</div>
                        <div>Cleaner: {booking.cleaner_name}</div>
                        <div>Date: {new Date(booking.scheduled_date).toLocaleDateString()}</div>
                        <div>Address: {booking.address}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">${booking.total_price.toFixed(2)}</div>
                      <div className="text-sm text-green-600">
                        Commission: ${booking.commission_earned.toFixed(2)}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {booking.status === 'completed' && booking.payment_status === 'held' && (
                          <Button 
                            size="sm"
                            onClick={() => handleForceRelease(booking.id)}
                            disabled={actionLoading === booking.id}
                          >
                            {actionLoading === booking.id ? 'Releasing...' : 'Release Payment'}
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};