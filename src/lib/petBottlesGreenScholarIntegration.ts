// PET Bottles to Green Scholar Fund Integration Service
// This service handles the automatic contribution of 100% PET Bottles revenue to the Green Scholar Fund

import { supabase } from './supabase';
import { GreenScholarFundService } from './greenScholarFundService';

export class PetBottlesGreenScholarIntegration {
  /**
   * Process approved PET Bottles collection for Green Scholar Fund contribution
   * This should be called when a collection is approved in the Office App
   */
  static async processApprovedPetBottlesCollection(collectionId: string): Promise<boolean> {
    try {
      console.log('Processing approved PET Bottles collection for Green Scholar Fund:', collectionId);

      // Get collection details
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('id, user_id, weight_kg, material_type, status')
        .eq('id', collectionId)
        .single();

      if (collectionError) {
        console.error('Error fetching collection details:', collectionError);
        return false;
      }

      if (!collection) {
        console.error('Collection not found:', collectionId);
        return false;
      }

      // Check if it's PET (any variant) and approved
      const isPetMaterial = String(collection.material_type || '').toLowerCase().includes('pet');
      if (!isPetMaterial || collection.status !== 'approved') {
        console.log('Not approved PET Bottles collection, skipping Green Scholar Fund contribution');
        return false;
      }

      // Process the contribution
      const success = await (GreenScholarFundService as any).processPetBottlesContribution?.(
        collection.id,
        collection.user_id,
        collection.weight_kg,
        collection.material_type
      )
      // Fallback: if method not present, treat as computed-only path
      if (success === undefined) {
        console.warn('GreenScholarFundService.processPetBottlesContribution not available, skipping direct upsert.');
      }

      if (success) {
        console.log('PET Bottles contribution to Green Scholar Fund processed successfully');
        
        // Update user's contribution totals
        await this.updateUserContributionTotals(collection.user_id);
        
        return true;
      }

      return false;

    } catch (error) {
      console.error('Error processing PET Bottles collection for Green Scholar Fund:', error);
      return false;
    }
  }

  /**
   * Update user's contribution totals in the green_scholar_user_contributions table
   */
  static async updateUserContributionTotals(userId: string): Promise<void> {
    try {
      // Prefer unified_collections + collection_materials (PET-only) for approved/completed
      const { data: ucRows } = await supabase
        .from('unified_collections')
        .select('id')
        .in('status', ['approved', 'completed'])
        .eq('customer_id', userId);

      const collectionIds = (ucRows || []).map((r: any) => r.id);

      let totalPetAmount = 0;
      if (collectionIds.length > 0) {
        const { data: cmRows } = await supabase
          .from('collection_materials')
          .select('collection_id, quantity, unit_price, materials(name)')
          .in('collection_id', collectionIds);

        const petItems = (cmRows || []).filter((r: any) => (r.materials?.name || '').toLowerCase().includes('pet'));
        const petRate = 1.5; // R1.50 per kg for PET Bottles
        const totalWeight = petItems.reduce((s: number, r: any) => s + (Number(r.quantity) || 0), 0);
        totalPetAmount = totalWeight * petRate;
      }

      // No longer upserting any aggregate view/table here. Computation happens on read.
      console.log('Computed contribution totals (no upsert):', { userId, totalPetAmount });
    } catch (error) {
      console.error('Error computing user contribution totals:', error);
    }
  }

  /**
   * Get user's PET Bottles contribution summary
   */
  static async getUserPetBottlesSummary(userId: string): Promise<{
    totalBottles: number;
    totalWeight: number;
    totalValue: number;
    totalContributions: number;
  }> {
    try {
      // Use unified_collections (approved/completed) + collection_materials filtered to PET
      const { data: ucRows, error: ucErr } = await supabase
        .from('unified_collections')
        .select('id')
        .in('status', ['approved', 'completed'])
        .eq('customer_id', userId);

      if (ucErr) {
        console.error('Error fetching unified_collections for PET summary:', ucErr);
        return { totalBottles: 0, totalWeight: 0, totalValue: 0, totalContributions: 0 };
      }

      const collectionIds = (ucRows || []).map((r: any) => r.id);

      let totalWeight = 0;
      if (collectionIds.length > 0) {
        const { data: cmRows, error: cmErr } = await supabase
          .from('collection_materials')
          .select('collection_id, quantity, unit_price, materials(name)')
          .in('collection_id', collectionIds);

        if (cmErr) {
          console.error('Error fetching collection_materials for PET summary:', cmErr);
        } else {
          const petItems = (cmRows || []).filter((r: any) => (r.materials?.name || '').toLowerCase().includes('pet'));
          const petRate = 1.5; // R1.50 per kg for PET Bottles
          totalWeight = petItems.reduce((s: number, r: any) => s + (Number(r.quantity) || 0), 0);
        }
      }
      // If your schema doesn't track bottle_count, keep this as 0
      const totalBottles = 0;
      const petRate = 1.5; // R1.50 per kg for PET Bottles
      const totalValue = totalWeight * petRate;

      // Get total contributions to Green Scholar Fund (best-effort)
      let totalContributions = 0;
      // We no longer rely on transaction source_type; use computed PET total as fallback
      totalContributions = totalValue;

      return {
        totalBottles,
        totalWeight,
        totalValue,
        totalContributions
      };

    } catch (error) {
      console.error('Error getting user PET Bottles summary:', error);
      return { totalBottles: 0, totalWeight: 0, totalValue: 0, totalContributions: 0 };
    }
  }

  /**
   * Process all existing approved PET Bottles collections
   * This can be used to backfill contributions for existing data
   */
  static async processAllExistingPetBottlesCollections(): Promise<{
    processed: number;
    errors: number;
  }> {
    try {
      console.log('Processing all existing approved PET Bottles collections...');

      // Get all approved PET Bottles collections
      const { data: collections, error } = await supabase
        .from('collections')
        .select('id, user_id, weight_kg, material_type, status')
        .eq('material_type', 'PET Bottles')
        .eq('status', 'approved');

      if (error) {
        console.error('Error fetching PET Bottles collections:', error);
        return { processed: 0, errors: 1 };
      }

      if (!collections || collections.length === 0) {
        console.log('No approved PET Bottles collections found');
        return { processed: 0, errors: 0 };
      }

      let processed = 0;
      let errors = 0;

      // Process each collection
      for (const collection of collections) {
        try {
          const success = await this.processApprovedPetBottlesCollection(collection.id);
          if (success) {
            processed++;
          } else {
            errors++;
          }
        } catch (error) {
          console.error(`Error processing collection ${collection.id}:`, error);
          errors++;
        }
      }

      console.log(`Processed ${processed} PET Bottles collections, ${errors} errors`);
      return { processed, errors };

    } catch (error) {
      console.error('Error processing existing PET Bottles collections:', error);
      return { processed: 0, errors: 1 };
    }
  }
}
