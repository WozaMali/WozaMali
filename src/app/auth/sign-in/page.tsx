"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, UserPlus, Calendar, MapPin, Building, Hash, Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { AddressService, useTownships, useSubdivisions } from "@/lib/addressService";
import { getResidentRoleId } from "@/lib/roles";
import { UserInsert } from "@/lib/supabase";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [profileChecking, setProfileChecking] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  
  // New sign-up form fields
  const [signUpData, setSignUpData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phone: "",
    streetAddress: "",
    townshipId: "",
    subdivision: "",
    city: "Soweto",
    postalCode: ""
  });

  // Address hooks for sign-up form
  const { townships, loading: townshipsLoading, error: townshipsError } = useTownships();
  const { subdivisions, loading: subdivisionsLoading, error: subdivisionsError } = useSubdivisions(signUpData.townshipId);
  
  // Get resident role ID for new users
  const [residentRoleId, setResidentRoleId] = useState<string | null>(null);
  
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();

  // Get resident role ID on component mount
  useEffect(() => {
    const loadRole = async () => {
      const id = await getResidentRoleId();
      if (!id) {
        console.error('Resident role not found. Ensure a role named "resident" or "member" exists, or set NEXT_PUBLIC_RESIDENT_ROLE_ID.');
      }
      setResidentRoleId(id);
    };
    if (isSignUp) {
      loadRole();
    }
  }, [isSignUp]);

  // Redirect if already authenticated (but only if user has a valid session)
  useEffect(() => {
    if (user && user.id) {
      router.replace("/");
    }
  }, [user, router]);

  // Only hide form if user has a valid session, not just any user state
  if (user && user.id) {
    return null;
  }

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    try {
      console.log('Starting Google OAuth...');
      
      // Clear any existing errors
      setError("");
      
      const { Capacitor } = await import('@capacitor/core');
      const isNative = Capacitor.isNativePlatform();
      const redirectTo = isNative
        ? 'com.wozamali.app://auth/callback'
        : `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { access_type: 'offline', prompt: 'consent' },
          skipBrowserRedirect: isNative,
        },
      });

      if (isNative && data?.url) {
        try {
          const { Browser } = await import('@capacitor/browser');
          await Browser.open({ url: data.url, presentationStyle: 'fullscreen' });
          return;
        } catch (e) {
          // Do NOT navigate inside the WebView; this causes Google disallowed_useragent
          console.error('System browser required for Google OAuth:', e);
          setError('Google sign-in requires a secure system browser. Please enable/install Chrome or Samsung Internet and try again.');
          return;
        }
      }

      if (error) {
        console.error('Google sign in error:', error);
        setError(error.message || "Google sign-in failed. Please try again.");
        toast({
          title: "Google Sign In Failed",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      } else {
        console.log('Google OAuth initiated successfully:', data);
        // User will be redirected to Google OAuth
        // After OAuth callback, they will be redirected to the callback page
        toast({
          title: "Redirecting to Google",
          description: "Please complete the Google sign-in process.",
        });
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(error.message || "An unexpected error occurred during Google sign-in.");
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
        // Create user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: signUpData.firstName,
              last_name: signUpData.lastName,
              full_name: `${signUpData.firstName} ${signUpData.lastName}`,
              phone: signUpData.phone,
              street_address: signUpData.streetAddress,
              township_id: signUpData.townshipId,
              subdivision: signUpData.subdivision,
              city: signUpData.city,
              postal_code: signUpData.postalCode,
            },
          },
        });

        if (authError) {
          setError(authError.message || "Failed to create account");
          return;
        }

        if (authData.user && residentRoleId) {
          // Create user profile in our unified users table
          const userData: UserInsert = {
            id: authData.user.id,
            first_name: signUpData.firstName,
            last_name: signUpData.lastName,
            full_name: `${signUpData.firstName} ${signUpData.lastName}`,
            email: email,
            phone: signUpData.phone,
            date_of_birth: signUpData.dateOfBirth,
            street_addr: signUpData.streetAddress,
            township_id: signUpData.townshipId,
            subdivision: signUpData.subdivision,
            city: signUpData.city,
            postal_code: signUpData.postalCode,
            role_id: residentRoleId,
            status: 'active'
          };

          const { error: profileError } = await supabase
            .from('users')
            .insert(userData);

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            setError("Account created but profile setup failed. Please contact support.");
          } else {
            toast({
              title: "Account Created Successfully!",
              description: "Please check your email to verify your account.",
            });
            // Reset form
            setSignUpData({
              firstName: "",
              lastName: "",
              dateOfBirth: "",
              phone: "",
              streetAddress: "",
              townshipId: "",
              subdivision: "",
              city: "Soweto",
              postalCode: ""
            });
            setIsSignUp(false);
          }
        } else {
          setError("Account created but role assignment failed. Please contact support.");
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
        .from('users')
        .select('first_name, last_name, phone, street_addr, township_id, subdivision, city, postal_code')
        .eq('id', currentUser.id)
        .single();

      // Check if profile has the minimum required information
      if (!profile || !profile.first_name || !profile.last_name || !profile.phone || !profile.street_addr || !profile.township_id || !profile.subdivision) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Theme follows browser preference automatically */}

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 dark:from-yellow-500 dark:via-yellow-600 dark:to-yellow-700">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        </div>
        
        <div className="relative px-6 py-16 sm:py-24">
          <div className="text-center text-white">
            <div className="mb-6">
              <img
                src="/WozaMali-uploads/w white.png"
                alt="Woza Mali Logo"
                className="w-32 h-32 drop-shadow-lg mx-auto"
              />
            </div>
            <p className="text-white/90 text-lg mb-2">Powered by</p>
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 drop-shadow-lg">
              Sebenza Nathi Waste
            </h1>
            <p className="text-white/80 text-sm">
              {isSignUp ? "Create your account to start recycling" : "Sign in to access your recycling dashboard"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-8 px-6 pb-8">
        <div className="max-w-md mx-auto">
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {isSignUp ? "Create Account" : "Sign In"}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {isSignUp ? "Join Woza Mali and start your recycling journey" : "Access your recycling dashboard and track your progress"}
                </p>
              </div>

              {/* Google Sign In Button */}
              <div className="mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium py-3 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center space-x-3"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 dark:border-gray-300"></div>
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
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-800 px-3 text-gray-500 dark:text-gray-400 font-medium">or {isSignUp ? "sign up" : "sign in"} with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-yellow-500 dark:focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-400/20 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-yellow-500 dark:focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-400/20 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                {isSignUp && (
                  <>
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          First Name
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="text"
                            id="firstName"
                            value={signUpData.firstName}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, firstName: e.target.value }))}
                            className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-yellow-500 dark:focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-400/20 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                            placeholder="First name"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Last Name
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="text"
                            id="lastName"
                            value={signUpData.lastName}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, lastName: e.target.value }))}
                            className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-yellow-500 dark:focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-400/20 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                            placeholder="Last name"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Date of Birth
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="date"
                          id="dateOfBirth"
                          value={signUpData.dateOfBirth}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                          className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-yellow-500 dark:focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-400/20 transition-all duration-200 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="tel"
                          id="phone"
                          value={signUpData.phone}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, phone: e.target.value }))}
                          className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-yellow-500 dark:focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-400/20 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                          placeholder="Enter your phone number"
                          required
                        />
                      </div>
                    </div>

                    {/* Street Address */}
                    <div className="space-y-2">
                      <Label htmlFor="streetAddress" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Street Address
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          id="streetAddress"
                          value={signUpData.streetAddress}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, streetAddress: e.target.value }))}
                          className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-yellow-500 dark:focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-400/20 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                          placeholder="Enter your street address"
                          required
                        />
                      </div>
                    </div>

                    {/* Township Dropdown */}
                    <div className="space-y-2">
                      <Label htmlFor="townshipId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Township
                      </Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                          id="townshipId"
                          value={signUpData.townshipId}
                          onChange={(e) => {
                            const selectedTownship = townships?.find(t => t.id === e.target.value);
                            setSignUpData(prev => ({ 
                              ...prev, 
                              townshipId: e.target.value,
                              subdivision: "", // Reset subdivision when township changes
                              postalCode: selectedTownship?.postal_code || ""
                            }));
                          }}
                          className="w-full pl-10 pr-4 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-yellow-500 dark:focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-400/20 transition-all duration-200 text-gray-900 dark:text-white rounded-lg"
                          required
                          disabled={townshipsLoading}
                        >
                          <option value="">Select Township</option>
                          {townships?.map((township) => (
                            <option key={township.id} value={township.id}>
                              {township.township_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {townshipsLoading && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading townships...</p>
                      )}
                    </div>

                    {/* Subdivision Dropdown */}
                    <div className="space-y-2">
                      <Label htmlFor="subdivision" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Subdivision
                      </Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                          id="subdivision"
                          value={signUpData.subdivision}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, subdivision: e.target.value }))}
                          className="w-full pl-10 pr-4 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-yellow-500 dark:focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-400/20 transition-all duration-200 text-gray-900 dark:text-white rounded-lg"
                          required
                          disabled={!signUpData.townshipId || subdivisionsLoading}
                        >
                          <option value="">Select Subdivision</option>
                          {subdivisions?.map((subdivision, index) => (
                            <option key={index} value={subdivision.subdivision}>
                              {subdivision.subdivision}
                            </option>
                          ))}
                        </select>
                      </div>
                      {!signUpData.townshipId && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Please select a township first</p>
                      )}
                      {subdivisionsLoading && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading subdivisions...</p>
                      )}
                    </div>

                    {/* City and Postal Code (Auto-filled) */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          City
                        </Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="text"
                            id="city"
                            value={signUpData.city}
                            readOnly
                            className="pl-10 h-12 bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-500 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Postal Code
                        </Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="text"
                            id="postalCode"
                            value={signUpData.postalCode}
                            readOnly
                            className="pl-10 h-12 bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-500 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {error && (
                  <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                    <AlertDescription className="text-red-600 dark:text-red-400 text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={isLoading || profileChecking}
                  className="w-full h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isSignUp ? "Creating Account..." : "Signing In..."}</span>
                    </div>
                  ) : profileChecking ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Checking Profile...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                      <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                    </div>
                  )}
                </Button>

                {/* Toggle between Sign In/Sign Up */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium text-sm transition-colors duration-200"
                  >
                    {isSignUp ? "Already have an account? " : "Don't have an account? "}
                    <span className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 font-semibold">
                      {isSignUp ? "Sign In" : "Sign Up"}
                    </span>
                  </button>
                </div>

                {/* Forgot Password Link */}
                {!isSignUp && (
                  <div className="text-center">
                    <Link 
                      href="/auth/forgot-password"
                      className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 font-medium text-sm transition-colors duration-200"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
