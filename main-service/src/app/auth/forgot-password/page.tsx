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
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
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
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-orange-600 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 rounded-full backdrop-blur-sm mb-4">
              <Image
                src="/WozaMali-uploads/w white.png"
                alt="Woza Mali Logo"
                width={60}
                height={60}
                className="drop-shadow-lg"
              />
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              Check Your Email
            </h1>
            <p className="text-white/90 mt-2 drop-shadow-md">
              We've sent password reset instructions to {email}
            </p>
          </div>

          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 mb-6">
                Please check your email and click the reset link to continue.
              </p>
              <Button
                onClick={() => setSent(false)}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg"
              >
                Try Another Email
              </Button>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Link
              href="/auth/sign-in"
              className="text-white/80 hover:text-white text-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-orange-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 rounded-full backdrop-blur-sm mb-4">
            <Image
              src="/WozaMali-uploads/w white.png"
              alt="Woza Mali Logo"
              width={60}
              height={60}
              className="drop-shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            Reset Password
          </h1>
          <p className="text-white/90 mt-2 drop-shadow-md">
            Enter your email to receive reset instructions
          </p>
        </div>

        {/* Forgot Password Form */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Forgot Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 text-black"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                ) : (
                  "Send Reset Email"
                )}
              </Button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center">
              <Link
                href="/auth/sign-in"
                className="text-sm text-gray-600 hover:text-gray-700 font-medium hover:underline flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/80 text-sm drop-shadow-md">
            © 2024 Woza Mali. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
