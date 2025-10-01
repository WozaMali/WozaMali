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
      <div className="grid grid-cols-5 h-20">
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
              {/* Gradient Active Background */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-t from-yellow-200/80 via-yellow-100/60 to-transparent dark:from-yellow-800/40 dark:via-yellow-700/30 dark:to-transparent rounded-t-3xl shadow-lg shadow-yellow-200/30 dark:shadow-yellow-800/20"></div>
              )}
              
              {/* Floating Icon Container */}
              <div className={cn(
                "relative z-10 transition-all duration-300",
                isActive 
                  ? "transform -translate-y-0.5" 
                  : "group-hover:transform group-hover:-translate-y-0.5"
              )}>
                {/* Icon Background Circle */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative",
                  isActive 
                    ? "bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 dark:from-yellow-500 dark:via-yellow-600 dark:to-yellow-700 shadow-xl shadow-yellow-200/50 dark:shadow-yellow-800/30" 
                    : "bg-gray-100 dark:bg-gray-700 group-hover:bg-gradient-to-br group-hover:from-yellow-100 group-hover:to-yellow-200 dark:group-hover:from-yellow-900/30 dark:group-hover:to-yellow-800/20 group-hover:shadow-lg group-hover:shadow-yellow-100/50 dark:group-hover:shadow-yellow-800/20"
                )}>
                  <Icon className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isActive 
                      ? "text-white drop-shadow-sm" 
                      : "text-gray-500 dark:text-gray-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400"
                  )} />
                  
                  {/* Active State Ring */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full border-2 border-yellow-300 dark:border-yellow-500 shadow-lg shadow-yellow-200 dark:shadow-yellow-800/50"></div>
                  )}
                </div>
              </div>
              
              {/* Modern Label - Mobile Optimized */}
              <span className={cn(
                "text-xs font-medium transition-all duration-300 relative z-10 px-2 py-1 rounded-full text-center leading-tight",
                isActive 
                  ? "text-yellow-800 dark:text-yellow-200 bg-gradient-to-r from-yellow-300/60 to-yellow-200/60 dark:from-yellow-700/40 dark:to-yellow-600/30 font-semibold shadow-sm shadow-yellow-200/50 dark:shadow-yellow-800/30" 
                  : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 group-hover:bg-yellow-50/50 dark:group-hover:bg-yellow-900/20 group-hover:shadow-sm"
              )}>
                {tab.label}
              </span>
              
              {/* Bottom Progress Bar */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 dark:from-yellow-500 dark:via-yellow-400 dark:to-yellow-500 shadow-lg shadow-yellow-300/50 dark:shadow-yellow-600/30"></div>
              )}
              
              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-yellow-100/60 to-transparent dark:from-yellow-800/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-t-2xl shadow-sm shadow-yellow-200/30 dark:shadow-yellow-800/10"></div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;