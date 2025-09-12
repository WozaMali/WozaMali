"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';

interface ProtectedCollectorRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedCollectorRoute({ 
  children, 
  fallback 
}: ProtectedCollectorRouteProps) {
  const { user, userRole, loading, isLoading } = useAuth() as any;
  const router = useRouter();

  useEffect(() => {
    if (!(loading || isLoading) && !user) {
      router.push('/auth/sign-in');
    }
  }, [user, loading, isLoading, router]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Wait for role hydration before deciding access
  if (userRole === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Check if user has collector role
  if (userRole !== 'collector' && userRole !== 'admin' && userRole !== 'manager') {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Access Restricted</CardTitle>
            <CardDescription>
              You need collector permissions to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Your current role is: <span className="font-medium">{userRole || 'member'}</span>
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => router.push('/profile')} 
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Profile
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/')} 
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
