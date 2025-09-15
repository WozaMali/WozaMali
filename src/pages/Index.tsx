"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import BottomNavigation from "@/components/BottomNavigation";
import Dashboard from "@/components/Dashboard";
import Rewards from "@/components/Rewards";
import GreenScholarFund from "@/components/GreenScholarFund";
import History from "@/components/History";
import Profile from "@/components/Profile";

const Index = () => {
  const router = useRouter();
  const pathname = usePathname();
  
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
  const [isNavigating, setIsNavigating] = useState(false);

  // Update active tab when URL changes (e.g., on browser refresh)
  useEffect(() => {
    const newActiveTab = getActiveTabFromPath(pathname);
    if (newActiveTab !== activeTab) {
      setActiveTab(newActiveTab);
    }
  }, [pathname, activeTab, getActiveTabFromPath]);

  // Handle tab change and navigation with debouncing
  const handleTabChange = useCallback((tab: string) => {
    // Prevent multiple rapid clicks
    if (isNavigating) return;
    
    // Only push when the tab actually changes to avoid double-renders
    const current = getActiveTabFromPath(pathname);
    if (current === tab) return;

    setIsNavigating(true);

    // Use Next.js router for client-side navigation
    switch (tab) {
      case 'rewards':
        router.push('/rewards');
        break;
      case 'scholar':
        router.push('/fund');
        break;
      case 'history':
        router.push('/history');
        break;
      case 'profile':
        router.push('/profile');
        break;
      default:
        router.push('/');
    }

    // Reset navigation state after a short delay
    setTimeout(() => setIsNavigating(false), 300);
  }, [pathname, router, getActiveTabFromPath, isNavigating]);

  // Memoize component rendering to prevent unnecessary re-renders
  const renderActiveComponent = useMemo(() => {
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
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-background">
      {renderActiveComponent}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        isNavigating={isNavigating}
      />
    </div>
  );
};

export default Index;
