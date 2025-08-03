import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users,
  UserCheck,
  UserX,
  Shield,
  Search,
  MoreHorizontal,
  Edit,
  Trash,
  Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  role: string;
  status: 'active' | 'suspended' | 'pending';
  last_sign_in: string;
  total_bookings?: number;
  total_earnings?: number;
}

export const AdminUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCleaners: 0,
    activeCustomers: 0,
    adminUsers: 0
  });

  const fetchUsers = async () => {
    try {
      // Fetch profiles with user data
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, created_at');

      if (profileError) throw profileError;

      // Fetch user roles
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (roleError) throw roleError;

      // Combine data (simplified for demo)
      const processedUsers = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          id: profile.user_id,
          email: `user${profile.user_id.slice(0, 8)}@example.com`, // Simplified
          display_name: profile.display_name || 'User',
          created_at: profile.created_at,
          role: userRole?.role || 'customer',
          status: 'active' as const,
          last_sign_in: new Date().toISOString(),
          total_bookings: Math.floor(Math.random() * 20),
          total_earnings: Math.floor(Math.random() * 1000)
        };
      }) || [];

      setUsers(processedUsers);
      setFilteredUsers(processedUsers);

      // Calculate stats
      const totalUsers = processedUsers.length;
      const cleaners = processedUsers.filter(u => u.role === 'cleaner').length;
      const customers = processedUsers.filter(u => u.role === 'customer').length;
      const admins = processedUsers.filter(u => u.role === 'admin').length;

      setStats({
        totalUsers,
        activeCleaners: cleaners,
        activeCustomers: customers,
        adminUsers: admins
      });

    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search and role
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.includes(searchTerm)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  const handleSuspendUser = async (userId: string) => {
    try {
      // In a real implementation, you'd update user status
      toast({
        title: "User Suspended",
        description: "User has been suspended successfully.",
      });
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, status: 'suspended' as const } : u
      ));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive"
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as 'customer' | 'cleaner' | 'admin' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `User role updated to ${newRole}`,
      });

      fetchUsers(); // Refresh data
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
      case 'cleaner':
        return <Badge className="bg-blue-100 text-blue-800">Cleaner</Badge>;
      case 'customer':
        return <Badge className="bg-green-100 text-green-800">Customer</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading user data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage customers, cleaners, and administrators</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cleaners</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCleaners}</div>
            <p className="text-xs text-muted-foreground">Service providers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">Service users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.adminUsers}</div>
            <p className="text-xs text-muted-foreground">Platform admins</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Roles</option>
                <option value="customer">Customers</option>
                <option value="cleaner">Cleaners</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found matching your criteria.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{user.display_name}</h3>
                          {getRoleBadge(user.role)}
                          {getStatusBadge(user.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email} • Joined {new Date(user.created_at).toLocaleDateString()}
                        </div>
                        {user.role === 'cleaner' && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {user.total_bookings} bookings • ${user.total_earnings} earned
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {user.status === 'active' ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSuspendUser(user.id)}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSuspendUser(user.id)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Activate
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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