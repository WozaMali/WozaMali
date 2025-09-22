"use client";

import { useTheme } from "@/hooks/use-theme";
import { Monitor, Moon, Sun } from "lucide-react";

export function ThemeIndicator() {
  const { theme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Sun className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    );
  }

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4 text-yellow-500" />;
      case "dark":
        return <Moon className="h-4 w-4 text-blue-500" />;
      case "system" as any:
        return <Monitor className="h-4 w-4 text-gray-500" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const getThemeText = () => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system" as any:
        return "System";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      {getThemeIcon()}
      <span className="capitalize">{getThemeText()}</span>
    </div>
  );
}
