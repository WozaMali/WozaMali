import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/hooks/use-theme"
import { AuthProvider } from "@/hooks/use-auth"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"

export default function ClientApp({ Component, pageProps }: AppProps) {
  const [isClient, setIsClient] = useState(false)
  const [queryClient, setQueryClient] = useState<QueryClient | null>(null)

  useEffect(() => {
    setIsClient(true)
    setQueryClient(new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
        },
      },
    }))
  }, [])

  // Don't render anything until we're on the client
  if (!isClient || !queryClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Initializing Collector Service...</p>
        </div>
      </div>
    )
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
  )
}
