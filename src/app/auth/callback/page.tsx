"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";

const AuthCallback = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing authentication...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash or query params
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          setStatus("error");
          setMessage("Authentication failed. Please try again.");
          
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
          setStatus("success");
          setMessage("Authentication successful! Redirecting...");
          
          // Show success toast
          toast({
            title: "Welcome!",
            description: "You have successfully signed in.",
          });

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push("/");
          }, 1500);
        } else {
          // No session found, redirect to sign-in
          setStatus("error");
          setMessage("No active session found. Redirecting to sign-in...");
          
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-orange-600 relative overflow-hidden">
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-white bg-white/10 backdrop-blur-sm p-8 rounded-lg max-w-md mx-4">
          {/* Logo */}
          <div className="w-20 h-20 mx-auto mb-6">
            <Image
              src="/WozaMali-uploads/w white.png"
              alt="Woza Mali Logo"
              width={80}
              height={80}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Status */}
          <div className="mb-6">
            {status === "loading" && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            )}
            {status === "success" && (
              <div className="text-green-300 text-6xl mb-4">✓</div>
            )}
            {status === "error" && (
              <div className="text-red-300 text-6xl mb-4">✗</div>
            )}
          </div>

          {/* Message */}
          <h2 className="text-xl font-bold mb-4">
            {status === "loading" && "Processing..."}
            {status === "success" && "Success!"}
            {status === "error" && "Oops!"}
          </h2>
          
          <p className="text-lg mb-6">{message}</p>

          {/* Progress bar for loading state */}
          {status === "loading" && (
            <div className="w-full bg-white/20 rounded-full h-2 mb-6">
              <div className="bg-white h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          )}

          {/* Manual redirect button for error state */}
          {status === "error" && (
            <button
              onClick={() => router.push("/auth/sign-in")}
              className="px-6 py-2 bg-white text-orange-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Go to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
