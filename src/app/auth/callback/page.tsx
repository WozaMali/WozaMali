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

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Starting auth callback...");
        console.log("Current URL:", window.location.href);
        
        // Check for OAuth state and error parameters in URL
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (errorParam) {
          console.error("OAuth error in URL:", errorParam, errorDescription);
          setStatus("error");
          setMessage(`OAuth error: ${errorDescription || errorParam}`);
          
          toast({
            title: "OAuth Authentication Failed",
            description: errorDescription || errorParam || "Please try signing in again.",
            variant: "destructive",
          });
          
          setTimeout(() => {
            router.push("/auth/sign-in");
          }, 3000);
          return;
        }
        
        // Check for OAuth code parameter
        const codeParam = urlParams.get('code');
        console.log("OAuth code parameter:", codeParam ? "Present" : "Missing");
        
        // Get the session from the URL hash or query params
        const { data, error } = await supabase.auth.getSession();
        console.log("Session data:", data);
        console.log("Session error:", error);

        if (error) {
          console.error("Auth callback error:", error);
          setStatus("error");
          setMessage(`Authentication failed: ${error.message}`);
          
          // Show error toast
          toast({
            title: "Authentication Failed",
            description: error.message || "Please try signing in again.",
            variant: "destructive",
          });

          // Redirect to sign-in after a delay
          setTimeout(() => {
            router.push("/auth/sign-in");
          }, 3000);
          return;
        }

        if (data.session) {
          console.log("Session found, user:", data.session.user);
          setStatus("success");
          setMessage("Authentication successful! Checking profile...");
          
          // Show success toast
          toast({
            title: "Welcome!",
            description: "You have successfully signed in.",
          });

          // Check if profile exists and has required fields
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, phone, street_address, city, postal_code')
              .eq('id', data.session.user.id)
              .single();

            // Check if profile has the minimum required information
            if (!profile || !profile.full_name || !profile.phone || !profile.street_address || !profile.city || !profile.postal_code) {
              setMessage("Redirecting to complete your profile...");
              setTimeout(() => {
                router.push("/profile/complete");
              }, 1500);
            } else {
              setMessage("Redirecting to dashboard...");
              setTimeout(() => {
                router.push("/");
              }, 1500);
            }
          } catch (error) {
            // If no profile exists or any error occurs, redirect to completion
            console.log('Profile check error, redirecting to profile completion:', error);
            setMessage("Redirecting to complete your profile...");
            setTimeout(() => {
              router.push("/profile/complete");
            }, 1500);
          }
        } else {
          // No session found, try to handle OAuth code manually
          console.log("No session found in callback");
          
          if (codeParam) {
            console.log("Attempting to exchange OAuth code manually...");
            setMessage("Completing OAuth exchange...");
            
            try {
              // Try to exchange the code for a session
              const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(codeParam);
              
              if (exchangeError) {
                console.error("Code exchange error:", exchangeError);
                setStatus("error");
                setMessage(`OAuth exchange failed: ${exchangeError.message}`);
                
                setTimeout(() => {
                  router.push("/auth/sign-in");
                }, 3000);
                return;
              }
              
              if (exchangeData.session) {
                console.log("Code exchange successful, session:", exchangeData.session);
                setStatus("success");
                setMessage("Authentication successful! Checking profile...");
                
                // Continue with profile check
                try {
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, phone, street_address, city, postal_code')
                    .eq('id', exchangeData.session.user.id)
                    .single();

                  if (!profile || !profile.full_name || !profile.phone || !profile.street_address || !profile.city || !profile.postal_code) {
                    setMessage("Redirecting to complete your profile...");
                    setTimeout(() => {
                      router.push("/profile/complete");
                    }, 1500);
                  } else {
                    setMessage("Redirecting to dashboard...");
                    setTimeout(() => {
                      router.push("/");
                    }, 1500);
                  }
                } catch (profileError) {
                  console.log('Profile check error, redirecting to profile completion:', profileError);
                  setMessage("Redirecting to complete your profile...");
                  setTimeout(() => {
                    router.push("/profile/complete");
                  }, 1500);
                }
                return;
              }
            } catch (exchangeError) {
              console.error("Manual code exchange failed:", exchangeError);
            }
          }
          
          // If we get here, no session and no successful code exchange
          setStatus("error");
          setMessage("No active session found. This usually means the OAuth flow didn't complete properly. Redirecting to sign-in...");
          
          setTimeout(() => {
            router.push("/auth/sign-in");
          }, 2000);
        }
      } catch (error: any) {
        console.error("Unexpected error in auth callback:", error);
        setStatus("error");
        setMessage("An unexpected error occurred. Redirecting to sign-in...");
        
        setTimeout(() => {
          router.push("/auth/sign-in");
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Orange Horizontal Bar at Top - 50% Bigger */}
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
              {status === "loading" && "Please wait while we complete your sign-in process..."}
              {status === "success" && "Your account has been successfully authenticated. You will be redirected to the dashboard shortly."}
              {status === "error" && "There was an issue with your authentication. Please try signing in again or contact support if the problem persists."}
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
