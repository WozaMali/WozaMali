// Woza Mali Office App Supabase Queries
// CRUD operations for the unified schema - Office App specific

import { supabase } from '../../../lib/supabase';
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
  OfficeCollectionFilters,
  OfficeUserFilters,
  OfficeTransactionFilters,
  PaginationOptions,
  SortOptions,
  UserRole,
  CollectionStatus,
  TransactionType,
  OfficeAnalytics,
  AreaAnalytics,
  Material,
  PickupItem,
  PickupItemWithMaterial,
  PickupPhoto,
  CollectionAnalytics,
  UserAnalytics
} from '../types/database.types';

// ============================================================================
// AREA OPERATIONS (Office App)
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

  // Create new area
  async create(area: AreaInsert): Promise<Area> {
    const { data, error } = await supabase
      .from('areas')
      .insert(area)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update area
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

  // Delete area
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('areas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ============================================================================
// MATERIAL OPERATIONS (Office App)
// ============================================================================

export const materialQueries = {
  // Get all materials
  async getAll(): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all materials:', error);
      return [];
    }
  },

  // Get active materials only
  async getActive(): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active materials:', error);
      return [];
    }
  },

  // Get material by ID
  async getById(id: string): Promise<Material | null> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching material by ID:', error);
      return null;
    }
  },

  // Get materials by category
  async getByCategory(category: string): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('category', category)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching materials by category:', error);
      return [];
    }
  },

  // Get unique categories
  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('category')
        .order('category', { ascending: true });

      if (error) throw error;
      
      // Extract unique categories
      const categories = [...new Set(data?.map(item => item.category) || [])];
      return categories;
    } catch (error) {
      console.error('Error fetching material categories:', error);
      return [];
    }
  },

  // Create new material
  async create(material: Omit<Material, 'id' | 'created_at' | 'updated_at'>): Promise<Material | null> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .insert(material)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating material:', error);
      return null;
    }
  },

  // Update material
  async update(id: string, updates: Partial<Material>): Promise<Material | null> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating material:', error);
      return null;
    }
  },

  // Delete material
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting material:', error);
      return false;
    }
  },

  // Toggle material active status
  async toggleActive(id: string): Promise<Material | null> {
    try {
      // First get current status
      const current = await this.getById(id);
      if (!current) return null;

      // Toggle the status
      return await this.update(id, { is_active: !current.is_active });
    } catch (error) {
      console.error('Error toggling material active status:', error);
      return null;
    }
  }
};

// ============================================================================
// PICKUP ITEM OPERATIONS (Office App)
// ============================================================================

export const pickupItemQueries = {
  // Get all pickup items
  async getAll(): Promise<PickupItemWithMaterial[]> {
    try {
      const { data, error } = await supabase
        .from('pickup_items')
        .select(`
          *,
          material:materials(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all pickup items:', error);
      return [];
    }
  },

  // Get pickup items by collection ID
  async getByCollectionId(collectionId: string): Promise<PickupItemWithMaterial[]> {
    try {
      const { data, error } = await supabase
        .from('pickup_items')
        .select(`
          *,
          material:materials(*)
        `)
        .eq('pickup_id', collectionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pickup items by collection ID:', error);
      return [];
    }
  },

  // Get pickup items by material ID
  async getByMaterialId(materialId: string): Promise<PickupItemWithMaterial[]> {
    try {
      const { data, error } = await supabase
        .from('pickup_items')
        .select(`
          *,
          material:materials(*)
        `)
        .eq('material_id', materialId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pickup items by material ID:', error);
      return [];
    }
  },

  // Update pickup item
  async update(id: string, updates: Partial<PickupItem>): Promise<PickupItem | null> {
    try {
      const { data, error } = await supabase
        .from('pickup_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating pickup item:', error);
      return null;
    }
  },

  // Delete pickup item
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pickup_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting pickup item:', error);
      return false;
    }
  }
};

// ============================================================================
// PICKUP PHOTO OPERATIONS (Office App)
// ============================================================================

export const pickupPhotoQueries = {
  // Get all pickup photos
  async getAll(): Promise<PickupPhoto[]> {
    try {
      const { data, error } = await supabase
        .from('pickup_photos')
        .select('*')
        .order('taken_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all pickup photos:', error);
      return [];
    }
  },

  // Get pickup photos by collection ID
  async getByCollectionId(collectionId: string): Promise<PickupPhoto[]> {
    try {
      const { data, error } = await supabase
        .from('pickup_photos')
        .select('*')
        .eq('pickup_id', collectionId)
        .order('taken_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pickup photos by collection ID:', error);
      return [];
    }
  },

  // Get pickup photos by type
  async getByType(photoType: 'before' | 'after' | 'general' | 'verification'): Promise<PickupPhoto[]> {
    try {
      const { data, error } = await supabase
        .from('pickup_photos')
        .select('*')
        .eq('photo_type', photoType)
        .order('taken_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pickup photos by type:', error);
      return [];
    }
  },

  // Delete pickup photo
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pickup_photos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting pickup photo:', error);
      return false;
    }
  }
};

// ============================================================================
// USER OPERATIONS (Office App)
// ============================================================================

export const userQueries = {
  // Get all users
  async getAll(filters?: OfficeUserFilters, pagination?: PaginationOptions): Promise<UserWithArea[]> {
    let query = supabase
      .from('users')
      .select(`
        *,
        area:areas(*),
        addresses:user_addresses(*)
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

  // Create new user
  async create(user: UserInsert): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update user
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

  // Delete user
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ============================================================================
// COLLECTION OPERATIONS (Office App)
// ============================================================================

export const collectionQueries = {
  // Get all collections with addresses
  async getAll(filters?: OfficeCollectionFilters, pagination?: PaginationOptions, sort?: SortOptions): Promise<CollectionWithDetails[]> {
    let query = supabase
      .from('collections')
      .select(`
        *,
        user:users!collections_user_id_fkey(*),
        collector:users!collections_collector_id_fkey(*),
        pickup_address:user_addresses!collections_pickup_address_id_fkey(*),
        transactions(*),
        pickup_items(*),
        pickup_photos(*)
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
        transactions(*),
        pickup_items(*),
        pickup_photos(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
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

  // Approve collection and create transaction
  async approve(id: string, points: number): Promise<{ collection: Collection; transaction: Transaction }> {
    // Update collection status
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

  // Reject collection
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

  // Delete collection
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ============================================================================
// TRANSACTION OPERATIONS (Office App)
// ============================================================================

export const transactionQueries = {
  // Get all transactions
  async getAll(filters?: OfficeTransactionFilters, pagination?: PaginationOptions): Promise<TransactionWithDetails[]> {
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

  // Create new transaction
  async create(transaction: TransactionInsert): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update transaction
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

  // Delete transaction
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ============================================================================
// ANALYTICS AND REPORTING (Office App)
// ============================================================================

export const analyticsQueries = {
  // Get overall analytics
  async getOverallAnalytics(): Promise<OfficeAnalytics> {
    const [usersResult, collectionsResult, transactionsResult] = await Promise.all([
      supabase.from('users').select('id, role'),
      supabase.from('collections').select('status, weight_kg'),
      supabase.from('transactions').select('points')
    ]);

    if (usersResult.error) throw usersResult.error;
    if (collectionsResult.error) throw collectionsResult.error;
    if (transactionsResult.error) throw transactionsResult.error;

    const users = usersResult.data || [];
    const collections = collectionsResult.data || [];
    const transactions = transactionsResult.data || [];

    return {
      total_users: users.length,
      total_collections: collections.length,
      total_weight_collected: collections.reduce((sum, c) => sum + (c.weight_kg || 0), 0),
      total_points_awarded: transactions.reduce((sum, t) => sum + (t.points || 0), 0),
      pending_collections: collections.filter(c => c.status === 'pending').length,
      approved_collections: collections.filter(c => c.status === 'approved').length,
      rejected_collections: collections.filter(c => c.status === 'rejected').length
    };
  },

  // Get analytics by area
  async getAreaAnalytics(): Promise<AreaAnalytics[]> {
    const { data, error } = await supabase
      .from('user_collections_summary')
      .select('*');
    
    if (error) throw error;

    // Group by area
    const areaMap = new Map<string, AreaAnalytics>();
    
    (data || []).forEach(item => {
      const areaId = item.area_name || 'Unknown';
      if (!areaMap.has(areaId)) {
        areaMap.set(areaId, {
          area_id: areaId,
          area_name: areaId,
          total_users: 0,
          total_collections: 0,
          total_weight: 0,
          total_points: 0,
          collectors_count: 0
        });
      }
      
      const area = areaMap.get(areaId)!;
      area.total_users++;
      area.total_collections += item.total_collections;
      area.total_weight += item.total_weight;
      if (item.role === 'collector') {
        area.collectors_count++;
      }
    });

    return Array.from(areaMap.values());
  },

  // Get collection analytics by material type
  async getCollectionAnalytics(): Promise<CollectionAnalytics[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('material_type, weight_kg, status');
    
    if (error) throw error;

    const materialMap = new Map<string, CollectionAnalytics>();
    
    (data || []).forEach(collection => {
      const material = collection.material_type;
      if (!materialMap.has(material)) {
        materialMap.set(material, {
          material_type: material,
          total_collections: 0,
          total_weight: 0,
          average_weight: 0,
          approval_rate: 0
        });
      }
      
      const analytics = materialMap.get(material)!;
      analytics.total_collections++;
      analytics.total_weight += collection.weight_kg || 0;
    });

    // Calculate averages and approval rates
    materialMap.forEach(analytics => {
      analytics.average_weight = analytics.total_weight / analytics.total_collections;
      
      const materialCollections = (data || []).filter(c => c.material_type === analytics.material_type);
      const approved = materialCollections.filter(c => c.status === 'approved').length;
      analytics.approval_rate = approved / materialCollections.length;
    });

    return Array.from(materialMap.values());
  },

  // Get user analytics by role
  async getUserAnalytics(): Promise<UserAnalytics[]> {
    const { data, error } = await supabase
      .from('users')
      .select('role');
    
    if (error) throw error;

    const roleMap = new Map<UserRole, UserAnalytics>();
    
    (data || []).forEach(user => {
      const role = user.role as UserRole;
      if (!roleMap.has(role)) {
        roleMap.set(role, {
          role,
          count: 0,
          active_users: 0,
          total_collections: 0,
          total_points: 0
        });
      }
      
      roleMap.get(role)!.count++;
    });

    return Array.from(roleMap.values());
  }
};

// ============================================================================
// UTILITY FUNCTIONS (Office App)
// ============================================================================

export const utilityQueries = {
  // Search users
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
        transactions(*),
        pickup_items(*),
        pickup_photos(*)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Bulk operations
  async bulkApproveCollections(collectionIds: string[], pointsPerKg: number = 10): Promise<void> {
    for (const id of collectionIds) {
      const collection = await collectionQueries.getById(id);
      if (collection) {
        const points = Math.round(collection.weight_kg * pointsPerKg);
        await collectionQueries.approve(id, points);
      }
    }
  },

  async bulkRejectCollections(collectionIds: string[], notes: string = 'Bulk rejection'): Promise<void> {
    for (const id of collectionIds) {
      await collectionQueries.reject(id, notes);
    }
  }
};

// Export all queries for Office App
export const officeAppQueries = {
  areas: areaQueries,
  users: userQueries,
  collections: collectionQueries,
  transactions: transactionQueries,
  analytics: analyticsQueries,
  utility: utilityQueries
};
