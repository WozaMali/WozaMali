"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Building, Hash, Calendar, Loader2, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { AddressService, useTownships, useSubdivisions } from "@/lib/addressService";
import { getResidentRoleId } from "@/lib/roles";
import { UserInsert } from "@/lib/supabase";

const SignUp = () => {
  const navigate = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    streetAddress: "",
    townshipId: "",
    subdivision: "",
    city: "Soweto", // Auto-filled
    postalCode: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [envCheck, setEnvCheck] = useState<{supabaseUrl: string | null, supabaseKey: string | null}>({
    supabaseUrl: null,
    supabaseKey: null
  });

  // Address hooks
  const { townships, loading: townshipsLoading, error: townshipsError } = useTownships();
  const { subdivisions, loading: subdivisionsLoading, error: subdivisionsError } = useSubdivisions(formData.townshipId);

  // Check environment variables on component mount
  useEffect(() => {
    const checkEnv = () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      setEnvCheck({
        supabaseUrl: url || null,
        supabaseKey: key ? (key.length > 20 ? '***' + key.slice(-4) : '***') : null
      });

      // Log for debugging (remove in production)
      console.log('Environment check:', {
        hasUrl: !!url,
        hasKey: !!key,
        urlLength: url?.length,
        keyLength: key?.length
      });
    };

    checkEnv();
  }, []);

  // Get resident role ID for new users
  const [residentRoleId, setResidentRoleId] = useState<string | null>(null);

  // Get resident role ID on component mount
  useEffect(() => {
    const loadRole = async () => {
      const id = await getResidentRoleId();
      if (!id) {
        console.error('Resident role not found. Ensure a role named "resident" or "member" exists, or set NEXT_PUBLIC_RESIDENT_ROLE_ID.');
      }
      setResidentRoleId(id);
    };
    loadRole();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle township selection and auto-fill postal code and city
  const handleTownshipChange = async (townshipId: string) => {
    handleInputChange('townshipId', townshipId);
    handleInputChange('subdivision', ''); // Reset subdivision when township changes
    
    if (townshipId) {
      try {
        const { data, error } = await AddressService.getTownshipInfo(townshipId);
        if (error) {
          console.error('Error fetching township info:', error);
        } else if (data) {
          handleInputChange('postalCode', data.postal_code);
          handleInputChange('city', data.city);
        }
      } catch (error) {
        console.error('Error in handleTownshipChange:', error);
      }
    }
  };

  // Handle Google Sign Up
  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError(""); // Clear any existing errors
    
    try {
      console.log('Starting Google OAuth sign-up...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('Google sign up error:', error);
        setError(error.message || "Google sign-up failed. Please try again.");
        toast({
          title: "Google Sign Up Failed",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      } else {
        console.log('Google OAuth initiated successfully:', data);
        toast({
          title: "Redirecting to Google",
          description: "Please complete the Google sign-up process.",
        });
        // If successful, user will be redirected to Google OAuth
      }
    } catch (error: any) {
      console.error('Google sign up error:', error);
      setError(error.message || "An unexpected error occurred during Google sign-up.");
      toast({
        title: "Google Sign Up Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Check if environment variables are set
    if (!envCheck.supabaseUrl || !envCheck.supabaseKey) {
      toast({
        title: "Configuration Error",
        description: "Supabase configuration is missing. Please check your environment variables.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Validate required fields
      if (!residentRoleId) {
        toast({
          title: "Configuration Error",
          description: "Unable to determine user role. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // First, create the user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            street_address: formData.streetAddress,
            township_id: formData.townshipId,
            subdivision: formData.subdivision,
            city: formData.city,
            postal_code: formData.postalCode
          }
        }
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        setError(signUpError.message || "Please check your information and try again.");
        toast({
          title: "Sign up failed",
          description: signUpError.message || "Please check your information and try again.",
          variant: "destructive",
        });
        return;
      }

      if (authData.user) {
        // Create user record in unified schema
        try {
          const baseData: any = {
            id: authData.user.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`,
            date_of_birth: formData.dateOfBirth || null,
            phone: formData.phone || null,
            email: formData.email,
            street_addr: formData.streetAddress || null,
            township_id: formData.townshipId || null,
            subdivision: formData.subdivision || null,
            city: formData.city,
            postal_code: formData.postalCode || null,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Single insert path (faster): prefer UUID if available else role name fallback
          const roleAssignment = residentRoleId
            ? { role_id: residentRoleId }
            : { role_id: 'resident' };

          const { error: createErr } = await supabase
            .from('users')
            .insert({ ...baseData, ...roleAssignment });

          if (createErr) {
            console.error('User creation error:', createErr);
            toast({
              title: "Profile creation failed",
              description: "Account created but profile setup failed. Please contact support.",
              variant: "destructive",
            });
            return;
          }
        } catch (userCreationError) {
          console.error('User creation error:', userCreationError);
          toast({
            title: "Profile creation failed",
            description: "Account created but profile setup failed. Please contact support.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        navigate.push("/auth/sign-in");
      } else {
        toast({
          title: "Sign up failed",
          description: "User account could not be created. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message || "An unexpected error occurred. Please try again.");
      toast({
        title: "Sign up failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show environment warning if needed
  if (!envCheck.supabaseUrl || !envCheck.supabaseKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-orange-600 relative overflow-hidden">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center text-white bg-red-600 p-8 rounded-lg max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Configuration Error</h2>
            <p className="mb-4">Supabase environment variables are not properly configured.</p>
            <div className="text-left text-sm bg-black p-4 rounded">
              <p><strong>SUPABASE_URL:</strong> {envCheck.supabaseUrl ? '✅ Set' : '❌ Missing'}</p>
              <p><strong>SUPABASE_KEY:</strong> {envCheck.supabaseKey ? '✅ Set' : '❌ Missing'}</p>
            </div>
            <p className="mt-4 text-sm">Please check your .env.local file and restart the development server.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Theme follows browser preference automatically */}

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 dark:from-orange-500 dark:via-orange-600 dark:to-orange-700">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        </div>
        
        <div className="relative px-6 py-16 sm:py-24">
          <div className="text-center text-white">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-6 bg-white/10 backdrop-blur-sm rounded-full">
              <Image
                src="/WozaMali-uploads/w white.png"
                alt="Woza Mali Logo"
                width={64}
                height={64}
                className="drop-shadow-lg"
              />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 drop-shadow-lg">
              Join Woza Mali
            </h1>
            <p className="text-white/90 text-lg mb-2">Powered by Sebenza Nathi Waste</p>
            <p className="text-white/80 text-sm">
              Create your account and start your recycling journey
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-8 px-6 pb-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Create Your Account
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Fill in your details to get started with Woza Mali
                </p>
              </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-orange-400/20 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
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
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-orange-400/20 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
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
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-orange-400/20 transition-all duration-200 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-orange-400/20 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                placeholder="Enter your email"
                required
              />
                  </div>
            </div>

                {/* Password Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                type={showPassword ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                        className="pl-10 pr-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-orange-400/20 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        placeholder="Password"
                required
              />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
            </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="pl-10 pr-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-orange-400/20 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        placeholder="Confirm password"
                required
              />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
            </div>

                {/* Address Information */}
                <div className="space-y-2">
                  <Label htmlFor="streetAddress" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Street Address
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      id="streetAddress"
                      placeholder="House Number and Street Name (e.g., 652 Hashe Street)"
                      value={formData.streetAddress}
                      onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                      className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-orange-400/20 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
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
                      value={formData.townshipId} 
                      onChange={(e) => handleTownshipChange(e.target.value)}
                      className="w-full pl-10 pr-4 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-orange-400/20 transition-all duration-200 text-gray-900 dark:text-white rounded-lg"
                      required
                      disabled={townshipsLoading}
                    >
                      <option value="">
                        {townshipsLoading ? 'Loading townships...' : 'Select Township'}
                      </option>
                      {townships.map((township) => (
                        <option key={township.id} value={township.id}>
                          {township.township_name}
                        </option>
                      ))}
                    </select>
                  </div>
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
                      value={formData.subdivision} 
                      onChange={(e) => handleInputChange('subdivision', e.target.value)}
                      className="w-full pl-10 pr-4 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-orange-400/20 transition-all duration-200 text-gray-900 dark:text-white rounded-lg"
                      required
                      disabled={!formData.townshipId || subdivisionsLoading}
                    >
                      <option value="">
                        {!formData.townshipId 
                          ? 'Select Township first' 
                          : subdivisionsLoading 
                            ? 'Loading subdivisions...' 
                            : 'Select Subdivision'
                        }
                      </option>
                      {subdivisions.map((subdivision) => (
                        <option key={subdivision.subdivision} value={subdivision.subdivision}>
                          {subdivision.subdivision}
                        </option>
                      ))}
                    </select>
                  </div>
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
                        value={formData.city}
                        readOnly
                        className="pl-10 h-12 bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-500 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        placeholder="Soweto (Auto-filled)"
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
                        value={formData.postalCode}
                        readOnly
                        className="pl-10 h-12 bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-500 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        placeholder="Postal Code (Auto-filled)"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                    <AlertDescription className="text-red-600 dark:text-red-400 text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Google Sign Up Button */}
                <div className="mb-6">
                  <Button
                    type="button"
                    onClick={handleGoogleSignUp}
                    disabled={googleLoading}
                    className="w-full h-12 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center space-x-3"
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
                    <span className="bg-white dark:bg-gray-800 px-3 text-gray-500 dark:text-gray-400 font-medium">or sign up with email</span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <UserPlus className="h-4 w-4" />
                      <span>Create Account</span>
                    </div>
                  )}
                </Button>

                {/* Sign In Link */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{" "}
                    <Link
                      href="/auth/sign-in"
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold hover:underline transition-colors duration-200"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
