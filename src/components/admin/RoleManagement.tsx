import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, UserCheck, Settings, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const RoleManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchCurrentUserRole();
    }
  }, [user]);

  const fetchCurrentUserRole = async () => {
    try {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);

      if (roles && roles.length > 0) {
        setCurrentUserRole(roles[0].role);
      }
    } catch (error) {
      console.error('Error fetching current user role:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles(role)
        `);

      if (error) throw error;
      setUsers(profiles || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Remove existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Add new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole as 'customer' | 'cleaner' | 'admin' });

      if (error) throw error;

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const makeUserAdmin = async (userId: string) => {
    await updateUserRole(userId, 'admin');
  };

  const getCurrentUserRole = (userRoles: any[]) => {
    if (!userRoles || userRoles.length === 0) return 'customer';
    return userRoles[0].role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5" />
            <span>Your Current Role</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Badge variant="default" className="text-sm">
              {currentUserRole || 'customer'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            {currentUserRole !== 'admin' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => makeUserAdmin(user?.id!)}
              >
                <Shield className="h-4 w-4 mr-2" />
                Make Me Admin
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Assignment Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>User Role Management</span>
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((profile) => {
              const userRole = getCurrentUserRole(profile.user_roles);
              return (
                <div key={profile.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold">
                        {profile.display_name || 'Unknown User'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        User ID: {profile.user_id}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Badge 
                        variant={userRole === 'admin' ? 'default' : 'outline'}
                        className={userRole === 'admin' ? 'bg-red-500' : ''}
                      >
                        {userRole}
                      </Badge>
                      
                      <Select
                        value={userRole}
                        onValueChange={(newRole) => updateUserRole(profile.user_id, newRole)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="cleaner">Cleaner</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-blue-700">Customer</h4>
              <p className="text-sm text-muted-foreground">
                Can book cleaning services, manage bookings, chat with cleaners, leave reviews
              </p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-green-700">Cleaner</h4>
              <p className="text-sm text-muted-foreground">
                Can accept jobs, manage schedule, track earnings, chat with customers
              </p>
            </div>
            
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-red-700">Admin</h4>
              <p className="text-sm text-muted-foreground">
                Can manage all users, oversee payments, configure platform settings, access analytics
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-yellow-700">Important</h4>
              <p className="text-sm text-muted-foreground">
                Role changes take effect immediately. Users will be redirected to their appropriate dashboard 
                based on their new role. Admin access should be granted carefully.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};