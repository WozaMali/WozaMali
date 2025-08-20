"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Building, Hash } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Township, City } from "@/types/location";
import { locationService } from "@/lib/locationService";

const SignUp = () => {
  const navigate = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    streetAddress: "",
    township: "",
    city: "",
    postalCode: ""
  });
  
  // Location data from database
  const [townships, setTownships] = useState<Township[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch location data from Supabase
  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        setDataLoading(true);
        
        // Use location service for better performance and caching
        const [townshipsResult, citiesResult] = await Promise.all([
          locationService.getTownships(),
          locationService.getCities(),
        ]);
        
        if (townshipsResult.error) throw new Error(townshipsResult.error);
        if (citiesResult.error) throw new Error(citiesResult.error);
        
        // Type assertion to ensure correct types
        setTownships((townshipsResult.data as Township[]) || []);
        setCities((citiesResult.data as City[]) || []);
        
      } catch (error: any) {
        console.error('Error fetching location data:', error);
        toast({
          title: "Data loading failed",
          description: error.message || "Location data could not be loaded. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setDataLoading(false);
      }
    };

    fetchLocationData();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle township selection and auto-fill postal code
  const handleTownshipChange = (townshipName: string) => {
    const selectedTownship = townships.find(t => t.name === townshipName);
    
    handleInputChange('township', townshipName);
    if (selectedTownship) {
      handleInputChange('postalCode', selectedTownship.postal_code);
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

    setLoading(true);

    try {
      // First, create the user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            street_address: formData.streetAddress,
            township: formData.township,
            city: formData.city,
            postal_code: formData.postalCode
          }
        }
      });

      if (signUpError) {
        toast({
          title: "Sign up failed",
          description: signUpError.message || "Please check your information and try again.",
          variant: "destructive",
        });
        return;
      }

      if (authData.user) {
        // Try to update the profiles table with additional data
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              full_name: formData.fullName,
              phone: formData.phone,
              street_address: formData.streetAddress,
              township: formData.township,
              city: formData.city,
              postal_code: formData.postalCode,
              updated_at: new Date().toISOString()
            })
            .eq('id', authData.user.id);

          if (profileError) {
            console.warn('Profile update warning:', profileError.message);
            // Don't fail the signup if profile update fails - the trigger should handle it
          }
        } catch (profileUpdateError) {
          console.warn('Profile update error:', profileUpdateError);
          // Don't fail the signup if profile update fails
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
      toast({
        title: "Sign up failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while fetching data
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-orange-600 relative overflow-hidden">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Loading location data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-orange-600 relative overflow-hidden">
      {/* Top Section - centered logo in dark background */}
      <div className="flex items-center justify-center h-[40vh]">
        {/* Logo - White W logo */}
        <div className="w-40 h-40">
          <Image
            src="/WozaMali-uploads/w white.png"
            alt="Woza Mali Logo"
            width={320}
            height={320}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* White section - now directly connected to the gradient */}
      <div className="bg-white flex-1 flex flex-col items-center justify-start pt-16 pb-8 px-6 min-h-[60vh] shadow-[0_-10px_30px_rgba(234,179,8,0.3)]">
        {/* Sign up text */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold mb-2 text-gray-600">
            Create your Woza Mali account
          </h2>
          <p className="text-sm text-gray-600">
            Fill in your details to get started
          </p>
        </div>

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          {/* Personal Information */}
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="pl-10 h-10 text-center text-sm font-medium bg-white border-2 border-gray-600 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all duration-200 placeholder:text-gray-400 text-gray-600 [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-600 [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset] [&:-webkit-autofill]:border-gray-600 [&:-webkit-autofill]:-webkit-text-fill-color-gray-600"
                style={{
                  WebkitTextFillColor: 'rgb(75, 85, 99)',
                  color: 'rgb(75, 85, 99)'
                }}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="pl-10 h-10 text-center text-sm font-medium bg-white border-2 border-gray-600 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all duration-200 placeholder:text-gray-400 text-gray-600 [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-600 [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset] [&:-webkit-autofill]:border-gray-600 [&:-webkit-autofill]:-webkit-text-fill-color-gray-600"
                style={{
                  WebkitTextFillColor: 'rgb(75, 85, 99)',
                  color: 'rgb(75, 85, 99)'
                }}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="pl-10 h-10 text-center text-sm font-medium bg-white border-2 border-gray-600 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all duration-200 placeholder:text-gray-400 text-gray-600 [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-600 [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset] [&:-webkit-autofill]:border-gray-600 [&:-webkit-autofill]:-webkit-text-fill-color-gray-600"
                style={{
                  WebkitTextFillColor: 'rgb(75, 85, 99)',
                  color: 'rgb(75, 85, 99)'
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="pl-10 pr-10 h-10 text-center text-sm font-medium bg-white border-2 border-gray-600 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all duration-200 placeholder:text-gray-400 text-gray-600 [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-600 [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset] [&:-webkit-autofill]:border-gray-600 [&:-webkit-autofill]:-webkit-text-fill-color-gray-600"
                style={{
                  WebkitTextFillColor: 'rgb(75, 85, 99)',
                  color: 'rgb(75, 85, 99)'
                }}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-10 px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="pl-10 pr-10 h-10 text-center text-sm font-medium bg-white border-2 border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all duration-200 placeholder:text-gray-400 text-gray-600 [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-600 [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset] [&:-webkit-autofill]:border-gray-600 [&:-webkit-autofill]:-webkit-text-fill-color-gray-600"
                style={{
                  WebkitTextFillColor: 'rgb(75, 85, 99)',
                  color: 'rgb(75, 85, 99)'
                }}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-10 px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
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
                className="pl-10 h-10 text-center text-sm font-medium bg-white border-2 border-gray-600 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all duration-200 placeholder:text-gray-400 text-gray-600 [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-600 [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset] [&:-webkit-autofill]:border-gray-600 [&:-webkit-autofill]:-webkit-text-fill-color-gray-600"
                style={{
                  WebkitTextFillColor: 'rgb(75, 85, 99)',
                  color: 'rgb(75, 85, 99)'
                }}
              />
            </div>
          </div>

          {/* Township Dropdown - Now using database data */}
          <div className="space-y-2">
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
              <Select value={formData.township} onValueChange={handleTownshipChange}>
                <SelectTrigger className="pl-10 h-10 text-center text-sm font-medium bg-white border-2 border-gray-600 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all duration-200 text-gray-600">
                  <SelectValue placeholder="Select Township" />
                </SelectTrigger>
                <SelectContent>
                  {townships.map((township) => (
                    <SelectItem key={township.id} value={township.name}>
                      {township.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* City Dropdown - Now using database data */}
          <div className="space-y-2">
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
              <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                <SelectTrigger className="pl-10 h-10 text-center text-sm font-medium bg-white border-2 border-gray-600 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all duration-200 text-gray-600">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Postal Code"
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                className="pl-10 h-10 text-center text-sm font-medium bg-white border-2 border-gray-600 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all duration-200 placeholder:text-gray-400 text-gray-600 [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-600 [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset] [&:-webkit-autofill]:border-gray-600 [&:-webkit-autofill]:-webkit-text-fill-color-gray-600"
                style={{
                  WebkitTextFillColor: 'rgb(75, 85, 99)',
                  color: 'rgb(75, 85, 99)'
                }}
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white text-base font-bold rounded-lg shadow-xl transition-all duration-200 transform hover:scale-105 border-0"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
              ) : (
                "Create Account"
              )}
            </Button>
          </div>
        </form>

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
      </div>
    </div>
  );
};

export default SignUp;
