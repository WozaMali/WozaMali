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
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/98 to-white/95 dark:from-gray-900 dark:via-gray-900/98 dark:to-gray-900/95 border-t border-gray-200 dark:border-gray-700 shadow-2xl backdrop-blur-md z-[9999] will-change-transform" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999 }}>
      
      <div className="grid grid-cols-5 h-20 relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                console.log('BottomNavigation: Button clicked:', tab.id);
                onTabChange(tab.id);
              }}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 transition-all duration-300 relative group overflow-hidden px-1",
                isActive 
                  ? "text-yellow-600 dark:text-yellow-400" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
            >
            {/* Clean Active Background */}
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-t from-gray-200/60 via-gray-100/40 to-transparent dark:from-gray-800/30 dark:via-gray-700/20 dark:to-transparent rounded-t-3xl shadow-lg shadow-gray-200/20 dark:shadow-gray-800/10"></div>
            )}
              
              {/* Floating Icon Container */}
              <div className={cn(
                "relative z-10 transition-all duration-300",
                isActive 
                  ? "transform -translate-y-0.5" 
                  : "group-hover:transform group-hover:-translate-y-0.5"
              )}>
                {/* Icon Background Circle - Clean Design */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative",
                  isActive 
                    ? "bg-gray-200 dark:bg-gray-600 shadow-lg shadow-gray-200/50 dark:shadow-gray-800/30 ring-1 ring-gray-300 dark:ring-gray-500 transform scale-105" 
                    : "bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 group-hover:shadow-md group-hover:shadow-gray-200/40 dark:group-hover:shadow-gray-800/20 group-hover:ring-1 group-hover:ring-gray-300/40 dark:group-hover:ring-gray-500/40 group-hover:transform group-hover:scale-105"
                )}>
                  <Icon className={cn(
                    "h-5 w-5 transition-all duration-300 relative z-10",
                    isActive 
                      ? "text-gray-700 dark:text-gray-200 drop-shadow-sm" 
                      : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 group-hover:drop-shadow-sm"
                  )} />
                  
                  {/* Clean Active State Ring */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full border-2 border-gray-300 dark:border-gray-500 shadow-lg shadow-gray-200/40 dark:shadow-gray-800/40"></div>
                  )}
                </div>
              </div>
              
              {/* Clean Label Design */}
              <span className={cn(
                "text-xs font-medium transition-all duration-300 relative z-10 px-2 py-1 rounded-full text-center leading-tight",
                isActive 
                  ? "text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 font-semibold shadow-md shadow-gray-200/40 dark:shadow-gray-800/30 ring-1 ring-gray-300/50 dark:ring-gray-500/50 transform scale-105" 
                  : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 group-hover:shadow-sm group-hover:ring-1 group-hover:ring-gray-300/30 dark:group-hover:ring-gray-500/30 group-hover:transform group-hover:scale-105"
              )}>
                {tab.label}
              </span>
              
              {/* Clean Bottom Progress Bar */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-400 via-gray-500 to-gray-400 dark:from-gray-500 dark:via-gray-400 dark:to-gray-500 shadow-lg shadow-gray-300/40 dark:shadow-gray-600/30"></div>
              )}
              
              {/* Clean Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-100/40 to-transparent dark:from-gray-800/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-t-2xl shadow-sm shadow-gray-200/20 dark:shadow-gray-800/10"></div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;