"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import BottomNavigation from "@/components/BottomNavigation";
import Dashboard from "@/components/Dashboard";
import Rewards from "@/components/Rewards";
import GreenScholarFund from "@/components/GreenScholarFund";
import History from "@/components/History";
import Profile from "@/components/Profile";
import OfflineBanner from "@/components/OfflineBanner";

const Index = () => {
  const router = useRouter();
  const pathname = usePathname();
  const navigateLockUntil = useRef(0);
  
  // Map URL paths to tab IDs - memoized for performance
  const getActiveTabFromPath = useCallback((pathname: string | null) => {
    if (!pathname) return 'dashboard';
    if (pathname === '/rewards') return 'rewards';
    if (pathname === '/fund') return 'scholar';
    if (pathname === '/history') return 'history';
    if (pathname === '/profile') return 'profile';
    return 'dashboard';
  }, []);
  
  // Initialize with current path to prevent flash
  const [activeTab, setActiveTab] = useState(() => getActiveTabFromPath(pathname));

  // Update active tab when URL changes (e.g., on browser refresh)
  useEffect(() => {
    const newActiveTab = getActiveTabFromPath(pathname);
    if (newActiveTab !== activeTab) {
      setActiveTab(newActiveTab);
    }
  }, [pathname, activeTab, getActiveTabFromPath]);

  // Handle tab change with optimized Next.js routing
  const handleTabChange = useCallback((tab: string) => {
    // Debounce rapid toggles to avoid route churn/loops
    const now = Date.now();
    if (now < navigateLockUntil.current) return;
    navigateLockUntil.current = now + 250;

    // Only change when the tab actually changes
    if (activeTab === tab) return;

    // Use Next.js router for proper navigation
    const url = tab === 'dashboard' ? '/' : 
                tab === 'scholar' ? '/fund' : 
                `/${tab}`;
    
    router.push(url);
  }, [activeTab, router]);

  // Memoize component rendering to prevent unnecessary re-renders
  const renderActiveComponent = useMemo(() => {
    try {
      switch (activeTab) {
        case "dashboard":
          return <Dashboard />;
        case "rewards":
          return <Rewards />;
        case "scholar":
          return <GreenScholarFund />;
        case "history":
          return <History />;
        case "profile":
          return <Profile />;
        default:
          return <Dashboard />;
      }
    } catch (error) {
      console.error('Error rendering component:', error);
      return (
        <div className="min-h-screen flex items-center justify-center">
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
      );
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <OfflineBanner />
      {renderActiveComponent}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
      />
    </div>
  );
};

export default Index;
