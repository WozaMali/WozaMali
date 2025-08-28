"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const SignIn = () => {
  const navigate = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message || "Please check your credentials and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        navigate.push("/");
      }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    try {
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
      }
      // If successful, user will be redirected to Google OAuth
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-orange-600 relative overflow-hidden">
      {/* Top Section - centered logo in dark background */}
      <div className="flex flex-col items-center justify-center h-[40vh]">
        {/* Logo - Yellow W logo */}
        <div className="w-40 h-40">
          <Image
            src="/WozaMali-uploads/w white.png"
            alt="Woza Mali Logo"
            width={320}
            height={320}
            className="w-full h-full object-contain"
          />
        </div>
        {/* Powered by text */}
        <div className="text-center mt-4">
          <p className="text-white/80 text-sm font-medium">Powered by</p>
          <p className="text-white text-lg font-bold">Sebenza Nathi Waste</p>
        </div>
      </div>

      {/* White section - now directly connected to the gradient */}
      <div className="bg-white flex-1 flex flex-col items-center justify-start pt-16 pb-8 px-6 min-h-[60vh] shadow-[0_-10px_30px_rgba(234,179,8,0.3)]">
        {/* Sign in text */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold mb-2 text-gray-600">
            Sign in to your Woza Mali account
          </h2>
          <p className="text-sm text-gray-600">
            Enter your credentials to access your account
          </p>
        </div>

        {/* Google Sign In Button */}
        <div className="w-full max-w-sm mb-6">
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full h-12 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 text-base font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center space-x-3"
          >
            {googleLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
        <div className="w-full max-w-sm mb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or sign in with email</span>
            </div>
          </div>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          <div>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="h-10 text-center text-sm font-medium bg-white border-2 border-gray-600 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all duration-200 placeholder:text-gray-400 text-gray-600 [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-600 [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset] [&:-webkit-autofill]:border-gray-600 [&:-webkit-autofill]:-webkit-text-fill-color-gray-600"
              style={{
                WebkitTextFillColor: 'rgb(75, 85, 99)',
                color: 'rgb(75, 85, 99)'
              }}
            />
          </div>

          <div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="h-10 text-center text-sm font-medium bg-white border-2 border-gray-600 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all duration-200 placeholder:text-gray-400 text-gray-600 [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-600 [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset] [&:-webkit-autofill]:border-gray-600 [&:-webkit-autofill]:-webkit-text-fill-color-gray-600"
              style={{
                WebkitTextFillColor: 'rgb(75, 85, 99)',
                color: 'rgb(75, 85, 99)'
              }}
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white text-base font-bold rounded-lg shadow-xl transition-all duration-200 transform hover:scale-105 border-0"
              disabled={loading}
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </Button>
          </div>
        </form>

        {/* Bottom Links */}
        <div className="mt-8 space-y-3 text-center">
          <Link 
            href="/auth/sign-up"
            className="block text-sm text-gray-600 hover:text-orange-500 transition-colors duration-200"
          >
            Don't have an account? <span className="font-bold text-orange-500">Sign Up</span>
          </Link>
          <Link 
            href="/auth/forgot-password"
            className="block text-sm text-gray-600 hover:text-orange-500 transition-colors duration-200"
          >
            FORGOT YOUR PASSWORD?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
