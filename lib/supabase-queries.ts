// Woza Mali Supabase Client Queries
// Example CRUD operations for the unified schema

import { supabase } from './supabase';
import type {
  Area,
  User,
  Collection,
  Transaction,
  UserWithArea,
  CollectionWithDetails,
  TransactionWithDetails,
  AreaInsert,
  UserInsert,
  CollectionInsert,
  TransactionInsert,
  AreaUpdate,
  UserUpdate,
  CollectionUpdate,
  TransactionUpdate,
  CollectionFilters,
  UserFilters,
  TransactionFilters,
  PaginationOptions,
  SortOptions,
  UserRole,
  CollectionStatus,
  TransactionType
} from '../types/database.types';

// ============================================================================
// AREA OPERATIONS
// ============================================================================

export const areaQueries = {
  // Get all areas
  async getAll(): Promise<Area[]> {
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  // Get area by ID
  async getById(id: string): Promise<Area | null> {
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new area (office only)
  async create(area: AreaInsert): Promise<Area> {
    const { data, error } = await supabase
      .from('areas')
      .insert(area)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update area (office only)
  async update(id: string, updates: AreaUpdate): Promise<Area> {
    const { data, error } = await supabase
      .from('areas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete area (office only)
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('areas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ============================================================================
// USER OPERATIONS
// ============================================================================

export const userQueries = {
  // Get all users (office only)
  async getAll(filters?: UserFilters, pagination?: PaginationOptions): Promise<UserWithArea[]> {
    let query = supabase
      .from('users')
      .select(`
        *,
        area:areas(*)
      `);

    // Apply filters
    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    if (filters?.area_id) {
      query = query.eq('area_id', filters.area_id);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
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

  // Get user by ID
  async getById(id: string): Promise<UserWithArea | null> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        area:areas(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get current user profile
  async getCurrentUser(): Promise<UserWithArea | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    return this.getById(user.id);
  },

  // Get users by area (for collectors)
  async getByArea(areaId: string): Promise<UserWithArea[]> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        area:areas(*)
      `)
      .eq('area_id', areaId)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  // Create new user (office only)
  async create(user: UserInsert): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update user profile
  async update(id: string, updates: UserUpdate): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update current user profile
  async updateCurrentUser(updates: UserUpdate): Promise<User> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');
    
    return this.update(user.id, updates);
  },

  // Delete user (office only)
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ============================================================================
// COLLECTION OPERATIONS
// ============================================================================

export const collectionQueries = {
  // Get all collections with filters
  async getAll(filters?: CollectionFilters, pagination?: PaginationOptions, sort?: SortOptions): Promise<CollectionWithDetails[]> {
    let query = supabase
      .from('collections')
      .select(`
        *,
        user:users!collections_user_id_fkey(*),
        collector:users!collections_collector_id_fkey(*),
        transactions(*)
      `);

    // Apply filters
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters?.collector_id) {
      query = query.eq('collector_id', filters.collector_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.material_type) {
      query = query.eq('material_type', filters.material_type);
    }
    if (filters?.area_id) {
      query = query.eq('user.area_id', filters.area_id);
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

  // Get collection by ID
  async getById(id: string): Promise<CollectionWithDetails | null> {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        user:users!collections_user_id_fkey(*),
        collector:users!collections_collector_id_fkey(*),
        transactions(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user's collections
  async getByUserId(userId: string): Promise<CollectionWithDetails[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        user:users!collections_user_id_fkey(*),
        collector:users!collections_collector_id_fkey(*),
        transactions(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get collector's assigned collections
  async getByCollectorId(collectorId: string): Promise<CollectionWithDetails[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        user:users!collections_user_id_fkey(*),
        collector:users!collections_collector_id_fkey(*),
        transactions(*)
      `)
      .eq('collector_id', collectorId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Create new collection
  async create(collection: CollectionInsert): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .insert(collection)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update collection
  async update(id: string, updates: CollectionUpdate): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Approve collection (office only)
  async approve(id: string, points: number): Promise<{ collection: Collection; transaction: Transaction }> {
    // Start a transaction
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .update({ status: 'approved' })
      .eq('id', id)
      .select()
      .single();
    
    if (collectionError) throw collectionError;

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: collection.user_id,
        collection_id: collection.id,
        points,
        transaction_type: 'collection',
        description: `Collection reward for ${collection.material_type}`
      })
      .select()
      .single();
    
    if (transactionError) throw transactionError;

    return { collection, transaction };
  },

  // Reject collection (office only)
  async reject(id: string, notes?: string): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .update({ 
        status: 'rejected',
        notes: notes || 'Collection rejected'
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete collection (office only)
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ============================================================================
// TRANSACTION OPERATIONS
// ============================================================================

export const transactionQueries = {
  // Get all transactions with filters
  async getAll(filters?: TransactionFilters, pagination?: PaginationOptions): Promise<TransactionWithDetails[]> {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        user:users(*),
        collection:collections(*)
      `);

    // Apply filters
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
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

  // Get transaction by ID
  async getById(id: string): Promise<TransactionWithDetails | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        user:users(*),
        collection:collections(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user's transactions
  async getByUserId(userId: string): Promise<TransactionWithDetails[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        user:users(*),
        collection:collections(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get user's total points
  async getUserTotalPoints(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('transactions')
      .select('points')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return data?.reduce((total, transaction) => total + transaction.points, 0) || 0;
  },

  // Create new transaction (office only)
  async create(transaction: TransactionInsert): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update transaction (office only)
  async update(id: string, updates: TransactionUpdate): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete transaction (office only)
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ============================================================================
// SUMMARY AND ANALYTICS QUERIES
// ============================================================================

export const analyticsQueries = {
  // Get user collections summary
  async getUserCollectionsSummary(userId?: string): Promise<any[]> {
    let query = supabase
      .from('user_collections_summary')
      .select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Get user points summary
  async getUserPointsSummary(userId?: string): Promise<any[]> {
    let query = supabase
      .from('user_points_summary')
      .select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Get collection statistics by area
  async getCollectionStatsByArea(): Promise<any[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        user:users!collections_user_id_fkey(
          area:areas(name)
        ),
        status,
        weight_kg,
        material_type
      `);
    
    if (error) throw error;
    return data || [];
  },

  // Get monthly collection trends
  async getMonthlyTrends(year: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('created_at, weight_kg, status')
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${year + 1}-01-01`);
    
    if (error) throw error;
    return data || [];
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const utilityQueries = {
  // Search users by name, phone, or email
  async searchUsers(searchTerm: string): Promise<UserWithArea[]> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        area:areas(*)
      `)
      .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(20);
    
    if (error) throw error;
    return data || [];
  },

  // Get pending collections count
  async getPendingCollectionsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('collections')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    if (error) throw error;
    return count || 0;
  },

  // Get collections by date range
  async getCollectionsByDateRange(startDate: string, endDate: string): Promise<CollectionWithDetails[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        user:users!collections_user_id_fkey(*),
        collector:users!collections_collector_id_fkey(*),
        transactions(*)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};

// Export all queries
export const wozaMaliQueries = {
  areas: areaQueries,
  users: userQueries,
  collections: collectionQueries,
  transactions: transactionQueries,
  analytics: analyticsQueries,
  utility: utilityQueries
};
