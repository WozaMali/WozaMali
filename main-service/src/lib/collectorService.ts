import { supabase } from './supabase';
import {
  CollectionArea,
  CollectionSchedule,
  CollectionRoute,
  CollectionLog,
  HouseholdCollection,
  CollectorAreasResponse,
  CollectorSchedulesResponse,
  CollectorRoutesResponse,
  CollectionLogsResponse,
  HouseholdCollectionsResponse,
  CollectionLogFormData,
  HouseholdCollectionFormData,
  CollectorStats
} from '@/types/collector';

class CollectorService {
  private cache: Map<string, any> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  // Clear cache when needed
  clearCache() {
    this.cache.clear();
  }

  // Check if cache is valid
  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheExpiry;
  }

  // Get cache
  private getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && this.isCacheValid(key)) {
      return cached.data;
    }
    return null;
  }

  // Set cache
  private setCache(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Get collector's assigned areas
  async getCollectorAreas(collectorId: string): Promise<CollectorAreasResponse> {
    try {
      const cacheKey = `collector_areas_${collectorId}`;
      const cached = this.getCache<CollectionArea[]>(cacheKey);
      if (cached) {
        return { data: cached, error: null };
      }

      const { data, error } = await supabase
        .rpc('get_collector_areas', { collector_uuid: collectorId });

      if (error) throw error;

      this.setCache(cacheKey, data);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching collector areas:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to fetch collector areas' 
      };
    }
  }

  // Get collector's schedules
  async getCollectorSchedules(collectorId: string): Promise<CollectorSchedulesResponse> {
    try {
      const cacheKey = `collector_schedules_${collectorId}`;
      const cached = this.getCache<CollectionSchedule[]>(cacheKey);
      if (cached) {
        return { data: cached, error: null };
      }

      const { data, error } = await supabase
        .from('collection_schedules')
        .select('*')
        .eq('collector_id', collectorId)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;

      this.setCache(cacheKey, data);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching collector schedules:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to fetch collector schedules' 
      };
    }
  }

  // Get collector's routes
  async getCollectorRoutes(collectorId: string): Promise<CollectorRoutesResponse> {
    try {
      const cacheKey = `collector_routes_${collectorId}`;
      const cached = this.getCache<CollectionRoute[]>(cacheKey);
      if (cached) {
        return { data: cached, error: null };
      }

      const { data, error } = await supabase
        .rpc('get_collector_routes', { collector_uuid: collectorId });

      if (error) throw error;

      this.setCache(cacheKey, data);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching collector routes:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to fetch collector routes' 
      };
    }
  }

  // Get collector's collection logs
  async getCollectorLogs(collectorId: string, date?: string): Promise<CollectionLogsResponse> {
    try {
      let query = supabase
        .from('collection_logs')
        .select('*')
        .eq('collector_id', collectorId)
        .order('collection_date', { ascending: false });

      if (date) {
        query = query.eq('collection_date', date);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching collector logs:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to fetch collector logs' 
      };
    }
  }

  // Create a new collection log
  async createCollectionLog(logData: CollectionLogFormData): Promise<{ data: CollectionLog | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('collection_logs')
        .insert([logData])
        .select()
        .single();

      if (error) throw error;

      // Clear related cache
      this.clearCache();

      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating collection log:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to create collection log' 
      };
    }
  }

  // Update a collection log
  async updateCollectionLog(logId: string, updates: Partial<CollectionLogFormData>): Promise<{ data: CollectionLog | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('collection_logs')
        .update(updates)
        .eq('id', logId)
        .select()
        .single();

      if (error) throw error;

      // Clear related cache
      this.clearCache();

      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating collection log:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to update collection log' 
      };
    }
  }

  // Create a household collection record
  async createHouseholdCollection(collectionData: HouseholdCollectionFormData, collectionLogId: string): Promise<{ data: HouseholdCollection | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('household_collections')
        .insert([{
          ...collectionData,
          collection_log_id: collectionLogId,
          collection_date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating household collection:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to create household collection' 
      };
    }
  }

  // Get collector statistics
  async getCollectorStats(collectorId: string): Promise<{ data: CollectorStats | null; error: string | null }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get total areas
      const { data: areas, error: areasError } = await supabase
        .rpc('get_collector_areas', { collector_uuid: collectorId });

      if (areasError) throw areasError;

      // Get total routes
      const { data: routes, error: routesError } = await supabase
        .rpc('get_collector_routes', { collector_uuid: collectorId });

      if (routesError) throw routesError;

      // Get today's collections
      const { data: todayLogs, error: logsError } = await supabase
        .from('collection_logs')
        .select('households_visited, households_collected, total_weight_kg')
        .eq('collector_id', collectorId)
        .eq('collection_date', today)
        .eq('status', 'completed');

      if (logsError) throw logsError;

      const stats: CollectorStats = {
        total_areas: areas?.length || 0,
        total_routes: routes?.length || 0,
        total_collections_today: todayLogs?.length || 0,
        total_weight_today: todayLogs?.reduce((sum, log) => sum + (log.total_weight_kg || 0), 0) || 0,
        total_households_today: todayLogs?.reduce((sum, log) => sum + (log.households_collected || 0), 0) || 0
      };

      return { data: stats, error: null };
    } catch (error: any) {
      console.error('Error fetching collector stats:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to fetch collector stats' 
      };
    }
  }

  // Get all collection areas (for admin/manager use)
  async getAllCollectionAreas(): Promise<CollectorAreasResponse> {
    try {
      const cacheKey = 'all_collection_areas';
      const cached = this.getCache<CollectionArea[]>(cacheKey);
      if (cached) {
        return { data: cached, error: null };
      }

      const { data, error } = await supabase
        .from('collection_areas')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      this.setCache(cacheKey, data);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching all collection areas:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to fetch collection areas' 
      };
    }
  }

  // Search households by address (for collection purposes)
  async searchHouseholds(searchTerm: string): Promise<{ data: any[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, street_address, suburb, city, postal_code')
        .or(`full_name.ilike.%${searchTerm}%,street_address.ilike.%${searchTerm}%,suburb.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error searching households:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to search households' 
      };
    }
  }
}

export const collectorService = new CollectorService();
