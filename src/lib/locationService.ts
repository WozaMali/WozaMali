import { supabase } from './supabase';
import { Township, City, LocationApiResponse } from '@/types/location';

class LocationService {
  private townshipsCache: Township[] | null = null;
  private citiesCache: City[] | null = null;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastFetch = 0;

  // Clear cache when needed
  clearCache() {
    this.townshipsCache = null;
    this.citiesCache = null;
    this.lastFetch = 0;
  }

  // Check if cache is valid
  private isCacheValid(): boolean {
    return Date.now() - this.lastFetch < this.cacheExpiry;
  }

  // Check if table exists
  private async tableExists(tableName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);
      
      // If we get an error about table not existing, return false
      if (error && error.code === '42P01') { // Table doesn't exist
        return false;
      }
      
      return true;
    } catch (error: any) {
      if (error.code === '42P01') { // Table doesn't exist
        return false;
      }
      return false;
    }
  }

  // Fetch all townships
  async getTownships(): Promise<LocationApiResponse> {
    try {
      // Return cached data if valid
      if (this.townshipsCache && this.isCacheValid()) {
        return { data: this.townshipsCache, error: null };
      }

      // Check if table exists
      const tableExists = await this.tableExists('townships');
      if (!tableExists) {
        console.warn('Townships table does not exist yet. Please run the database setup script.');
        return { 
          data: [], 
          error: 'Townships table not found. Please run the database setup script.' 
        };
      }

      const { data, error } = await supabase
        .from('townships')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      this.townshipsCache = data;
      this.lastFetch = Date.now();

      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching townships:', error);
      return { 
        data: [], 
        error: error.message || 'Failed to fetch townships' 
      };
    }
  }

  // Fetch townships by city
  async getTownshipsByCity(cityName: string): Promise<LocationApiResponse> {
    try {
      // Check if table exists
      const tableExists = await this.tableExists('townships');
      if (!tableExists) {
        return { 
          data: [], 
          error: 'Townships table not found. Please run the database setup script.' 
        };
      }

      const { data, error } = await supabase
        .rpc('get_townships_by_city', { city_name: cityName });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching townships by city:', error);
      return { 
        data: [], 
        error: error.message || 'Failed to fetch townships by city' 
      };
    }
  }

  // Fetch all cities
  async getCities(): Promise<LocationApiResponse> {
    try {
      // Return cached data if valid
      if (this.citiesCache && this.isCacheValid()) {
        return { data: this.citiesCache, error: null };
      }

      // Check if table exists
      const tableExists = await this.tableExists('cities');
      if (!tableExists) {
        console.warn('Cities table does not exist yet. Please run the database setup script.');
        return { 
          data: [], 
          error: 'Cities table not found. Please run the database setup script.' 
        };
      }

      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      this.citiesCache = data;
      this.lastFetch = Date.now();

      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching cities:', error);
      return { 
        data: [], 
        error: error.message || 'Failed to fetch cities' 
      };
    }
  }

  // Fetch cities by province
  async getCitiesByProvince(provinceName: string = 'Gauteng'): Promise<LocationApiResponse> {
    try {
      // Check if table exists
      const tableExists = await this.tableExists('cities');
      if (!tableExists) {
        return { 
          data: [], 
          error: 'Cities table not found. Please run the database setup script.' 
        };
      }

      const { data, error } = await supabase
        .rpc('get_cities_by_province', { province_name: provinceName });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching cities by province:', error);
      return { 
        data: [], 
        error: error.message || 'Failed to fetch cities by province' 
      };
    }
  }

  // Get postal code for a township
  async getPostalCode(townshipName: string): Promise<string> {
    try {
      // Check if table exists
      const tableExists = await this.tableExists('townships');
      if (!tableExists) {
        return '';
      }

      const { data, error } = await supabase
        .from('townships')
        .select('postal_code')
        .eq('name', townshipName)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      return data?.postal_code || '';
    } catch (error: any) {
      console.error('Error fetching postal code:', error);
      return '';
    }
  }

  // Search locations
  async searchLocations(query: string): Promise<{
    townships: Township[];
    cities: City[];
  }> {
    try {
      const [townshipsResult, citiesResult] = await Promise.all([
        this.getTownships(),
        this.getCities(),
      ]);

      const queryLower = query.toLowerCase();
      
      const filteredTownships = (townshipsResult.data as Township[])?.filter(t => 
        t.name.toLowerCase().includes(queryLower) ||
        t.city.toLowerCase().includes(queryLower)
      ) || [];

      const filteredCities = (citiesResult.data as City[])?.filter(c => 
        c.name.toLowerCase().includes(queryLower) ||
        c.province.toLowerCase().includes(queryLower)
      ) || [];

      return {
        townships: filteredTownships,
        cities: filteredCities,
      };
    } catch (error) {
      console.error('Error searching locations:', error);
      return { townships: [], cities: [] };
    }
  }

  // Get location statistics
  async getLocationStats(): Promise<{
    totalTownships: number;
    totalCities: number;
    provinces: string[];
  }> {
    try {
      const [townshipsResult, citiesResult] = await Promise.all([
        this.getTownships(),
        this.getCities(),
      ]);

      const citiesData = citiesResult.data as City[];
      const provinces = Array.from(new Set(citiesData?.map(c => c.province) || []));

      return {
        totalTownships: (townshipsResult.data as Township[])?.length || 0,
        totalCities: citiesData?.length || 0,
        provinces
      };
    } catch (error) {
      console.error('Error fetching location stats:', error);
      return {
        totalTownships: 0,
        totalCities: 0,
        provinces: []
      };
    }
  }

  // Check database status
  async checkDatabaseStatus(): Promise<{
    townshipsTableExists: boolean;
    citiesTableExists: boolean;
    message: string;
  }> {
    try {
      const [townshipsExists, citiesExists] = await Promise.all([
        this.tableExists('townships'),
        this.tableExists('cities')
      ]);

      let message = '';
      if (!townshipsExists || !citiesExists) {
        message = 'Some location tables are missing. Please run the database setup script.';
      } else {
        message = 'All location tables are available.';
      }

      return {
        townshipsTableExists: townshipsExists,
        citiesTableExists: citiesExists,
        message
      };
    } catch (error) {
      console.error('Error checking database status:', error);
      return {
        townshipsTableExists: false,
        citiesTableExists: false,
        message: 'Error checking database status'
      };
    }
  }
}

// Export singleton instance
export const locationService = new LocationService();

// Export individual functions for convenience
export const {
  getTownships,
  getTownshipsByCity,
  getCities,
  getCitiesByProvince,
  getPostalCode,
  searchLocations,
  getLocationStats,
  clearCache,
  checkDatabaseStatus
} = locationService;
