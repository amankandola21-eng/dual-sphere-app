import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'customer' | 'cleaner' | 'admin' | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user role:', error);
          return;
        }

        if (roles && roles.length > 0) {
          // If user has multiple roles, prioritize admin > cleaner > customer
          const rolesPriority = ['admin', 'cleaner', 'customer'];
          const userRoles = roles.map(r => r.role);
          
          for (const role of rolesPriority) {
            if (userRoles.includes(role as any)) {
              setUserRole(role as UserRole);
              break;
            }
          }
        } else {
          // Default to customer if no role is found
          setUserRole('customer');
          
          // Create customer role for new users
          await supabase
            .from('user_roles')
            .insert({ user_id: user.id, role: 'customer' });
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return { userRole, loading };
};