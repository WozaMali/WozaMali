import { useState } from "react";
import { Home, Gift, Heart, History, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "rewards", label: "Rewards", icon: Gift },
    { id: "scholar", label: "Scholar Fund", icon: Heart },
    { id: "history", label: "History", icon: History },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl z-50 backdrop-blur-sm">
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center space-y-2 transition-all duration-300 relative group overflow-hidden",
                isActive 
                  ? "text-yellow-600 dark:text-yellow-400" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
            >
              {/* Modern Active Background */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/20 via-yellow-400/30 to-yellow-500/20 dark:from-yellow-600/30 dark:via-yellow-500/40 dark:to-yellow-600/30 rounded-t-3xl"></div>
              )}
              
              {/* Floating Icon Container */}
              <div className={cn(
                "relative z-10 transition-all duration-300",
                isActive 
                  ? "transform -translate-y-1" 
                  : "group-hover:transform group-hover:-translate-y-0.5"
              )}>
                {/* Icon Background Circle */}
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative",
                  isActive 
                    ? "bg-gradient-to-br from-yellow-500 to-yellow-600 dark:from-yellow-400 dark:to-yellow-500 shadow-lg shadow-yellow-500/30 dark:shadow-yellow-500/40" 
                    : "bg-gray-100 dark:bg-gray-700 group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/30"
                )}>
                  <Icon className={cn(
                    "h-6 w-6 transition-all duration-300",
                    isActive 
                      ? "text-white drop-shadow-sm" 
                      : "text-gray-500 dark:text-gray-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400"
                  )} />
                  
                  {/* Active State Ring */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full border-2 border-yellow-300 dark:border-yellow-500 animate-pulse"></div>
                  )}
                </div>
              </div>
              
              {/* Modern Label */}
              <span className={cn(
                "text-xs font-medium transition-all duration-300 relative z-10 px-2 py-1 rounded-full",
                isActive 
                  ? "text-yellow-700 dark:text-yellow-300 bg-yellow-100/50 dark:bg-yellow-900/30 font-semibold" 
                  : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
              )}>
                {tab.label}
              </span>
              
              {/* Bottom Progress Bar */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent dark:via-yellow-400"></div>
              )}
              
              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/5 to-transparent dark:from-yellow-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl"></div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;