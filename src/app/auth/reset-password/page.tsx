"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const ResetPassword = () => {
  const navigate = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
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
      // For password reset, we need to use the session from the reset link
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("No valid reset session found. Please use the reset link from your email.");
      }

      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      // Sign out the user after password reset for security
      await supabase.auth.signOut();
      
      toast({
        title: "Password updated!",
        description: "Your password has been successfully reset. Please sign in with your new password.",
      });
      
      navigate.push("/auth/sign-in");
    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      toast({
        title: "Password reset failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
            Enter your new password below
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Password"}
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

export default ResetPassword;
