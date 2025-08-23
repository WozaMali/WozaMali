import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import all providers with SSR disabled
const ThemeProvider = dynamic(() => import("@/hooks/use-theme").then(mod => ({ default: mod.ThemeProvider })), { ssr: false })
const AuthProvider = dynamic(() => import("@/hooks/use-auth").then(mod => ({ default: mod.AuthProvider })), { ssr: false })
const TooltipProvider = dynamic(() => import("@/components/ui/tooltip").then(mod => ({ default: mod.TooltipProvider })), { ssr: false })
const Toaster = dynamic(() => import("@/components/ui/toaster").then(mod => ({ default: mod.Toaster })), { ssr: false })
const Sonner = dynamic(() => import("@/components/ui/sonner").then(mod => ({ default: mod.Toaster })), { ssr: false })

// Create QueryClient outside component to prevent recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export default function ClientOnlyApp({ Component, pageProps }: AppProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Don't render anything until we're on the client
  if (!isClient) {
    return <div>Loading...</div>
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="woza-mali-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Component {...pageProps} />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
