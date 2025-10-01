"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const AuthCallback = () => {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing authentication...");
  const [isClient, setIsClient] = useState(false);

  // Ensure component is mounted on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    let timeoutId: NodeJS.Timeout;
    
    const handleAuthCallback = async () => {
      try {
        console.log("Starting auth callback...");
        
        // Check for OAuth parameters
        const urlParams = new URLSearchParams(window.location.search);
        const codeParam = urlParams.get('code');
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        console.log("OAuth parameters:", { codeParam: !!codeParam, errorParam, errorDescription });
        
        // Handle OAuth errors
        if (errorParam) {
          console.error("OAuth error:", errorParam, errorDescription);
          setStatus("error");
          setMessage(`Authentication failed: ${errorDescription || errorParam}`);
          
          toast({
            title: "Authentication Failed",
            description: errorDescription || errorParam || "Please try signing in again.",
            variant: "destructive",
          });
          
          timeoutId = setTimeout(() => router.push("/auth/sign-in"), 3000);
          return;
        }
        
        // If we have a code, exchange it for a session
        if (codeParam) {
          console.log("Exchanging OAuth code for session...");
          setMessage("Completing OAuth exchange...");
          
          const { data, error } = await supabase.auth.exchangeCodeForSession(codeParam);
          
          if (error) {
            console.error("Code exchange error:", error);
            setStatus("error");
            setMessage(`Authentication failed: ${error.message}`);
            
            toast({
              title: "Authentication Failed",
              description: error.message || "Please try signing in again.",
              variant: "destructive",
            });
            
            timeoutId = setTimeout(() => router.push("/auth/sign-in"), 3000);
            return;
          }
          
          if (data.session) {
            console.log("Code exchange successful");
            setStatus("success");
            setMessage("Authentication successful! Redirecting...");
            
            // Wait a moment for the session to be fully established
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if user profile exists in unified schema
            try {
              const { data: userProfile, error: profileError } = await supabase
                .from('users')
                .select('first_name, last_name, phone, street_addr, township_id, subdivision, city, postal_code')
                .eq('id', data.session.user.id)
                .single();

              console.log('Profile check result:', { userProfile, profileError });

              // If no profile exists or profile is incomplete, redirect to profile completion
              if (profileError || !userProfile || !userProfile.first_name || !userProfile.last_name || !userProfile.township_id || !userProfile.subdivision) {
                console.log('Profile incomplete or missing, redirecting to profile completion');
                setMessage("Redirecting to complete your profile...");
                timeoutId = setTimeout(() => router.push("/auth/profile-complete"), 1500);
              } else {
                console.log('Profile complete, redirecting to dashboard');
                setMessage("Redirecting to dashboard...");
                timeoutId = setTimeout(() => router.push("/"), 1500);
              }
            } catch (profileError) {
              console.log('Profile check error, redirecting to profile completion:', profileError);
              setMessage("Redirecting to complete your profile...");
              timeoutId = setTimeout(() => router.push("/auth/profile-complete"), 1500);
            }
            return;
          }
        }
        
        // If no code, check for existing session
        console.log("No OAuth code found, checking for existing session...");
        
        // Wait a moment for any pending OAuth session to establish
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log("User authenticated:", session.user);
          setStatus("success");
          setMessage("Authentication successful! Redirecting...");
          
          toast({
            title: "Welcome!",
            description: "You have successfully signed in.",
          });
          
          // Check user profile in unified schema
          try {
            const { data: userProfile, error: profileError } = await supabase
              .from('users')
              .select('first_name, last_name, phone, street_addr, township_id, subdivision, city, postal_code')
              .eq('id', session.user.id)
              .single();

            console.log('Session profile check result:', { userProfile, profileError });

            // If no profile exists or profile is incomplete, redirect to profile completion
            if (profileError || !userProfile || !userProfile.first_name || !userProfile.last_name || !userProfile.township_id || !userProfile.subdivision) {
              console.log('Session profile incomplete or missing, redirecting to profile completion');
              setMessage("Redirecting to complete your profile...");
              timeoutId = setTimeout(() => router.push("/auth/profile-complete"), 1500);
            } else {
              console.log('Session profile complete, redirecting to dashboard');
              setMessage("Redirecting to dashboard...");
              timeoutId = setTimeout(() => router.push("/"), 1500);
            }
          } catch (error) {
            console.log('Session profile check error, redirecting to profile completion:', error);
            setMessage("Redirecting to complete your profile...");
            timeoutId = setTimeout(() => router.push("/auth/profile-complete"), 1500);
          }
        } else {
          // No session found - this should rarely happen after OAuth
          console.log("No session found after OAuth");
          setStatus("error");
          setMessage("Authentication incomplete. Redirecting to sign-in...");
          
          timeoutId = setTimeout(() => router.push("/auth/sign-in"), 2000);
        }
      } catch (error: any) {
        console.error("Unexpected error in auth callback:", error);
        setStatus("error");
        setMessage("An unexpected error occurred. Redirecting to profile completion...");
        
        // For OAuth users, try profile completion first before falling back to sign-in
        timeoutId = setTimeout(() => router.push("/auth/profile-complete"), 2000);
      }
    };

    // Add a global timeout to prevent infinite loading
    const globalTimeout = setTimeout(() => {
      console.error("Global timeout reached, redirecting to profile completion");
      setStatus("error");
      setMessage("Authentication timeout. Redirecting to profile completion...");
      router.push("/auth/profile-complete");
    }, 15000); // 15 second global timeout

    handleAuthCallback();
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(globalTimeout);
    };
  }, [router, isClient]);

  // Show loading while component is mounting
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 dark:from-yellow-500 dark:via-yellow-600 dark:to-yellow-700">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        </div>
        
        <div className="relative px-6 py-16 sm:py-24">
          <div className="text-center text-white">
            <div className="mb-6">
              <Image
                src="/WozaMali-uploads/w white.png"
                alt="Woza Mali Logo"
                width={128}
                height={128}
                className="w-32 h-32 drop-shadow-lg mx-auto"
              />
            </div>
            <p className="text-white/90 text-lg mb-2">Powered by</p>
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 drop-shadow-lg">
              Sebenza Nathi Waste
            </h1>
            <p className="text-white/80 text-sm">
              {status === "loading" && "Please wait while we complete your sign-in..."}
              {status === "success" && "You will be redirected shortly"}
              {status === "error" && "Please try signing in again"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-8 px-6 pb-8">
        <div className="max-w-md mx-auto">
          <div className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8">
            {/* Status */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {status === "loading" && "Processing Authentication"}
                {status === "success" && "Welcome to Woza Mali!"}
                {status === "error" && "Authentication Failed"}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {status === "loading" && "Please wait while we complete your sign-in..."}
                {status === "success" && "You will be redirected shortly"}
                {status === "error" && "Please try signing in again"}
              </p>
            </div>

            {/* Status Indicator */}
            <div className="mb-8">
              {status === "loading" && (
                <div className="flex items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600"></div>
                  </div>
                </div>
              )}
              {status === "success" && (
                <div className="flex items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
              {status === "error" && (
                <div className="flex items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Message */}
            <div className="text-center">
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                {message}
              </p>
            </div>

            {/* Actions */}
            {status === "error" && (
              <div className="mt-8 space-y-3">
                <Button 
                  onClick={() => window.location.href = '/auth/sign-in'}
                  className="w-full h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="w-full h-12 border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 font-semibold rounded-xl transition-all duration-200"
                >
                  Go Home
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
