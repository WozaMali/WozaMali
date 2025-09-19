"use client";

import { useTheme as useNextTheme } from "next-themes";
import { useEffect, useState } from "react";

export function useTheme() {
  const { theme, setTheme, systemTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Always use system theme - no manual theme switching
    setTheme("system");
  }, [setTheme]);

  const currentTheme = systemTheme || "light";

  // No theme toggling - always follows browser preference
  const toggleTheme = () => {
    // No-op - theme always follows system
  };

  const setLightTheme = () => {
    // No-op - theme always follows system
  };
  
  const setDarkTheme = () => {
    // No-op - theme always follows system
  };
  
  const setSystemTheme = () => {
    // No-op - theme always follows system
  };

  return {
    theme: currentTheme,
    setTheme: () => {}, // No-op
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
    mounted,
    isDark: currentTheme === "dark",
    isLight: currentTheme === "light",
    isSystem: true, // Always true since we only use system
  };
}
