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
      const success = await GreenScholarFundService.processPetBottlesContribution(
        collection.id,
        collection.user_id,
        collection.weight_kg,
        collection.material_type
      );

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
      // Get user's PET Bottles contributions
      const { data: petCollections, error: petError } = await supabase
        .from('collections')
        .select('weight_kg')
        .eq('user_id', userId)
        .ilike('material_type', '%pet%')
        .eq('status', 'approved');

      if (petError) {
        console.error('Error fetching PET collections for user:', petError);
        return;
      }

      // Calculate total PET contribution
      const totalPetAmount = (petCollections || []).reduce((sum, collection) => {
        const weight = Number(collection.weight_kg) || 0;
        const petRate = 15; // R15 per kg for PET Bottles
        return sum + (weight * petRate);
      }, 0);

      // Get user's direct donations
      const { data: donations, error: donationError } = await supabase
        .from('green_scholar_donations')
        .select('amount')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (donationError) {
        console.error('Error fetching donations for user:', donationError);
        return;
      }

      const totalDonationAmount = (donations || []).reduce((sum, donation) => {
        return sum + (Number(donation.amount) || 0);
      }, 0);

      const totalContribution = totalPetAmount + totalDonationAmount;

      // Upsert user contribution totals
      const { error: upsertError } = await supabase
        .from('green_scholar_user_contributions')
        .upsert({
          user_id: userId,
          total_pet_amount: totalPetAmount,
          total_donation_amount: totalDonationAmount,
          total_contribution: totalContribution,
          updated_at: new Date().toISOString()
        });

      if (upsertError) {
        console.error('Error updating user contribution totals:', upsertError);
      } else {
        console.log('User contribution totals updated successfully:', {
          userId,
          totalPetAmount,
          totalDonationAmount,
          totalContribution
        });
      }

    } catch (error) {
      console.error('Error updating user contribution totals:', error);
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
      const { data: collections, error } = await supabase
        .from('collections')
        .select('weight_kg')
        .eq('user_id', userId)
        .ilike('material_type', '%pet%')
        .eq('status', 'approved');

      if (error) {
        console.error('Error fetching PET Bottles collections:', error);
        return { totalBottles: 0, totalWeight: 0, totalValue: 0, totalContributions: 0 };
      }

      const totalWeight = (collections || []).reduce((sum, c) => sum + (Number(c.weight_kg) || 0), 0);
      // If your schema doesn't track bottle_count, keep this as 0
      const totalBottles = 0;
      const petRate = 15; // R15 per kg for PET Bottles
      const totalValue = totalWeight * petRate;

      // Get total contributions to Green Scholar Fund (best-effort)
      let totalContributions = 0;
      try {
        const { data: contributions, error: contribError } = await supabase
          .from('green_scholar_transactions')
          .select('amount')
          .eq('source_type', 'pet_bottles_collection')
          .eq('transaction_type', 'contribution');
        if (!contribError && Array.isArray(contributions)) {
          totalContributions = (contributions || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
        } else {
          // If blocked by RLS, fall back to computed PET value (100% goes to fund)
          totalContributions = totalValue;
        }
      } catch (_e) {
        totalContributions = totalValue;
      }

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
