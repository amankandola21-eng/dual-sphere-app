import { useState } from 'react';
import { ConnectAccountSetup } from '@/components/cleaner/ConnectAccountSetup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  TrendingUp,
  MapPin,
  Star,
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const CleanerDashboard = () => {
  const [showConnectSetup, setShowConnectSetup] = useState(true);
  const { user } = useAuth();

  // Mock data - replace with real data from Supabase
  const earnings = {
    thisWeek: 450.00,
    thisMonth: 1850.00,
    totalEarnings: 8750.00
  };

  const upcomingJobs = [
    {
      id: 1,
      customer: "Sarah Johnson",
      date: "2024-02-08",
      time: "10:00 AM",
      duration: "3 hours",
      address: "123 Oak Street",
      amount: 75.00,
      status: "confirmed"
    },
    {
      id: 2,
      customer: "Mike Chen",
      date: "2024-02-09", 
      time: "2:00 PM",
      duration: "2 hours",
      address: "456 Pine Avenue",
      amount: 50.00,
      status: "confirmed"
    }
  ];

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
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Earnings Overview */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
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

      {/* Upcoming Jobs */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">{job.customer}</h3>
                    <Badge variant="secondary">{job.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(job.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {job.time} ({job.duration})
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.address}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">${job.amount.toFixed(2)}</div>
                  <Button size="sm" variant="outline">View Details</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
  );
};

export default CleanerDashboard;