"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useRouter();
  
  // Try to use auth context, but handle the case where it might not be ready
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    // AuthProvider not ready yet, show loading
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-white">Initializing...</p>
        </div>
      </div>
    );
  }

  const { signIn, user, loading: authLoading } = authContext;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (mounted && !authLoading && user) {
      navigate.push('/');
    }
  }, [user, authLoading, navigate, mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You've been successfully logged in.",
        });
        navigate.push("/");
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show login form if already authenticated
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500 relative overflow-hidden">
      {/* Top Section - bigger orange space with logo */}
      <div className="text-center">
        {/* Logo - White Woza Mali logo */}
        <div className="w-80 h-80 mx-auto">
          <Image
            src="/WozaMali-uploads/Woza Mali logo white.png"
            alt="Woza Mali Logo"
            width={320}
            height={320}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* White section - now directly connected to the gradient */}
      <div className="bg-white rounded-t-[50%] flex-1 flex flex-col items-center justify-start pt-16 pb-8 px-6 min-h-[70vh]">
        {/* Sign in text */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Sign in to your Woza Mali account</h2>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="h-14 text-center text-lg font-medium bg-white border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200 placeholder:text-gray-400"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="h-14 text-center text-lg font-medium bg-white border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200 placeholder:text-gray-400"
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-16 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white text-xl font-bold rounded-xl shadow-xl transition-all duration-200 transform hover:scale-105 border-0"
              disabled={loading}
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </Button>
          </div>
        </form>

        {/* Bottom Links */}
        <div className="mt-8 space-y-3 text-center">
          <Link 
            href="/auth/forgot-password"
            className="block text-sm text-gray-600 hover:text-orange-500 transition-colors duration-200"
          >
            FORGOT YOUR PASSWORD?
          </Link>
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link 
              href="/auth/sign-up"
              className="text-orange-600 font-bold hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
