"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  IdCard,
  Loader2,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dateOfBirth: string;
  streetAddress: string;
  townshipId: string;
  subdivision: string;
  city: string;
  postalCode: string;
}

interface Township {
  id: string;
  name: string;
  city: string;
  postal_code: string;
}

export default function CollectorRegistration() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [townships, setTownships] = useState<Township[]>([]);
  const [subdivisions, setSubdivisions] = useState<string[]>([]);
  const [selectedTownship, setSelectedTownship] = useState<Township | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [employeeNumber, setEmployeeNumber] = useState<string>("");

  const [formData, setFormData] = useState<RegistrationData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    dateOfBirth: "",
    streetAddress: "",
    townshipId: "",
    subdivision: "",
    city: "Soweto", // Auto-filled like Main App
    postalCode: ""
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Load townships on component mount
  useEffect(() => {
    loadTownships();
  }, []);

  const loadTownships = async () => {
    try {
      const { data, error } = await supabase
        .from('address_townships')
        .select('id, township_name, city, postal_code')
        .order('township_name');

      if (error) {
        console.error('Error loading townships:', error);
      } else {
        const mapped: Township[] = (data || []).map((t: any) => ({
          id: t.id,
          name: t.township_name ?? t.name ?? '',
          city: t.city ?? '',
          postal_code: t.postal_code ?? ''
        }));
        setTownships(mapped);
      }
    } catch (error) {
      console.error('Error loading townships:', error);
    }
  };

  const handleTownshipChange = (townshipId: string) => {
    const township = townships.find(t => t.id === townshipId);
    setSelectedTownship(township || null);
    
    setFormData(prev => ({
      ...prev,
      townshipId,
      subdivision: "", // Reset subdivision when township changes
      city: township?.city || "",
      postalCode: township?.postal_code || ""
    }));

    // Load subdivisions for the selected township (only if townshipId is not empty)
    if (townshipId && townshipId.trim() !== "") {
      loadSubdivisions(townshipId);
    } else {
      setSubdivisions([]);
    }
  };

  const loadSubdivisions = async (townshipId: string) => {
    // Don't query if townshipId is empty or invalid
    if (!townshipId || townshipId.trim() === "") {
      setSubdivisions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('address_subdivisions')
        .select('subdivision')
        .eq('area_id', townshipId)
        .order('subdivision');

      if (error) {
        console.error('Error loading subdivisions:', error);
        setSubdivisions([]);
      } else {
        setSubdivisions((data || []).map((r: any) => r.subdivision));
      }
    } catch (error) {
      console.error('Error loading subdivisions:', error);
      setSubdivisions([]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.streetAddress.trim()) newErrors.streetAddress = "Street address is required";
    if (!formData.townshipId) newErrors.townshipId = "Township is required";
    if (!formData.subdivision.trim()) newErrors.subdivision = "Subdivision is required";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Phone validation (basic)
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }


    // Date of birth validation
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 18) {
        newErrors.dateOfBirth = "You must be at least 18 years old to register";
      }
      
      if (age > 100) {
        newErrors.dateOfBirth = "Please enter a valid date of birth";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateEmployeeNumber = async (): Promise<string> => {
    try {
      // Find the highest existing employee number with SNW-C prefix, then increment
      const { data, error } = await supabase
        .from('users')
        .select('employee_number')
        .ilike('employee_number', 'SNW-C%')
        .order('employee_number', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching last employee number:', error);
        return 'SNW-C0001';
      }

      const last = data && data.length > 0 ? data[0].employee_number as string : '';
      if (!last) return 'SNW-C0001';

      // Parse numeric portion and increment
      const match = last.match(/SNW-C(\d{4})/i);
      const lastNum = match ? parseInt(match[1], 10) : 0;
      const nextNum = lastNum + 1;
      return `SNW-C${nextNum.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating employee number:', error);
      return 'SNW-C0001';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Generate employee number
      const empNumber = await generateEmployeeNumber();
      setEmployeeNumber(empNumber);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
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
            postal_code: formData.postalCode,
            date_of_birth: formData.dateOfBirth,
            employee_number: empNumber
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Failed to create account');
      }

      // Create collector profile in users table
      // Get the collector role ID
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'collector')
        .single();

      if (roleError) {
        console.warn('Could not fetch collector role ID:', roleError);
      }

      // Create user profile in users table (matching Main App structure)
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          full_name: `${formData.firstName} ${formData.lastName}`,
          date_of_birth: formData.dateOfBirth || null,
          phone: formData.phone || null,
          role_id: roleData?.id || 'collector', // Use role ID or fallback to role name
          street_addr: formData.streetAddress || null,
          township_id: formData.townshipId || null,
          subdivision: formData.subdivision || null,
          city: formData.city,
          postal_code: formData.postalCode || null,
          status: 'pending_approval', // Requires admin approval
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Store additional collector-specific data in metadata
          employee_number: empNumber
        });

      if (profileError) {
        throw new Error(`Failed to create collector profile: ${profileError.message}`);
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (error: any) {
      console.error('Registration error:', error);
      setErrors({ submit: error.message || 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
            <p className="text-gray-300 mb-4">
              Your collector account has been created with employee number:
            </p>
            <div className="bg-orange-500 text-black font-bold text-xl p-3 rounded-lg mb-4">
              {employeeNumber}
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Your account is pending admin approval. You'll receive an email once approved.
            </p>
            <Button 
              onClick={() => router.push('/login')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/W yellow.png" 
              alt="WozaMali Logo" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Collector Registration</h1>
          <p className="text-gray-300">Join our team of recycling collectors</p>
        </div>

        {/* Registration Form */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <IdCard className="h-5 w-5 text-orange-500" />
              Personal Information
            </CardTitle>
            <CardDescription className="text-gray-400">
              All fields are required for collector registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-white">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-white">Last Name *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-white">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-white">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter your phone number"
                  />
                  {errors.phone && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth" className="text-white">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  {errors.dateOfBirth && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div className="border-t border-gray-600 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  Address Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="streetAddress" className="text-white">Street Address *</Label>
                    <Input
                      id="streetAddress"
                      type="text"
                      value={formData.streetAddress}
                      onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Enter your street address"
                    />
                    {errors.streetAddress && (
                      <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.streetAddress}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="townshipId" className="text-white">Township *</Label>
                      <select
                        id="townshipId"
                        value={formData.townshipId}
                        onChange={(e) => handleTownshipChange(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Select Township</option>
                        {townships.map((township) => (
                          <option key={township.id} value={township.id}>
                            {township.name}
                          </option>
                        ))}
                      </select>
                      {errors.townshipId && (
                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.townshipId}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="subdivision" className="text-white">Subdivision *</Label>
                      <select
                        id="subdivision"
                        value={formData.subdivision}
                        onChange={(e) => handleInputChange('subdivision', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        disabled={!selectedTownship}
                      >
                        <option value="">Select Subdivision</option>
                        {subdivisions.map((subdivision) => (
                          <option key={subdivision} value={subdivision}>
                            {subdivision}
                          </option>
                        ))}
                      </select>
                      {errors.subdivision && (
                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.subdivision}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city" className="text-white">City</Label>
                      <Input
                        id="city"
                        type="text"
                        value={formData.city}
                        readOnly
                        className="bg-gray-600 border-gray-500 text-gray-300"
                        placeholder="Auto-filled from township"
                      />
                    </div>

                    <div>
                      <Label htmlFor="postalCode" className="text-white">Postal Code</Label>
                      <Input
                        id="postalCode"
                        type="text"
                        value={formData.postalCode}
                        readOnly
                        className="bg-gray-600 border-gray-500 text-gray-300"
                        placeholder="Auto-filled from township"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="border-t border-gray-600 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Account Security</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password" className="text-white">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Create a password"
                    />
                    {errors.password && (
                      <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-white">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Confirm your password"
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.submit}
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Register as Collector'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/login')}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-orange-500 hover:text-orange-400">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
