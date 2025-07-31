import { useState } from "react";
import BottomNavigation from "@/components/BottomNavigation";
import Dashboard from "@/components/Dashboard";
import Rewards from "@/components/Rewards";
import GreenScholarFund from "@/components/GreenScholarFund";
import History from "@/components/History";
import Profile from "@/components/Profile";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

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
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
