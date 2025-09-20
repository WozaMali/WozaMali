"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Index from "@/pages/Index";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingSpinner from "@/components/LoadingSpinner";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { IOSInstallInstructions } from "@/components/PWAInstallPrompt";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isAppVisible, setIsAppVisible] = useState(true);
  const router = useRouter();
  
  // Try to use auth context, but handle the case where it might not be ready
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error('AuthContext error:', error);
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
        <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  const { user, loading, isLoading, bootGrace } = authContext as any;

  useEffect(() => {
    setMounted(true);
    
    // Handle app visibility changes (lock/unlock scenarios)
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsAppVisible(isVisible);
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also listen for page show/hide events for better mobile support
    window.addEventListener('pageshow', handleVisibilityChange);
    window.addEventListener('pagehide', () => setIsAppVisible(false));

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handleVisibilityChange);
      window.removeEventListener('pagehide', () => setIsAppVisible(false));
    };
  }, []);

  useEffect(() => {
    console.log('Page useEffect - mounted:', mounted, 'loading:', loading, 'isLoading:', isLoading, 'bootGrace:', bootGrace, 'user:', user, 'isAppVisible:', isAppVisible);
    
    // Only redirect if we're mounted, not loading, and definitely no user
    // Use bootGrace to prevent redirect flicker during refresh
    if (mounted && !loading && !isLoading && !bootGrace && user === null) {
      console.log('Redirecting to sign-in...');
      router.push('/auth/sign-in');
    }
  }, [user, loading, isLoading, bootGrace, router, mounted, isAppVisible]);

  // Show loading while authentication is being determined
  if (!mounted || loading || isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  // Show background state when app is not visible
  if (!isAppVisible) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-pulse rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">App is in background...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is null (will redirect)
  if (user === null) {
    return null;
  }

  // User is authenticated, render the main app with error boundary
  return (
    <>
      <ErrorBoundary fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Something went wrong</h2>
            <p className="text-gray-600 dark:text-gray-400">Please try refreshing the page</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      }>
        <Index />
      </ErrorBoundary>
      
      {/* PWA Install Prompts */}
      <PWAInstallPrompt />
      <IOSInstallInstructions />
    </>
  );
}