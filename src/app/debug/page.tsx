"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DebugPage() {
  const router = useRouter();
  const { user, session, loading, forceLogout } = useAuth();
  const [isClearing, setIsClearing] = useState(false);

  const handleForceLogout = async () => {
    setIsClearing(true);
    try {
      await forceLogout();
      console.log('Force logout completed');
      // Force redirect to sign-in
      window.location.href = '/auth/sign-in';
    } catch (error) {
      console.error('Force logout failed:', error);
      setIsClearing(false);
    }
  };

  const handleClearStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      console.log('All storage cleared');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-center">Debug Page</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user ? 'Logged In' : 'Not Logged In'}</p>
            <p><strong>Session:</strong> {session ? 'Active' : 'None'}</p>
            {user && (
              <div className="text-sm text-gray-600">
                <p>User ID: {user.id}</p>
                <p>Email: {user.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={handleForceLogout} 
              disabled={isClearing}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isClearing ? 'Clearing...' : 'Force Logout & Clear State'}
            </Button>
            
            <Button 
              onClick={handleClearStorage} 
              variant="outline"
              className="w-full"
            >
              Clear All Browser Storage
            </Button>
            
            <Button 
              onClick={() => router.push('/auth/sign-in')} 
              variant="outline"
              className="w-full"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
