import { useState } from 'react';
import { AdminPaymentOversight } from '@/components/admin/AdminPaymentOversight';
import { AdminUserManagement } from '@/components/admin/AdminUserManagement';
import { AdminPlatformSettings } from '@/components/admin/AdminPlatformSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  DollarSign, 
  Users, 
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for dashboard overview
  const platformStats = {
    totalRevenue: 12450.00,
    monthlyGrowth: 18.5,
    activeUsers: 1247,
    pendingDisputes: 3,
    completedBookings: 856,
    activeCleaners: 89
  };

  const recentActivity = [
    { id: 1, type: 'payment', message: 'Payment of $75.00 released to Sarah Johnson', time: '2 minutes ago' },
    { id: 2, type: 'user', message: 'New cleaner registered: Mike Chen', time: '15 minutes ago' },
    { id: 3, type: 'dispute', message: 'Dispute resolved for booking #1234', time: '1 hour ago' },
    { id: 4, type: 'booking', message: '24 new bookings completed today', time: '2 hours ago' },
  ];

  const navigation = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'payments', label: 'Payment Oversight', icon: DollarSign },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'payments':
        return <AdminPaymentOversight />;
      case 'users':
        return <AdminUserManagement />;
      case 'settings':
        return <AdminPlatformSettings />;
      default:
        return (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold">Admin Dashboard</h2>
              <p className="text-muted-foreground">Platform overview and key metrics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${platformStats.totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    +{platformStats.monthlyGrowth}% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformStats.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {platformStats.activeCleaners} cleaners active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Bookings</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformStats.completedBookings}</div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+{platformStats.monthlyGrowth}%</div>
                  <p className="text-xs text-muted-foreground">
                    Monthly growth
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Disputes</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformStats.pendingDisputes}</div>
                  <p className="text-xs text-muted-foreground">
                    Requires attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Cleaners</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformStats.activeCleaners}</div>
                  <p className="text-xs text-muted-foreground">
                    Available for bookings
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment System</span>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">User Authentication</span>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notification Service</span>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button 
                    className="w-full text-left p-2 hover:bg-gray-50 rounded border"
                    onClick={() => setActiveTab('payments')}
                  >
                    Review Pending Payments
                  </button>
                  <button 
                    className="w-full text-left p-2 hover:bg-gray-50 rounded border"
                    onClick={() => setActiveTab('users')}
                  >
                    Manage User Accounts
                  </button>
                  <button 
                    className="w-full text-left p-2 hover:bg-gray-50 rounded border"
                    onClick={() => setActiveTab('settings')}
                  >
                    Update Platform Settings
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6">
          <h1 className="text-xl font-bold">CleanConnect Admin</h1>
          <p className="text-sm text-muted-foreground">Platform Management</p>
        </div>
        <nav className="px-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;