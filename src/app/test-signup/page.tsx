"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Building, Hash, MapPin } from "lucide-react";
import { AddressService, useTownships, useSubdivisions } from "@/lib/addressService";

export default function TestSignUp() {
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
    city: "Soweto",
    postalCode: ""
  });

  // Address hooks
  const { townships, loading: townshipsLoading, error: townshipsError } = useTownships();
  const { subdivisions, loading: subdivisionsLoading, error: subdivisionsError } = useSubdivisions(formData.townshipId);

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

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Sign-Up Page</h1>
        
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">Database Connection Status:</h2>
          <p><strong>Townships Loading:</strong> {townshipsLoading ? 'Yes' : 'No'}</p>
          <p><strong>Townships Error:</strong> {townshipsError ? townshipsError.message : 'None'}</p>
          <p><strong>Townships Count:</strong> {townships.length}</p>
          <p><strong>Subdivisions Loading:</strong> {subdivisionsLoading ? 'Yes' : 'No'}</p>
          <p><strong>Subdivisions Error:</strong> {subdivisionsError ? subdivisionsError.message : 'None'}</p>
          <p><strong>Subdivisions Count:</strong> {subdivisions.length}</p>
        </div>

        <form className="space-y-6">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="pl-10 h-10 text-center text-sm font-medium"
              />
            </div>
          </div>

          {/* Township Dropdown */}
          <div className="space-y-2">
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
              <select 
                value={formData.townshipId} 
                onChange={(e) => handleTownshipChange(e.target.value)}
                className="w-full pl-10 h-10 text-center text-sm font-medium border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
              <select 
                value={formData.subdivision} 
                onChange={(e) => handleInputChange('subdivision', e.target.value)}
                className="w-full pl-10 h-10 text-center text-sm font-medium border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full pl-10 h-10 text-center text-sm font-medium bg-gray-100 border border-gray-300 text-gray-600 rounded-md cursor-not-allowed"
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
                className="w-full pl-10 h-10 text-center text-sm font-medium bg-gray-100 border border-gray-300 text-gray-600 rounded-md cursor-not-allowed"
                placeholder="Postal Code (Auto-filled)"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Test Sign Up
          </Button>
        </form>
      </div>
    </div>
  );
}
