"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Building, Hash, Calendar, User, Phone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { AddressService, useTownships, useSubdivisions } from "@/lib/addressService";
import { getResidentRoleId } from "@/lib/roles";
import { UserUpdate } from "@/lib/supabase";

const ProfileComplete = () => {
  const navigate = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phone: "",
    streetAddress: "",
    townshipId: "",
    subdivision: "",
    city: "Soweto", // Auto-filled
    postalCode: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [residentRoleId, setResidentRoleId] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Address hooks
  const { townships, loading: townshipsLoading, error: townshipsError } = useTownships();
  const { subdivisions, loading: subdivisionsLoading, error: subdivisionsError } = useSubdivisions(formData.townshipId);

  // Get current user and resident role ID
  useEffect(() => {
    const getUserAndRole = async () => {
      try {
        console.log('ProfileComplete: Getting user...');
        
        // Wait for OAuth session to be fully established
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get current user with more aggressive retry logic
        let user = null;
        let userError = null;
        
        for (let attempt = 0; attempt < 10; attempt++) {
          try {
            const { data: { user: currentUser }, error: currentError } = await supabase.auth.getUser();
            if (currentUser && !currentError) {
              console.log(`ProfileComplete: User found on attempt ${attempt + 1}:`, currentUser.id);
              user = currentUser;
              userError = null;
              break;
            }
            userError = currentError;
            console.log(`ProfileComplete: Attempt ${attempt + 1} failed, retrying in 1 second...`, currentError?.message);
          } catch (error) {
            console.log(`ProfileComplete: Attempt ${attempt + 1} threw error:`, error);
            userError = error;
          }
          
          if (attempt < 9) { // Don't wait after the last attempt
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (userError || !user) {
          console.error('ProfileComplete: Error getting user after retries:', userError);
          
          // Try one more time with getSession as fallback
          console.log('ProfileComplete: Trying getSession as fallback...');
          try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (session?.user && !sessionError) {
              console.log('ProfileComplete: Found user via session fallback:', session.user.id);
              user = session.user;
            } else {
              console.error('ProfileComplete: Session fallback also failed:', sessionError || 'No session found');
              setError('No active session found. Please sign in to complete your profile.');
              setUserLoading(false);
              // Redirect to sign-in after a short delay
              setTimeout(() => {
                router.push('/auth/sign-in');
              }, 3000);
              return;
            }
          } catch (sessionError) {
            console.error('ProfileComplete: Session fallback threw error:', sessionError);
            setError('No active session found. Please sign in to complete your profile.');
            setUserLoading(false);
            // Redirect to sign-in after a short delay
            setTimeout(() => {
              router.push('/auth/sign-in');
            }, 3000);
            return;
          }
        }
        
        console.log('ProfileComplete: User found:', user.id);
        setUser(user);

        const id = await getResidentRoleId();
        if (!id) {
          console.error('Resident role not found. Ensure a role named "resident" or "member" exists, or set NEXT_PUBLIC_RESIDENT_ROLE_ID.');
        }
        setResidentRoleId(id);
      } catch (error) {
        console.error('ProfileComplete: Error in getUserAndRole:', error);
        setError('An error occurred while loading your profile. Please try again.');
      } finally {
        setUserLoading(false);
      }
    };

    getUserAndRole();
  }, [navigate]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !residentRoleId) {
      toast({
        title: "Error",
        description: "User information not available. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if user already exists in unified schema
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
      
      // If there's an error checking for existing user, log it but continue
      if (userCheckError) {
        console.log('Error checking for existing user:', userCheckError);
      }

      const baseData = {
        id: user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: user.email || '',
        date_of_birth: formData.dateOfBirth || null,
        phone: formData.phone || null,
        street_addr: formData.streetAddress || null,
        township_id: formData.townshipId || null,
        subdivision: formData.subdivision || null,
        city: formData.city,
        postal_code: formData.postalCode || null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any;

      // Use the resident role ID (which should be a UUID)
      const roleAssignment = { role_id: residentRoleId };

      let lastError: any = null;
      let success = false;

      if (existingUser) {
        const { error } = await supabase
          .from('users')
          .update({ ...baseData, ...roleAssignment })
          .eq('id', user.id);
        if (!error) { 
          success = true; 
          console.log('User profile updated successfully');
        } else {
          lastError = error;
          console.log('Error updating user profile:', error);
        }
      } else {
        const { error } = await supabase
          .from('users')
          .insert({ ...baseData, ...roleAssignment });
        if (!error) { 
          success = true; 
          console.log('User profile created successfully');
        } else {
          lastError = error;
          console.log('Error creating user profile:', error);
        }
      }

      if (!success) {
        console.error('User update error:', lastError);
        toast({
          title: "Profile update failed",
          description: "Please try again or contact support.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Profile completed!",
        description: "Welcome to WozaMali!",
      });
      navigate.push("/");
    } catch (error: any) {
      console.error('Profile completion error:', error);
      setError(error.message || "An unexpected error occurred. Please try again.");
      toast({
        title: "Profile completion failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-orange-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verifying your authentication...</p>
          <p className="text-sm text-white/80 mt-2">Please wait while we set up your profile</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-orange-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-red-200 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-4">Authentication Error</h2>
          <p className="mb-4">{error || 'Unable to verify your authentication.'}</p>
          <button 
            onClick={() => window.location.href = '/auth/sign-in'}
            className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Orange Horizontal Bar at Top */}
      <div className="h-48 bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 flex items-center justify-center relative">
        <div className="text-center text-white">
          <div className="inline-flex items-center justify-center w-32 h-32 mb-4">
            <Image
              src="/WozaMali-uploads/w white.png"
              alt="Woza Mali Logo"
              width={80}
              height={80}
              className="drop-shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
            Complete Your Profile
          </h1>
          <p className="text-white/90 text-sm mb-3">
            Welcome to WozaMali!
          </p>
          <p className="text-white/80 text-xs">
            Please complete your profile to continue
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
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200 text-white placeholder:text-gray-300"
                  placeholder="Enter your phone number"
                />
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

            {/* Complete Profile Button */}
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Completing Profile..." : "Complete Profile"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileComplete;
