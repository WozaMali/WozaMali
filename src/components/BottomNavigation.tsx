import { useState } from "react";
import { Home, Gift, Heart, History, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isNavigating?: boolean;
}

const BottomNavigation = ({ activeTab, onTabChange, isNavigating = false }: BottomNavigationProps) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "rewards", label: "Rewards", icon: Gift },
    { id: "scholar", label: "Scholar Fund", icon: Heart },
    { id: "history", label: "History", icon: History },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-warm z-50">
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              disabled={isNavigating}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 transition-all duration-300",
                isActive 
                  ? "bg-gradient-primary text-primary-foreground scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                isNavigating && "opacity-50 cursor-not-allowed"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "animate-pulse")} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;