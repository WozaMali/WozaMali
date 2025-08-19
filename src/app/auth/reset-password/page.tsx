"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const ResetPasswordForm = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we have the necessary tokens for password reset
    if (!searchParams) {
      setError("Invalid or expired reset link. Please request a new one.");
      return;
    }

    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      setError("Invalid or expired reset link. Please request a new one.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
        toast({
          title: "Reset failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSuccess(true);
        toast({
          title: "Password updated successfully",
          description: "You can now sign in with your new password.",
        });
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      toast({
        title: "Reset failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
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
          {/* Error message */}
          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Reset Link Invalid</h2>
            <p className="text-sm text-gray-600">
              {error}
            </p>
          </div>

          {/* Action buttons */}
          <div className="w-full max-w-sm space-y-4 text-center">
            <div className="pt-4">
              <Link href="/auth/forgot-password">
                <Button
                  className="w-full h-12 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white text-base font-bold rounded-lg shadow-xl transition-all duration-200 transform hover:scale-105 border-0"
                >
                  Request New Reset Link
                </Button>
              </Link>
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

  if (success) {
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
            <h2 className="text-lg font-semibold text-green-600 mb-2">Password Reset Successful!</h2>
            <p className="text-sm text-gray-600">
              Your password has been updated successfully.
            </p>
          </div>

          {/* Action buttons */}
          <div className="w-full max-w-sm space-y-4 text-center">
            <div className="pt-4">
              <Link href="/auth/sign-in">
                <Button
                  className="w-full h-12 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white text-base font-bold rounded-lg shadow-xl transition-all duration-200 transform hover:scale-105 border-0"
                >
                  Sign In Now
                </Button>
              </Link>
            </div>
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
        {/* Reset password text */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Set New Password</h2>
          <p className="text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>

        {/* Reset Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          <div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              className="h-10 text-center text-sm font-medium bg-white border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200 placeholder:text-gray-400 text-black"
            />
          </div>

          <div>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="h-10 text-center text-sm font-medium bg-white border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200 placeholder:text-gray-400 text-black"
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white text-base font-bold rounded-lg shadow-xl transition-all duration-200 transform hover:scale-105 border-0"
              disabled={loading}
            >
              {loading ? "UPDATING..." : "UPDATE PASSWORD"}
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

const ResetPasswordPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
        <div className="flex items-center justify-center h-[40vh]">
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
        <div className="bg-white flex-1 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;
