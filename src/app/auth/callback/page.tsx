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
            
            // Check if profile exists and redirect accordingly
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, phone, street_address, city, postal_code')
                .eq('id', data.session.user.id)
                .single();

              if (!profile || !profile.full_name || !profile.phone || !profile.street_address || !profile.city || !profile.postal_code) {
                setMessage("Redirecting to complete your profile...");
                timeoutId = setTimeout(() => router.push("/profile/complete"), 1500);
              } else {
                setMessage("Redirecting to dashboard...");
                timeoutId = setTimeout(() => router.push("/"), 1500);
              }
            } catch (profileError) {
              console.log('Profile check error, redirecting to profile completion:', profileError);
              setMessage("Redirecting to complete your profile...");
              timeoutId = setTimeout(() => router.push("/profile/complete"), 1500);
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
          
          // Check profile and redirect
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, phone, street_address, city, postal_code')
              .eq('id', session.user.id)
              .single();

            if (!profile || !profile.full_name || !profile.phone || !profile.street_address || !profile.city || !profile.postal_code) {
              setMessage("Redirecting to complete your profile...");
              timeoutId = setTimeout(() => router.push("/profile/complete"), 1500);
            } else {
              setMessage("Redirecting to dashboard...");
              timeoutId = setTimeout(() => router.push("/"), 1500);
            }
          } catch (error) {
            console.log('Profile check error, redirecting to profile completion:', error);
            setMessage("Redirecting to complete your profile...");
            timeoutId = setTimeout(() => router.push("/profile/complete"), 1500);
          }
        } else {
          // No session found
          console.log("No session found");
          setStatus("error");
          setMessage("No active session found. Redirecting to sign-in...");
          
          timeoutId = setTimeout(() => router.push("/auth/sign-in"), 2000);
        }
      } catch (error: any) {
        console.error("Unexpected error in auth callback:", error);
        setStatus("error");
        setMessage("An unexpected error occurred. Redirecting to sign-in...");
        
        timeoutId = setTimeout(() => router.push("/auth/sign-in"), 3000);
      }
    };

    // Add a global timeout to prevent infinite loading
    const globalTimeout = setTimeout(() => {
      console.error("Global timeout reached, redirecting to sign-in");
      setStatus("error");
      setMessage("Authentication timeout. Please try signing in again.");
      router.push("/auth/sign-in");
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Orange Horizontal Bar at Top */}
      <div className="h-48 bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-28 h-28 mx-auto mb-4">
            <Image
              src="/WozaMali-uploads/w white.png"
              alt="Woza Mali Logo"
              width={64}
              height={64}
              className="drop-shadow-lg"
            />
          </div>
          <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
            {status === "loading" && "Processing..."}
            {status === "success" && "Authentication Successful"}
            {status === "error" && "Authentication Failed"}
          </h2>
          <p className="text-white/90 text-sm mb-3">
            {status === "loading" && "Please wait while we complete your sign-in..."}
            {status === "success" && "You will be redirected shortly"}
            {status === "error" && "Please try signing in again"}
          </p>
          <p className="text-white/80 text-xs">
            Powered by Sebenza Nathi Waste
          </p>
        </div>
      </div>

      {/* White Content Section */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center bg-white border border-gray-200 shadow-lg p-8 rounded-lg max-w-md mx-4">
          {/* Status */}
          <div className="mb-6">
            {status === "loading" && (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            {status === "success" && (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {status === "error" && (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>

          {/* Message */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {status === "loading" && "Processing Authentication"}
              {status === "success" && "Welcome to Woza Mali!"}
              {status === "error" && "Authentication Failed"}
            </h2>
            <p className="text-gray-600">
              {message}
            </p>
          </div>

          {/* Actions */}
          {status === "error" && (
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = '/auth/sign-in'}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Try Again
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Go Home
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
