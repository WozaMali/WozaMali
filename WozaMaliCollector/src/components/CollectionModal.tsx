'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Plus, 
  Trash2, 
  Package, 
  Scale, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../hooks/use-auth';
import { DashboardService } from '../lib/dashboard-service';
import { OfficeIntegrationService } from '../lib/office-integration-service';

interface Material {
  id: string;
  name: string;
  rate_per_kg?: number;
  unit_price?: number;
  current_rate?: number;
  price_per_unit?: number;
  is_active: boolean;
  category?: string;
  unit?: string;
  description?: string;
}

interface CollectionMaterial {
  materialName: string;
  kilograms: number;
  unitPrice: number;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  street_addr?: string;
  subdivision?: string;
  city?: string;
  postal_code?: string;
  township_id?: string;
}

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess?: () => void;
}

export default function CollectionModal({ isOpen, onClose, user, onSuccess }: CollectionModalProps) {
  const { user: collector } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  
  const [collectionMaterials, setCollectionMaterials] = useState<CollectionMaterial[]>([
    { materialName: '', kilograms: 0, unitPrice: 0 }
  ]);

  // Load materials when modal opens
  useEffect(() => {
    if (isOpen) {
      loadMaterials();
      setError(null);
      setSuccess(null);
      setCollectionMaterials([{ materialName: '', kilograms: 0, unitPrice: 0 }]);
    }
  }, [isOpen]);

  const loadMaterials = async (retryAttempt: number = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Loading materials... (attempt ${retryAttempt + 1})`);
      
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Error loading materials:', error);
        throw error;
      }
      
      console.log('📦 Loaded materials:', data);
      setMaterials(data || []);
      setRetryCount(0); // Reset retry count on success
    } catch (error: any) {
      console.error('❌ Error loading materials:', error);
      
      // Check if it's a network error and we haven't exceeded retry limit
      if (retryAttempt < 2 && (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION_CLOSED'))) {
        console.log(`🔄 Retrying in 2 seconds... (attempt ${retryAttempt + 1}/3)`);
        setRetryCount(retryAttempt + 1);
        setTimeout(() => {
          loadMaterials(retryAttempt + 1);
        }, 2000);
        return;
      }
      
      setError('Network error. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const retryLoadMaterials = () => {
    setRetryCount(0);
    loadMaterials(0);
  };

  const addMaterial = () => {
    setCollectionMaterials([...collectionMaterials, { materialName: '', kilograms: 0, unitPrice: 0 }]);
  };

  const removeMaterial = (index: number) => {
    if (collectionMaterials.length > 1) {
      setCollectionMaterials(collectionMaterials.filter((_, i) => i !== index));
    }
  };

  const updateMaterial = (index: number, field: keyof CollectionMaterial, value: string | number) => {
    const updated = [...collectionMaterials];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill unit price when material is selected
    if (field === 'materialName' && typeof value === 'string') {
      const selectedMaterial = materials.find(m => m.name === value);
      if (selectedMaterial) {
        // Try different possible field names for the rate
        const rate = selectedMaterial.rate_per_kg || 
                    selectedMaterial.unit_price || 
                    selectedMaterial.current_rate || 
                    selectedMaterial.price_per_unit || 
                    0;
        console.log('💰 Setting unit price to:', rate);
        updated[index].unitPrice = rate;
      }
    }
    
    setCollectionMaterials(updated);
  };

  const getTotalWeight = () => {
    return collectionMaterials.reduce((sum, material) => sum + (material.kilograms || 0), 0);
  };

  const getTotalValue = () => {
    return collectionMaterials.reduce((sum, material) => 
      sum + ((material.kilograms || 0) * (material.unitPrice || 0)), 0
    );
  };

  const validateForm = () => {
    if (!user) {
      setError('No user selected');
      return false;
    }

    const validMaterials = collectionMaterials.filter(m => 
      m.materialName && m.kilograms > 0 && m.unitPrice > 0
    );

    if (validMaterials.length === 0) {
      setError('Please add at least one material with valid quantity and price');
      return false;
    }

    return true;
  };

  const handleSaveCollection = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);
      
      console.log('🚀 Starting collection save process...');
      console.log('🔍 User:', user);
      console.log('🔍 Collector:', collector);
      console.log('🔍 Supabase client:', supabase);

      const validMaterials = collectionMaterials.filter(m => 
        m.materialName && m.kilograms > 0 && m.unitPrice > 0
      );
      
      console.log('🔍 Valid materials:', validMaterials);

      // Test Supabase connection
      try {
        const { data: testData, error: testError } = await supabase
          .from('materials')
          .select('count')
          .limit(1);
        console.log('🔍 Supabase connection test:', { testData, testError });
      } catch (testErr) {
        console.error('❌ Supabase connection failed:', testErr);
      }

      // Create collection data for unified_collections table (simplified schema)
      const currentCollectorId = collector?.id || null;
      const currentCollectorName = collector?.name || collector?.email || 'Unknown Collector';
      const collectionData = {
        collection_code: `PK${Date.now()}`,
        status: 'pending',
        customer_id: user!.id,
        collector_id: currentCollectorId,
        customer_name: user!.full_name,
        customer_email: user!.email,
        collector_name: currentCollectorName,
        collector_email: (collector as any)?.email || null,
        total_weight_kg: getTotalWeight(),
        total_value: getTotalValue(),
        created_by: currentCollectorId
      };

      console.log('🚀 Creating collection pickup:', collectionData);

      // Insert collection pickup into unified_collections table
      const { data: collection, error: collectionError } = await supabase
        .from('unified_collections') // Use unified_collections table for proper Office App flow
        .insert(collectionData)
        .select('id')
        .single();

      if (collectionError) {
        console.error('❌ Collection error:', collectionError);
        console.error('❌ Collection error details:', collectionError);
        console.error('❌ Collection data that failed:', collectionData);
        throw collectionError;
      }
      
      console.log('✅ Collection created successfully:', collection);

       // Insert collection materials for each material (unified schema)
       if (collection && validMaterials.length > 0) {
         const collectionMaterials = validMaterials.map(material => {
           // Find the material object to get its UUID
           const materialObj = materials.find(m => m.name === material.materialName);
           if (!materialObj) {
             throw new Error(`Material not found: ${material.materialName}`);
           }

           const item = {
             collection_id: collection.id, // Reference to unified_collections
             material_id: materialObj.id, // Use UUID, not name
             quantity: parseFloat(material.kilograms.toString()), // Required field
             unit_price: parseFloat(material.unitPrice.toString()) // Required field
           };
           console.log('🔍 Mapped collection material:', item);
           return item;
         });

         console.log('🔍 Inserting collection materials:', collectionMaterials);
         const { data: itemsData, error: itemsError } = await supabase
           .from('collection_materials') // Use collection_materials table in unified schema
           .insert(collectionMaterials)
           .select();

        if (itemsError) {
          console.error('❌ Collection materials error:', itemsError);
          console.error('❌ Collection materials error details:', itemsError);
          console.error('❌ Collection materials data that failed:', collectionMaterials);
          throw itemsError;
        }
        console.log('✅ Collection materials inserted successfully:', itemsData);
      }

      // Wallet updates are disabled in Collector App by business rule

      // Send collection to office app for approval
      try {
        const approvalResult = await OfficeIntegrationService.sendCollectionForApproval(collection.id);
        if (approvalResult.success) {
          console.log('✅ Collection sent for approval successfully');
        } else {
          console.warn('⚠️ Failed to send collection for approval:', approvalResult.error);
          // Don't throw - collection was still created successfully
        }
      } catch (approvalError) {
        console.warn('⚠️ Error sending collection for approval:', approvalError);
        // Don't throw - collection was still created successfully
      }

      // Refresh dashboard cache
      try {
        await DashboardService.refreshDashboardCache(collector!.id);
        console.log('✅ Dashboard cache refreshed');
      } catch (dashboardError) {
        console.warn('⚠️ Failed to refresh dashboard cache:', dashboardError);
        // Don't throw - collection was still created successfully
      }

      setSuccess('Collection saved successfully and sent for approval!');
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);

    } catch (error) {
      console.error('❌ Error saving collection:', error);
      setError(error instanceof Error ? error.message : 'Failed to save collection');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div>
            <h2 className="text-2xl font-bold text-white">Create Collection</h2>
            <p className="text-gray-400 mt-1">Record a collection for this user</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-gray-700">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Info */}
          <Card className="bg-gray-700 border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <User className="h-5 w-5 text-blue-400" />
                <span>Customer Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-300">Name</Label>
                  <p className="text-white font-medium">{user.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-300">Email</Label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-white">{user.email}</p>
                  </div>
                </div>
                {user.phone && (
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Phone</Label>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-white">{user.phone}</p>
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-300">Address</Label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <p className="text-white">
                      {user.street_addr ? 
                        `${user.street_addr}${user.subdivision ? ', ' + user.subdivision : ''}, ${user.city || 'Unknown City'}${user.postal_code ? ' ' + user.postal_code : ''}` :
                        'No address provided'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Materials */}
          <Card className="bg-gray-700 border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-green-400" />
                  <span>Materials Collected</span>
                </div>
                <Button variant="outline" size="sm" onClick={addMaterial} className="border-gray-500 text-gray-300 hover:bg-gray-600 hover:text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collectionMaterials.map((material, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-600 rounded-lg bg-gray-800">
                    <div>
                      <Label className="text-sm font-medium text-gray-300">Material</Label>
                      <Select 
                        value={material.materialName} 
                        onValueChange={(value) => updateMaterial(index, 'materialName', value)}
                      >
                        <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-600">
                          {materials.map((mat) => (
                            <SelectItem key={mat.id} value={mat.name} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                              {mat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-300">Weight (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={material.kilograms || 0}
                        onChange={(e) => updateMaterial(index, 'kilograms', parseFloat(e.target.value) || 0)}
                        placeholder="0.0"
                        className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-300">Unit Price (R/kg)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={material.unitPrice || 0}
                        onChange={(e) => updateMaterial(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeMaterial(index)}
                        disabled={collectionMaterials.length === 1}
                        className="text-red-400 hover:text-red-300 border-gray-600 hover:bg-gray-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-800 border border-gray-600 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Scale className="h-5 w-5 text-blue-400" />
                    <span className="text-sm font-medium text-gray-300">Total Weight:</span>
                    <Badge variant="secondary" className="bg-gray-600 text-white">{getTotalWeight().toFixed(1)} kg</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-green-400" />
                    <span className="text-sm font-medium text-gray-300">Total Value:</span>
                    <Badge variant="secondary" className="bg-gray-600 text-white">R {getTotalValue().toFixed(2)}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes section removed - notes field not supported in current database schema */}

          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center justify-between p-4 bg-red-900 border border-red-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="text-red-200">{error}</p>
              </div>
              {error.includes('Network error') && (
                <Button
                  onClick={retryLoadMaterials}
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-300 hover:bg-red-800 hover:text-white"
                >
                  Retry
                </Button>
              )}
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 p-4 bg-green-900 border border-green-700 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <p className="text-green-200">{success}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-600">
            <Button variant="outline" onClick={onClose} disabled={saving} className="border-gray-500 text-gray-300 hover:bg-gray-600 hover:text-white">
              Cancel
            </Button>
            <Button onClick={handleSaveCollection} disabled={saving || loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Collection
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
