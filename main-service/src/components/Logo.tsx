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
    // Green Scholar Fund always uses its specific logo
    logoSrc = "/WozaMali-uploads/9c12d890-c6b5-4b95-a3af-15175c504d86.png";
  } else {
    // Woza Mali logo switches based on theme
    logoSrc = resolvedTheme === "dark" 
      ? "/WozaMali-uploads/f6006743-2187-4d7a-8b7c-c77f6b6feda8.png"  // Dark theme logo
      : "/WozaMali-uploads/d6e53af1-4f80-4896-855d-42c46ca1b7e8.png"; // Light theme logo
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
