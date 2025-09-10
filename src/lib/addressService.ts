import { supabase } from './supabase';

// ============================================================================
// ADDRESS SERVICE FOR UNIFIED SCHEMA
// ============================================================================
// This service handles all address-related operations for the Main App

export interface Township {
  id: string;
  township_name: string;
  postal_code: string;
  city: string;
  subdivisions: string[];
}

export interface Subdivision {
  area_id: string;
  township_name: string;
  postal_code: string;
  subdivision: string;
}

export interface TownshipInfo {
  postal_code: string;
  city: string;
}

export class AddressService {
  // ============================================================================
  // GET ALL TOWNSHIPS
  // ============================================================================
  static async getTownships(): Promise<{ data: Township[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('address_townships')
        .select('id, township_name, postal_code, city')
        .order('township_name');

      if (error) {
        console.error('Error fetching townships:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getTownships:', error);
      return { data: null, error };
    }
  }

  // ============================================================================
  // GET SUBDIVISIONS FOR SELECTED TOWNSHIP
  // ============================================================================
  static async getSubdivisions(townshipId: string): Promise<{ data: Subdivision[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('address_subdivisions')
        .select('area_id, township_name, postal_code, subdivision')
        .eq('area_id', townshipId)
        .order('subdivision');

      if (error) {
        console.error('Error fetching subdivisions:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getSubdivisions:', error);
      return { data: null, error };
    }
  }

  // ============================================================================
  // GET TOWNSHIP INFO (POSTAL CODE AND CITY)
  // ============================================================================
  static async getTownshipInfo(townshipId: string): Promise<{ data: TownshipInfo | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('address_townships')
        .select('postal_code, city')
        .eq('id', townshipId)
        .single();

      if (error) {
        console.error('Error fetching township info:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getTownshipInfo:', error);
      return { data: null, error };
    }
  }

  // ============================================================================
  // GET CITY (ALWAYS RETURNS "SOWETO")
  // ============================================================================
  static getCity(): string {
    return 'Soweto';
  }

  // ============================================================================
  // VALIDATE ADDRESS COMPLETENESS
  // ============================================================================
  static validateAddress(address: {
    street_addr?: string;
    township_id?: string;
    subdivision?: string;
    city?: string;
    postal_code?: string;
  }): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    if (!address.street_addr?.trim()) {
      missingFields.push('Street Address');
    }

    if (!address.township_id) {
      missingFields.push('Township');
    }

    if (!address.subdivision?.trim()) {
      missingFields.push('Subdivision');
    }

    if (!address.city?.trim()) {
      missingFields.push('City');
    }

    if (!address.postal_code?.trim()) {
      missingFields.push('Postal Code');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  // ============================================================================
  // FORMAT ADDRESS FOR DISPLAY
  // ============================================================================
  static formatAddress(address: {
    street_addr?: string;
    township_name?: string;
    subdivision?: string;
    city?: string;
    postal_code?: string;
  }): string {
    const parts: string[] = [];

    if (address.street_addr) {
      parts.push(address.street_addr);
    }

    if (address.subdivision && address.township_name) {
      parts.push(`${address.subdivision}, ${address.township_name}`);
    } else if (address.township_name) {
      parts.push(address.township_name);
    }

    if (address.city) {
      parts.push(address.city);
    }

    if (address.postal_code) {
      parts.push(address.postal_code);
    }

    return parts.join(', ');
  }
}

// ============================================================================
// HOOKS FOR REACT COMPONENTS
// ============================================================================

import { useState, useEffect } from 'react';

export function useTownships() {
  const [townships, setTownships] = useState<Township[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchTownships = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await AddressService.getTownships();

      if (error) {
        setError(error);
      } else {
        setTownships(data || []);
      }

      setLoading(false);
    };

    fetchTownships();
  }, []);

  return { townships, loading, error };
}

export function useSubdivisions(townshipId: string | null) {
  const [subdivisions, setSubdivisions] = useState<Subdivision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!townshipId) {
      setSubdivisions([]);
      return;
    }

    const fetchSubdivisions = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await AddressService.getSubdivisions(townshipId);

      if (error) {
        setError(error);
      } else {
        setSubdivisions(data || []);
      }

      setLoading(false);
    };

    fetchSubdivisions();
  }, [townshipId]);

  return { subdivisions, loading, error };
}
