import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  Clock,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Earning {
  date: string;
  customer: string;
  amount: number;
  status: string;
  job_id: string;
}

interface EarningsStats {
  thisWeek: number;
  thisMonth: number;
  lastMonth: number;
  totalEarnings: number;
  completedJobs: number;
  pendingPayments: number;
}

export const CleanerEarnings = () => {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [stats, setStats] = useState<EarningsStats>({
    thisWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
    totalEarnings: 0,
    completedJobs: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchEarnings = async () => {
    if (!user) return;

    try {
      // Get cleaner ID first
      const { data: cleaner, error: cleanerError } = await supabase
        .from('cleaners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (cleanerError || !cleaner) {
        throw new Error('Cleaner profile not found');
      }

      // Fetch completed jobs for earnings
      const { data: jobs, error } = await supabase
        .from('bookings')
        .select(`
          id,
          total_price,
          scheduled_date,
          status,
          created_at
        `)
        .eq('cleaner_id', cleaner.id)
        .eq('status', 'completed')
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      // Process earnings data
      const processedEarnings = jobs?.map(job => ({
        date: job.scheduled_date,
        customer: 'Customer',
        amount: job.total_price,
        status: 'completed',
        job_id: job.id
      })) || [];

      setEarnings(processedEarnings);

      // Calculate stats
      const now = new Date();
      const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const thisWeekEarnings = processedEarnings
        .filter(e => new Date(e.date) >= thisWeekStart)
        .reduce((sum, e) => sum + e.amount, 0);

      const thisMonthEarnings = processedEarnings
        .filter(e => new Date(e.date) >= thisMonthStart)
        .reduce((sum, e) => sum + e.amount, 0);

      const lastMonthEarnings = processedEarnings
        .filter(e => {
          const date = new Date(e.date);
          return date >= lastMonthStart && date <= lastMonthEnd;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      const totalEarnings = processedEarnings.reduce((sum, e) => sum + e.amount, 0);

      setStats({
        thisWeek: thisWeekEarnings,
        thisMonth: thisMonthEarnings,
        lastMonth: lastMonthEarnings,
        totalEarnings,
        completedJobs: processedEarnings.length,
        pendingPayments: 0 // For now, assuming no pending payments
      });

    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [user]);

  const monthlyGrowth = stats.lastMonth > 0 
    ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1)
    : '0';

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading earnings data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Earnings</h2>
          <p className="text-muted-foreground">Track your income and payment history</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.thisWeek.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.thisWeek > 0 ? 'Great week!' : 'No earnings yet this week'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.thisMonth.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyGrowth !== '0' && `${monthlyGrowth}% from last month`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {stats.completedJobs} completed jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Job</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.completedJobs > 0 ? (stats.totalEarnings / stats.completedJobs).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Average earning per job
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Earnings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Earnings Yet</h3>
              <p className="text-muted-foreground">
                Complete your first job to start earning money!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {earnings.slice(0, 10).map((earning, index) => (
                <div key={`${earning.job_id}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">{earning.customer}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(earning.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${earning.amount.toFixed(2)}</div>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Paid
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Payment Schedule</h3>
              <p className="text-sm text-blue-700 mt-1">
                Payments are automatically transferred to your bank account 2-7 business days 
                after job completion and customer approval.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};