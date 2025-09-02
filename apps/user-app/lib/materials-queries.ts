// Woza Mali User App Materials Queries
// CRUD operations for materials table - User App specific

import { supabase } from '../../../lib/supabase';
import type { Material } from '../types/database.types';

// ============================================================================
// MATERIAL OPERATIONS (User App)
// ============================================================================

export const materialQueries = {
  // Get all active materials (users can only see active materials)
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
        .eq('is_active', true)
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
// MATERIAL UTILITIES (User App)
// ============================================================================

export const materialUtils = {
  // Calculate total value for a list of materials with quantities
  calculateTotalValue(materials: Array<{ material: Material; quantity: number }>): number {
    return materials.reduce((total, item) => {
      return total + (item.material.unit_price * item.quantity);
    }, 0);
  },

  // Get materials grouped by category
  groupByCategory(materials: Material[]): Record<string, Material[]> {
    return materials.reduce((groups, material) => {
      const category = material.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(material);
      return groups;
    }, {} as Record<string, Material[]>);
  },

  // Get top materials by price
  getTopByPrice(materials: Material[], limit: number = 5): Material[] {
    return materials
      .sort((a, b) => b.unit_price - a.unit_price)
      .slice(0, limit);
  },

  // Get cheapest materials
  getCheapest(materials: Material[], limit: number = 5): Material[] {
    return materials
      .sort((a, b) => a.unit_price - b.unit_price)
      .slice(0, limit);
  },

  // Format price for display
  formatPrice(price: number): string {
    return `R${price.toFixed(2)}`;
  },

  // Get material display name with price
  getDisplayName(material: Material): string {
    return `${material.name} (${this.formatPrice(material.unit_price)}/${material.unit})`;
  }
};
