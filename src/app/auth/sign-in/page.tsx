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
