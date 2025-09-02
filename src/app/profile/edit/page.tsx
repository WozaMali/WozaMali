"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, User, Phone, MapPin, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const EditPersonalDetails = () => {
  const navigate = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Try to use auth context, but handle the case where it might not be ready
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    // AuthProvider not ready yet, show loading
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const { user, updateProfile } = authContext;

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    streetAddress: "",
    suburb: "",
    city: "",
    postalCode: ""
  });

  useEffect(() => {
    setMounted(true);
    
    // Populate form with existing user data from unified address system
    const populateForm = async () => {
      if (!user?.id) return;
      
      try {
        // Fetch user's primary address from user_addresses table
        const { data: addressData, error: addressError } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', user.id)
          .eq('address_type', 'primary')
          .eq('is_default', true)
          .eq('is_active', true)
          .single();

        // Fetch user profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setFormData({
          fullName: profileData?.full_name || user.user_metadata?.full_name || "",
          phone: profileData?.phone || user.user_metadata?.phone || "",
          streetAddress: addressData?.address_line1 || user.user_metadata?.street_address || "",
          suburb: addressData?.address_line2 || user.user_metadata?.suburb || "",
          city: addressData?.city || user.user_metadata?.city || "",
          postalCode: addressData?.postal_code || user.user_metadata?.postal_code || ""
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to user metadata
        setFormData({
          fullName: user.user_metadata?.full_name || "",
          phone: user.user_metadata?.phone || "",
          streetAddress: user.user_metadata?.street_address || "",
          suburb: user.user_metadata?.suburb || "",
          city: user.user_metadata?.city || "",
          postalCode: user.user_metadata?.postal_code || ""
        });
      }
    };

    populateForm();
  }, [user]);

  if (!mounted) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting profile update for user:', user?.id);
      
      if (!user?.id) throw new Error('User not found');

      // Update profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      console.log('Profile table updated successfully');

      // Update or create primary address in user_addresses table
      const { data: existingAddress, error: fetchError } = await supabase
        .from('user_addresses')
        .select('id')
        .eq('user_id', user.id)
        .eq('address_type', 'primary')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing address:', fetchError);
        throw fetchError;
      }

      const addressData = {
        user_id: user.id,
        address_type: 'primary',
        address_line1: formData.streetAddress,
        address_line2: formData.suburb,
        city: formData.city,
        province: 'Western Cape', // Default province
        postal_code: formData.postalCode,
        country: 'South Africa',
        is_default: true,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      if (existingAddress) {
        // Update existing address
        const { error: updateAddressError } = await supabase
          .from('user_addresses')
          .update(addressData)
          .eq('id', existingAddress.id);

        if (updateAddressError) {
          console.error('Address update error:', updateAddressError);
          throw updateAddressError;
        }
        console.log('Address updated successfully');
      } else {
        // Create new address
        const { error: insertAddressError } = await supabase
          .from('user_addresses')
          .insert({
            ...addressData,
            created_at: new Date().toISOString()
          });

        if (insertAddressError) {
          console.error('Address insert error:', insertAddressError);
          throw insertAddressError;
        }
        console.log('Address created successfully');
      }

      // Also update user metadata for backward compatibility
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
          street_address: formData.streetAddress,
          suburb: formData.suburb,
          city: formData.city,
          postal_code: formData.postalCode
        }
      });

      if (updateError) {
        console.error('User metadata update error:', updateError);
        // Don't throw here as the main data was saved successfully
      } else {
        console.log('User metadata updated successfully');
      }

      toast({
        title: "Profile Updated",
        description: "Your personal details have been updated successfully.",
      });

      // Navigate back to profile
      navigate.push('/profile');
      
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate.push('/profile');
  };

  return (
    <div className="min-h-screen bg-gradient-warm pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center p-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleCancel}
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Edit Personal Details</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                  id="streetAddress"
                  type="text"
                  value={formData.streetAddress}
                  onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                  placeholder="Enter your street address"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="suburb">Suburb</Label>
                  <Input
                    id="suburb"
                    type="text"
                    value={formData.suburb}
                    onChange={(e) => handleInputChange('suburb', e.target.value)}
                    placeholder="Enter suburb"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="Enter postal code"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPersonalDetails;
