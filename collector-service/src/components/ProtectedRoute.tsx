import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/use-auth';

import { canAccessAdmin, canAccessCollector, getRoleDisplayName } from '@/lib/auth-schema';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'COLLECTOR' | 'CUSTOMER';
  adminOnly?: boolean;
  collectorOnly?: boolean;
}

export function ProtectedRoute({ children, requiredRole, adminOnly, collectorOnly }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login
    router.push('/login');
    return null;
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    router.push('/unauthorized');
    return null;
  }

  if (adminOnly && !canAccessAdmin(user)) {
    router.push('/unauthorized');
    return null;
  }

  if (collectorOnly && !canAccessCollector(user)) {
    router.push('/unauthorized');
    return null;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute adminOnly>{children}</ProtectedRoute>;
}

export function CollectorRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute collectorOnly>{children}</ProtectedRoute>;
}
