import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import Dashboard from "@/components/Dashboard";
import Rewards from "@/components/Rewards";
import GreenScholarFund from "@/components/GreenScholarFund";
import History from "@/components/History";
import Profile from "@/components/Profile";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Map URL paths to tab IDs
  const getActiveTabFromPath = (pathname: string) => {
    if (pathname === '/rewards') return 'rewards';
    if (pathname === '/fund') return 'scholar';
    if (pathname === '/history') return 'history';
    if (pathname === '/profile') return 'profile';
    return 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromPath(location.pathname));

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTabFromPath(location.pathname));
  }, [location.pathname]);

  // Handle tab change and navigation
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'rewards') {
      navigate('/rewards');
    } else if (tab === 'scholar') {
      navigate('/fund');
    } else if (tab === 'history') {
      navigate('/history');
    } else if (tab === 'profile') {
      navigate('/profile');
    } else {
      navigate('/');
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
