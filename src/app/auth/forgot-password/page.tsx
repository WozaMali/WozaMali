"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        toast({
          title: "Reset failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setEmailSent(true);
        toast({
          title: "Check your email",
          description: "We've sent you a password reset link.",
        });
      }
    } catch (error) {
      toast({
        title: "Reset failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
        {/* Top Section - centered logo in dark background */}
        <div className="flex items-center justify-center h-[40vh]">
          {/* Logo - Yellow W logo */}
          <div className="w-40 h-40">
            <Image
              src="/WozaMali-uploads/w yellow.png"
              alt="Woza Mali Logo"
              width={320}
              height={320}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* White section - now directly connected to the gradient */}
        <div className="bg-white flex-1 flex flex-col items-center justify-start pt-16 pb-8 px-6 min-h-[60vh] shadow-[0_-10px_30px_rgba(234,179,8,0.3)]">
          {/* Success message */}
          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Check Your Email</h2>
            <p className="text-sm text-gray-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>

          {/* Instructions */}
          <div className="w-full max-w-sm space-y-4 text-center">
            <p className="text-sm text-gray-600">
              Click the link in your email to reset your password. The link will expire in 1 hour.
            </p>
            
            <div className="pt-4">
              <Button 
                onClick={() => setEmailSent(false)}
                className="w-full h-12 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white text-base font-bold rounded-lg shadow-xl transition-all duration-200 transform hover:scale-105 border-0"
              >
                Send Another Email
              </Button>
            </div>
          </div>

          {/* Bottom Links */}
          <div className="mt-8 space-y-3 text-center">
            <Link 
              href="/auth/sign-in"
              className="block text-sm text-gray-600 hover:text-orange-500 transition-colors duration-200"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
      {/* Top Section - centered logo in dark background */}
      <div className="flex items-center justify-center h-[40vh]">
        {/* Logo - Yellow W logo */}
        <div className="w-40 h-40">
          <Image
            src="/WozaMali-uploads/w yellow.png"
            alt="Woza Mali Logo"
            width={320}
            height={320}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* White section - now directly connected to the gradient */}
      <div className="bg-white flex-1 flex flex-col items-center justify-start pt-16 pb-8 px-6 min-h-[60vh] shadow-[0_-10px_30px_rgba(234,179,8,0.3)]">
        {/* Forgot password text */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Forgot Your Password?</h2>
          <p className="text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Reset Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          <div>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="h-10 text-center text-sm font-medium bg-white border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200 placeholder:text-gray-400"
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white text-base font-bold rounded-lg shadow-xl transition-all duration-200 transform hover:scale-105 border-0"
              disabled={loading}
            >
              {loading ? "SENDING..." : "SEND RESET LINK"}
            </Button>
          </div>
        </form>

        {/* Bottom Links */}
        <div className="mt-8 space-y-3 text-center">
          <Link 
            href="/auth/sign-in"
            className="block text-sm text-gray-600 hover:text-orange-500 transition-colors duration-200"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
