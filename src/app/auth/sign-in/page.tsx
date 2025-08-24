"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [profileChecking, setProfileChecking] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    try {
      console.log('Starting Google OAuth...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Google sign in error:', error);
        toast({
          title: "Google Sign In Failed",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      } else {
        console.log('Google OAuth initiated successfully:', data);
        // User will be redirected to Google OAuth
        // After OAuth callback, they will be redirected to the callback page
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast({
        title: "Google Sign In Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const { error: signUpError } = await signUp(email, password, fullName);
        if (signUpError) {
          setError(signUpError.message || "Failed to sign up");
        } else {
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link to verify your account.",
          });
        }
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError.message || "Failed to sign in");
        } else {
          console.log('Sign in successful, checking profile completion...');
          // Wait a moment for the auth state to update, then check profile
          setTimeout(async () => {
            try {
              setProfileChecking(true);
              await checkAndRedirectProfile();
            } catch (profileError) {
              console.error('Error in profile check:', profileError);
              setError("Signed in successfully but encountered an issue. Please try again.");
            } finally {
              setProfileChecking(false);
            }
          }, 1000);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if profile is complete and redirect accordingly
  const checkAndRedirectProfile = async () => {
    try {
      // Get the current user from Supabase auth
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        console.log('No current user found, redirecting to profile completion');
        router.push("/profile/complete");
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, street_address, city, postal_code')
        .eq('id', currentUser.id)
        .single();

      // Check if profile has the minimum required information
      if (!profile || !profile.full_name || !profile.phone || !profile.street_address || !profile.city || !profile.postal_code) {
        console.log('Profile incomplete, redirecting to profile completion');
        router.push("/profile/complete");
      } else {
        console.log('Profile complete, redirecting to dashboard');
        router.push("/");
      }
    } catch (error) {
      console.log('Error checking profile, redirecting to profile completion:', error);
      // If no profile exists or any error occurs, redirect to completion
      router.push("/profile/complete");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Orange Horizontal Bar at Top - 50% Bigger */}
      <div className="h-64 bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="inline-flex items-center justify-center w-48 h-48">
            <img
              src="/WozaMali-uploads/w white.png"
              alt="Woza Mali Logo"
              className="w-28 h-28 drop-shadow-lg"
            />
          </div>
          <div className="text-center -mt-6">
            <p className="text-white/90 text-sm mb-1">
              Powered by
            </p>
            <p className="text-white/90 text-lg font-bold">
              Sebenza Nathi Waste
            </p>
          </div>
        </div>
      </div>

      {/* White Content Section */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Sign in to your Woza Mali Account
            </h2>
            <p className="text-gray-600 text-xs">
              Access your recycling dashboard and track your progress
            </p>
          </div>

          {/* Google Sign In Button */}
          <div className="mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700 text-sm font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center space-x-2"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">or {isSignUp ? "sign up" : "sign in"} with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200 text-sm text-gray-300 placeholder-gray-400"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-transparent transition-colors duration-200 text-sm text-gray-300 placeholder-gray-400"
                placeholder="Enter your password"
                required
              />
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-900 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200 text-sm text-gray-300 placeholder-gray-400"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}

            {error && (
              <div className="text-red-600 text-xs text-center bg-red-50 p-2 rounded-lg">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading || profileChecking}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (isSignUp ? "Creating..." : "Signing In...") : 
               profileChecking ? "Checking Profile..." : 
               (isSignUp ? "Create Account" : "Sign In")}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-gray-600 hover:text-gray-700 font-medium text-xs transition-colors duration-200"
              >
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <span className="text-orange-600 hover:text-orange-700 font-bold">
                  {isSignUp ? "Sign In" : "Sign Up"}
                </span>
              </button>
            </div>

            {!isSignUp && (
              <div className="text-center">
                <Link 
                  href="/auth/forgot-password"
                  className="text-orange-600 hover:text-orange-700 font-medium text-xs transition-colors duration-200"
                >
                  Forgot your password?
                </Link>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
