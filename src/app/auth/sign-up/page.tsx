"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Building, Hash, Calendar } from "lucide-react";
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
    <div className="min-h-screen bg-white">
      {/* Orange Horizontal Bar at Top - 50% Bigger */}
      <div className="h-48 bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 flex items-center justify-center relative">
        <div className="text-center text-white">
          <div className="inline-flex items-center justify-center w-32 h-32 mb-0">
            <Image
              src="/WozaMali-uploads/w white.png"
              alt="Woza Mali Logo"
              width={80}
              height={80}
              className="drop-shadow-lg"
            />
          </div>
          <div className="text-center mt-0">
            <p className="text-white/90 text-xs mb-0.5">Powered by</p>
            <p className="text-white/95 text-lg font-bold">Sebenza Nathi Waste</p>
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2 mt-1">
            Create Account
          </h1>
          <p className="text-white/90 text-sm mb-2">
            Join Woza Mali today
          </p>
        </div>
      </div>

      {/* White Content Section */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200 text-white placeholder:text-gray-300"
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200 text-white placeholder:text-gray-300"
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  id="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200 text-white placeholder:text-gray-300"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200 text-white placeholder:text-gray-300"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200 text-white placeholder:text-gray-300"
                placeholder="Enter your password"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200 text-white placeholder:text-gray-300"
                placeholder="Confirm your password"
                required
              />
            </div>

            {/* Address Information */}
            <div className="space-y-2">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="House Number and Street Name (e.g., 652 Hashe Street)"
                  value={formData.streetAddress}
                  onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                  className="pl-10 h-10 text-center text-sm font-medium bg-gray-700 border-2 border-gray-600 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all duration-200 placeholder:text-gray-300 text-white"
                  style={{
                    WebkitTextFillColor: 'white',
                    color: 'white'
                  }}
                />
              </div>
            </div>

            {/* Township Dropdown - Using live data */}
            <div className="space-y-2">
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                <select 
                  value={formData.townshipId} 
                  onChange={(e) => handleTownshipChange(e.target.value)}
                  className="w-full pl-10 h-10 text-center text-sm font-medium bg-gray-700 border-2 border-gray-600 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all duration-200 text-white rounded-md"
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

            {/* Subdivision Dropdown - Dynamic based on township */}
            <div className="space-y-2">
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                <select 
                  value={formData.subdivision} 
                  onChange={(e) => handleInputChange('subdivision', e.target.value)}
                  className="w-full pl-10 h-10 text-center text-sm font-medium bg-gray-700 border-2 border-gray-600 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all duration-200 text-white rounded-md"
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

            {/* City - Auto-filled */}
            <div className="space-y-2">
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                <input
                  type="text"
                  value={formData.city}
                  readOnly
                  className="w-full pl-10 h-10 text-center text-sm font-medium bg-gray-600 border-2 border-gray-500 text-gray-300 rounded-md cursor-not-allowed"
                  placeholder="Soweto (Auto-filled)"
                />
              </div>
            </div>

            {/* Postal Code - Auto-filled */}
            <div className="space-y-2">
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.postalCode}
                  readOnly
                  className="w-full pl-10 h-10 text-center text-sm font-medium bg-gray-600 border-2 border-gray-500 text-gray-300 rounded-md cursor-not-allowed"
                  placeholder="Postal Code (Auto-filled)"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Google Sign Up Button */}
            <div className="w-full mb-6">
              <Button
                type="button"
                onClick={handleGoogleSignUp}
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
            <div className="w-full mb-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or sign up with email</span>
                </div>
              </div>
            </div>

            {/* Sign Up Form */}
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Account"}
            </Button>

            {/* Links */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/auth/sign-in"
                  className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
