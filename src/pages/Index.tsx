"use client";

import { useState, useEffect } from "react";
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
  
  // Map URL paths to tab IDs
  const getActiveTabFromPath = (pathname: string | null) => {
    if (!pathname) return 'dashboard';
    if (pathname === '/rewards') return 'rewards';
    if (pathname === '/fund') return 'scholar';
    if (pathname === '/history') return 'history';
    if (pathname === '/profile') return 'profile';
    return 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState(() => getActiveTabFromPath(pathname));

  // Update active tab when URL changes (e.g., on browser refresh)
  useEffect(() => {
    const newActiveTab = getActiveTabFromPath(pathname);
    if (newActiveTab !== activeTab) {
      setActiveTab(newActiveTab);
    }
  }, [pathname, activeTab]);

  // Handle tab change and navigation
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Use Next.js router for client-side navigation instead of full page reload
    if (tab === 'rewards') {
      router.push('/rewards');
    } else if (tab === 'scholar') {
      router.push('/fund');
    } else if (tab === 'history') {
      router.push('/history');
    } else if (tab === 'profile') {
      router.push('/profile');
    } else {
      router.push('/');
    }
  };

  const renderActiveComponent = () => {
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
  };

  return (
    <div className="min-h-screen bg-background">
      {renderActiveComponent()}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Index;
