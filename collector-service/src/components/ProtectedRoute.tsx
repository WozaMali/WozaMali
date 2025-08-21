import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { canAccessAdmin, canAccessCollector, getRoleDisplayName } from '@/lib/auth-schema';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'STAFF' | 'COLLECTOR';
  allowedRoles?: ('ADMIN' | 'STAFF' | 'COLLECTOR')[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  allowedRoles,
  redirectTo 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    const redirectPath = redirectTo || getDefaultRedirectPath(user.role);
    return <Navigate to={redirectPath} replace />;
  }

  // Check if user has any of the allowed roles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = redirectTo || getDefaultRedirectPath(user.role);
    return <Navigate to={redirectPath} replace />;
  }

  // Check specific access permissions
  if (location.pathname.startsWith('/admin') && !canAccessAdmin(user)) {
    return <Navigate to="/collector" replace />;
  }

  if (location.pathname.startsWith('/collector') && !canAccessCollector(user)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

function getDefaultRedirectPath(role: string): string {
  switch (role) {
    case 'ADMIN':
    case 'STAFF':
      return '/admin';
    case 'COLLECTOR':
      return '/collector';
    default:
      return '/dashboard';
  }
}

// Specific route protectors
export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']} redirectTo="/collector">
      {children}
    </ProtectedRoute>
  );
}

export function CollectorRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="COLLECTOR" redirectTo="/admin">
      {children}
    </ProtectedRoute>
  );
}

export function AdminOnlyRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="ADMIN" redirectTo="/admin">
      {children}
    </ProtectedRoute>
  );
}
