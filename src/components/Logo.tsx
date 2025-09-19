import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface LogoProps {
  className?: string;
  alt?: string;
  variant?: "woza-mali" | "green-scholar-fund";
}

const Logo = ({ className = "h-16 w-auto", alt = "Woza Mali Logo", variant = "woza-mali" }: LogoProps) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  // Determine logo source based on variant and theme
  let logoSrc: string;
  
  if (variant === "green-scholar-fund") {
    // Green Scholar Fund switches based on theme
    logoSrc = resolvedTheme === "dark" 
      ? "/WozaMali-uploads/Green Scholar.png"  // Dark theme - Green Scholar.png
      : "/WozaMali-uploads/green scholar grey.png"; // Light theme - green scholar grey.png
  } else {
    // Woza Mali logo switches based on theme
    logoSrc = resolvedTheme === "dark" 
      ? "/WozaMali-uploads/Woza white.png"  // Dark theme - Woza white.png
      : "/WozaMali-uploads/Woza Yellow.png"; // Light theme - Woza Yellow.png
  }

  return (
    <img 
      src={logoSrc} 
      alt={alt} 
      className={className}
    />
  );
};

export default Logo;
