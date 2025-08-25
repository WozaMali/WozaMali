"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Phone, MapPin, Building, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/lib/supabase";

interface FormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  suburb: string;
  city: string;
  postalCode: string;
}

export default function CompleteProfile() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    suburb: '',
    city: '',
    postalCode: ''
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/sign-in');
      return;
    }

    const populateForm = async () => {
      try {
        // First try to get data from existing profile
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('full_name, phone, street_address, suburb, city, postal_code')
          .eq('id', user.id)
          .single();

        if (existingProfile?.full_name) {
          const nameParts = existingProfile.full_name.split(' ');
          setFormData(prev => ({
            ...prev,
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(' ') || "",
            phoneNumber: existingProfile.phone || "",
            address: existingProfile.street_address || "",
            suburb: existingProfile.suburb || "",
            city: existingProfile.city || "",
            postalCode: existingProfile.postal_code || ""
          }));
        } else if (user.user_metadata?.full_name || user.user_metadata?.name) {
          // Fallback to user metadata
          const fullName = user.user_metadata.full_name || user.user_metadata.name || '';
          const nameParts = fullName.split(' ');
          setFormData(prev => ({
            ...prev,
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(' ') || "",
            phoneNumber: user.user_metadata.phone || "",
            address: user.user_metadata.street_address || "",
            suburb: user.user_metadata.suburb || "",
            city: user.user_metadata.city || "",
            postalCode: user.user_metadata.postal_code || ""
          }));
        }
      } catch (error) {
        console.log('No existing profile found, starting with empty form');
      }
    };

    populateForm();
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    
    try {
      console.log('Starting profile update for user:', user.id);
      console.log('Form data to submit:', formData);
      
      // Step 1: Save profile to database FIRST (this is most important)
      console.log('Saving profile to database...');
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phoneNumber,
          street_address: formData.address,
          suburb: formData.suburb,
          city: formData.city,
          postal_code: formData.postalCode,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (upsertError) {
        console.error('Profile upsert error:', upsertError);
        toast.error('Failed to save profile. Please try again.');
        return;
      }
      
      console.log('Profile saved to database successfully!');
      
      // Step 2: Try to update metadata in background (don't wait for it)
      console.log('Attempting metadata update in background...');
      supabase.auth.updateUser({
        data: {
          full_name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phoneNumber,
          street_address: formData.address,
          suburb: formData.suburb,
          city: formData.city,
          postal_code: formData.postalCode
        }
      }).then(({ error }) => {
        if (error) {
          console.warn('Background metadata update failed:', error);
        } else {
          console.log('Background metadata update succeeded');
        }
      }).catch((error) => {
        console.warn('Background metadata update error:', error);
      });
      
      // Step 3: Show success and redirect immediately
      console.log('Profile completion successful, redirecting...');
      toast.success('Profile completed successfully!');
      
      // Redirect immediately - no waiting
      router.push('/');
      
    } catch (error: any) {
      console.error('Error completing profile:', error);
      toast.error('Failed to complete profile. Please try again.');
    } finally {
      console.log('Setting loading to false');
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Please provide your information to get started</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                    required
                    className="bg-gray-700 text-white placeholder:text-gray-300 border-gray-600 focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                    required
                    className="bg-gray-700 text-white placeholder:text-gray-300 border-gray-600 focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter your phone number"
                  required
                  className="bg-gray-700 text-white placeholder:text-gray-300 border-gray-600 focus:border-gray-500 focus:ring-gray-500"
                />
              </div>

              {/* Address Fields */}
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Street Address
                </Label>
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your street address"
                  required
                  className="bg-gray-700 text-white placeholder:text-gray-300 border-gray-600 focus:border-gray-500 focus:ring-gray-500"
                />
              </div>

              {/* Suburb */}
              <div className="space-y-2">
                <Label htmlFor="suburb" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Suburb
                </Label>
                <Input
                  id="suburb"
                  type="text"
                  value={formData.suburb}
                  onChange={(e) => handleInputChange('suburb', e.target.value)}
                  placeholder="Enter your suburb"
                  required
                  className="bg-gray-700 text-white placeholder:text-gray-300 border-gray-600 focus:border-gray-500 focus:ring-gray-500"
                />
              </div>

              {/* City and Postal Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    City
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Enter your city"
                    required
                    className="bg-gray-700 text-white placeholder:text-gray-300 border-gray-600 focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Postal Code
                  </Label>
                  <Input
                    id="postalCode"
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="Enter your postal code"
                    required
                    className="bg-gray-700 text-white placeholder:text-gray-300 border-gray-600 focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Completing Profile...
                  </div>
                ) : (
                  'Complete Profile'
                )}
              </Button>
              
              {/* Loading Status */}
              {isLoading && (
                <div className="text-center text-sm text-gray-600">
                  <p>Please wait while we save your profile...</p>
                  <p className="text-xs mt-1">This may take a few seconds</p>
                </div>
              )}
              
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
