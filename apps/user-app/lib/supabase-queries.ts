// Woza Mali User App Supabase Queries
// CRUD operations for the unified schema - User App specific

import { supabase } from '../../../lib/supabase';
import type {
  User,
  Collection,
  Transaction,
  UserWithArea,
  CollectionWithDetails,
  TransactionWithDetails,
  CollectionInsert,
  UserUpdate,
  UserCollectionFilters,
  UserTransactionFilters,
  PaginationOptions,
  SortOptions,
  CollectionStatus,
  TransactionType
} from '../types/database.types';

// ============================================================================
// USER OPERATIONS (User App)
// ============================================================================

export const userQueries = {
  // Get current user profile
  async getCurrentUser(): Promise<UserWithArea | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        area:areas(*)
      `)
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update current user profile
  async updateCurrentUser(updates: UserUpdate): Promise<User> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ============================================================================
// COLLECTION OPERATIONS (User App)
// ============================================================================

export const collectionQueries = {
  // Get user's own collections
  async getMyCollections(filters?: UserCollectionFilters, pagination?: PaginationOptions, sort?: SortOptions): Promise<CollectionWithDetails[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    let query = supabase
      .from('collections')
      .select(`
        *,
        user:users!collections_user_id_fkey(*),
        collector:users!collections_collector_id_fkey(*),
        transactions(*)
      `)
      .eq('user_id', user.id);

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.material_type) {
      query = query.eq('material_type', filters.material_type);
    }
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    // Apply pagination
    if (pagination?.limit) {
      const offset = pagination.offset || (pagination.page || 0) * pagination.limit;
      query = query.range(offset, offset + pagination.limit - 1);
    }

    // Apply sorting
    const sortColumn = sort?.column || 'created_at';
    const ascending = sort?.ascending !== false;
    query = query.order(sortColumn, { ascending });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Get collection by ID (user's own collections only)
  async getMyCollectionById(id: string): Promise<CollectionWithDetails | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        user:users!collections_user_id_fkey(*),
        collector:users!collections_collector_id_fkey(*),
        transactions(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new collection
  async createCollection(collection: Omit<CollectionInsert, 'user_id'>): Promise<Collection> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('collections')
      .insert({
        ...collection,
        user_id: user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ============================================================================
// TRANSACTION OPERATIONS (User App)
// ============================================================================

export const transactionQueries = {
  // Get user's own transactions
  async getMyTransactions(filters?: UserTransactionFilters, pagination?: PaginationOptions): Promise<TransactionWithDetails[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    let query = supabase
      .from('transactions')
      .select(`
        *,
        user:users(*),
        collection:collections(*)
      `)
      .eq('user_id', user.id);

    // Apply filters
    if (filters?.transaction_type) {
      query = query.eq('transaction_type', filters.transaction_type);
    }
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    // Apply pagination
    if (pagination?.limit) {
      const offset = pagination.offset || (pagination.page || 0) * pagination.limit;
      query = query.range(offset, offset + pagination.limit - 1);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Get user's total points
  async getMyTotalPoints(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('transactions')
      .select('points')
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    return data?.reduce((total, transaction) => total + transaction.points, 0) || 0;
  }
};

// ============================================================================
// SUMMARY AND ANALYTICS QUERIES (User App)
// ============================================================================

export const analyticsQueries = {
  // Get user's collections summary
  async getMyCollectionsSummary(): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('user_collections_summary')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user's points summary
  async getMyPointsSummary(): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('user_points_summary')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ============================================================================
// UTILITY FUNCTIONS (User App)
// ============================================================================

export const utilityQueries = {
  // Get all areas (for user to select their area)
  async getAreas(): Promise<any[]> {
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  // Get user's recent activity
  async getMyRecentActivity(limit: number = 10): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Get recent collections and transactions
    const [collectionsResult, transactionsResult] = await Promise.all([
      supabase
        .from('collections')
        .select('id, created_at, material_type, weight_kg, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('transactions')
        .select('id, created_at, points, transaction_type, description')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)
    ]);

    if (collectionsResult.error) throw collectionsResult.error;
    if (transactionsResult.error) throw transactionsResult.error;

    // Combine and sort by date
    const activities = [
      ...(collectionsResult.data || []).map(item => ({ ...item, type: 'collection' })),
      ...(transactionsResult.data || []).map(item => ({ ...item, type: 'transaction' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return activities.slice(0, limit);
  }
};

// Export all queries for User App
export const userAppQueries = {
  users: userQueries,
  collections: collectionQueries,
  transactions: transactionQueries,
  analytics: analyticsQueries,
  utility: utilityQueries
};
