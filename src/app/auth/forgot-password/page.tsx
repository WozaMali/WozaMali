"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const ForgotPassword = () => {
  const navigate = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast({
          title: "Reset failed",
          description: error.message || "Please check your email and try again.",
          variant: "destructive",
        });
      } else {
        setSent(true);
        toast({
          title: "Reset email sent!",
          description: "Please check your email for password reset instructions.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-white">
        {/* Orange Horizontal Bar at Top - 50% Bigger */}
        <div className="h-48 bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="inline-flex items-center justify-center w-28 h-28 mb-4">
              <Image
                src="/WozaMali-uploads/w white.png"
                alt="Woza Mali Logo"
                width={64}
                height={64}
                className="drop-shadow-lg"
              />
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
              Check Your Email
            </h1>
            <p className="text-white/90 text-sm mb-3">
              We've sent you a password reset link
            </p>
            <p className="text-white/80 text-xs">
              Powered by Sebenza Nathi Waste
            </p>
          </div>
        </div>

        {/* White Content Section */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Email Sent Successfully!
              </h2>
              <p className="text-gray-600 mb-4">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Please check your email and click the link to reset your password. The link will expire in 1 hour.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => setSent(false)}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Try Different Email
              </Button>
              
              <Button 
                onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                disabled={loading}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {loading ? "Sending..." : "Resend Email"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Orange Horizontal Bar at Top - 50% Bigger */}
      <div className="h-48 bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="inline-flex items-center justify-center w-28 h-28 mb-4">
            <Image
              src="/WozaMali-uploads/w white.png"
              alt="Woza Mali Logo"
              width={64}
              height={64}
              className="drop-shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
            Reset Password
          </h1>
          <p className="text-white/90 text-sm mb-3">
            Enter your email to receive a reset link
          </p>
          <p className="text-white/80 text-xs">
            Powered by Sebenza Nathi Waste
          </p>
        </div>
      </div>

      {/* White Content Section */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                placeholder="Enter your email"
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-center">
              <Link 
                href="/auth/sign-in"
                className="text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors duration-200"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
