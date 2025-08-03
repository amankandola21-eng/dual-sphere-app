import { useAuth } from "@/hooks/useAuth";
import { useUserRole, UserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  allowedRoles = ['customer', 'cleaner', 'admin'],
  redirectTo = "/auth"
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();

  // Show loading state while checking auth and role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Redirect if user doesn't have required role - but allow access to their dashboard
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // Only redirect if they're trying to access a restricted role's dashboard
    // For now, show unauthorized message instead of auto-redirect
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Access Restricted</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this area.
          </p>
          <p className="text-sm text-muted-foreground">
            Your role: {userRole} | Required: {allowedRoles.join(', ')}
          </p>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};