"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Index from "@/pages/Index";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  
  // Try to use auth context, but handle the case where it might not be ready
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    // AuthProvider not ready yet, show loading
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  const { user, loading, isLoading, bootGrace } = authContext as any;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log('Page useEffect - mounted:', mounted, 'loading:', loading, 'isLoading:', isLoading, 'bootGrace:', bootGrace, 'user:', user);
    
    // Only redirect if we're mounted, not loading, and definitely no user
    // Use bootGrace to prevent redirect flicker during refresh
    if (mounted && !loading && !isLoading && !bootGrace && user === null) {
      console.log('Redirecting to sign-in...');
      router.push('/auth/sign-in');
    }
  }, [user, loading, isLoading, bootGrace, router, mounted]);

  // Show loading while authentication is being determined
  if (!mounted || loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is null (will redirect)
  if (user === null) {
    return null;
  }

  // User is authenticated, render the main app
  return <Index />;
}
