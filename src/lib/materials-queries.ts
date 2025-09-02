// Woza Mali Main App Materials Queries
// CRUD operations for materials table

import { supabase } from './supabase';
import type { Material, MaterialInsert, MaterialUpdate } from './supabase';

// ============================================================================
// MATERIAL OPERATIONS
// ============================================================================

export const materialQueries = {
  // Get all active materials
  async getAllActive(): Promise<Material[]> {
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

  // Get all materials (including inactive)
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

  // Get materials by category
  async getByCategory(category: string): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching materials by category:', error);
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

  // Get unique categories
  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('category')
        .eq('is_active', true)
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

  // Create new material (admin only)
  async create(material: MaterialInsert): Promise<Material | null> {
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

  // Update material (admin only)
  async update(id: string, updates: MaterialUpdate): Promise<Material | null> {
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

  // Delete material (admin only)
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

  // Toggle material active status (admin only)
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
// MATERIAL SEARCH AND FILTERING
// ============================================================================

export const materialSearch = {
  // Search materials by name or description
  async search(query: string): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching materials:', error);
      return [];
    }
  },

  // Get materials with price range
  async getByPriceRange(minPrice: number, maxPrice: number): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .gte('unit_price', minPrice)
        .lte('unit_price', maxPrice)
        .eq('is_active', true)
        .order('unit_price', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching materials by price range:', error);
      return [];
    }
  }
};

// ============================================================================
// MATERIAL ANALYTICS
// ============================================================================

export const materialAnalytics = {
  // Get material statistics
  async getStats(): Promise<{
    totalMaterials: number;
    activeMaterials: number;
    categories: number;
    averagePrice: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('is_active, unit_price, category');

      if (error) throw error;

      const totalMaterials = data?.length || 0;
      const activeMaterials = data?.filter(m => m.is_active).length || 0;
      const categories = new Set(data?.map(m => m.category)).size;
      const averagePrice = data?.reduce((sum, m) => sum + m.unit_price, 0) / totalMaterials || 0;

      return {
        totalMaterials,
        activeMaterials,
        categories,
        averagePrice: Math.round(averagePrice * 100) / 100
      };
    } catch (error) {
      console.error('Error fetching material statistics:', error);
      return {
        totalMaterials: 0,
        activeMaterials: 0,
        categories: 0,
        averagePrice: 0
      };
    }
  },

  // Get materials by category with counts
  async getCategoryStats(): Promise<Array<{
    category: string;
    count: number;
    averagePrice: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('category, unit_price, is_active')
        .eq('is_active', true);

      if (error) throw error;

      // Group by category
      const categoryMap = new Map<string, { count: number; totalPrice: number }>();
      
      data?.forEach(material => {
        const existing = categoryMap.get(material.category) || { count: 0, totalPrice: 0 };
        categoryMap.set(material.category, {
          count: existing.count + 1,
          totalPrice: existing.totalPrice + material.unit_price
        });
      });

      // Convert to array
      return Array.from(categoryMap.entries()).map(([category, stats]) => ({
        category,
        count: stats.count,
        averagePrice: Math.round((stats.totalPrice / stats.count) * 100) / 100
      }));
    } catch (error) {
      console.error('Error fetching category statistics:', error);
      return [];
    }
  }
};
