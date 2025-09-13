import { supabase } from './supabase';
import { calculateTotalCollectionValue, getTierFromWeight } from './material-pricing';
// serviceConfig removed: no external Office API calls; Supabase is the backend

export interface WorkingWalletData {
  id: string;
  user_id: string;
  current_points: number;
  total_points_earned: number;
  total_points_spent: number;
  last_updated: string;
  tier?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  status: string;
  created_at: string;
  last_login: string | null;
}

export interface CollectionSummary {
  total_pickups: number;
  total_materials_kg: number;
  total_value: number;
  total_points_earned: number;
}

export interface WorkingWalletInfo {
  wallet: WorkingWalletData | null;
  profile: UserProfile | null;
  collectionSummary: CollectionSummary;
  tier: string;
  balance: number;
  points: number;
  totalWeightKg: number;
  environmentalImpact: {
    co2_saved_kg: number;
    water_saved_liters: number;
    landfill_saved_kg: number;
  };
  nextTierRequirements: {
    nextTier: string | null;
    weightNeeded: number;
    progressPercentage: number;
  };
}

export class WorkingWalletService {
  static async getWalletData(userId: string): Promise<WorkingWalletInfo> {
    try {
      console.log('WorkingWalletService: Fetching wallet data for user:', userId);
      
      if (!userId) {
        console.error('WorkingWalletService: No userId provided');
        return this.getEmptyWalletInfo();
      }

      // Get user data from auth.users
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user || user.id !== userId) {
        console.error('WorkingWalletService: Auth error or user mismatch:', authError);
        return this.getEmptyWalletInfo();
      }

      // Create profile from auth user data
      const profile: UserProfile = {
        id: user.id,
        user_id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        phone: user.user_metadata?.phone || null,
        role: 'member',
        status: 'active',
        created_at: user.created_at,
        last_login: user.last_sign_in_at || null
      };

      console.log('WorkingWalletService: Found user profile from auth');

      // Use Supabase-only path for wallet computation to avoid CORS issues in dev

      // Fallback: Get data from Supabase unified/legacy
      let walletData: WorkingWalletData | null = null;
      let collectionSummary: CollectionSummary;
      // Track the displayable wallet money balance across data sources
      let moneyBalance = 0;
      // Aggregates from wallet_update_queue when accessible
      let queueTotalValue = 0;
      let queueTotalKg = 0;
      let queueCount = 0;
      
      try {
        console.log('WorkingWalletService: Aggregating from wallet_update_queue (if allowed)...');

        // Resolve auth email to match queue
        const authEmail = (user.email || '').toLowerCase();
        try {
          const { data: q, error: queueError } = await supabase
            .from('wallet_update_queue')
            .select('resident_email, value, weight_kg, status')
            .eq('resident_email', authEmail);
          
          // Handle case where table doesn't exist or RLS blocks access
          if (queueError && (queueError.code === '42P01' || queueError.code === '42501')) {
            console.log('WorkingWalletService: wallet_update_queue table not accessible, skipping...');
          } else if (!queueError && Array.isArray(q)) {
            const rows = q;
            const approved = rows.filter((r: any) => ['approved','completed'].includes(String(r.status || '').toLowerCase()));
            if (approved.length > 0) {
              queueTotalValue = approved.reduce((s: number, r: any) => s + (Number(r.value) || 0), 0);
              queueTotalKg = approved.reduce((s: number, r: any) => s + (Number(r.weight_kg) || 0), 0);
              queueCount = approved.length;
            }
          }
        } catch (_e) {
          console.log('WorkingWalletService: Error accessing wallet_update_queue, skipping...');
        }

        console.log('WorkingWalletService: Computing wallet from queue + withdrawals...');

        // Try to get wallet data from unified user_wallets table
        const { data: walletTableData, error: walletError } = await supabase
          .from('user_wallets')
          .select('current_points, total_points_earned, total_points_spent')
          .eq('user_id', userId)
          .single();

        console.log('WorkingWalletService: Wallet data from unified user_wallets table:', {
          walletTableData,
          walletError,
          hasWalletData: !!walletTableData,
          currentPoints: walletTableData?.current_points,
          totalPointsEarned: walletTableData?.total_points_earned,
          errorMessage: walletError?.message
        });

        // Prefer authoritative totals from unified_collections (approved/completed)
        // Build a permissive OR condition to satisfy typical RLS setups
        let totalApprovedRevenue = queueTotalValue;
        let totalWeight = queueTotalKg;
        let totalPickups = queueCount;
        try {
          const orParts: string[] = [];
          if (userId) orParts.push(`customer_id.eq.${userId}`);
          if ((user.email || '').toLowerCase()) orParts.push(`customer_email.eq.${(user.email || '').toLowerCase()}`);
          if (userId) orParts.push(`created_by.eq.${userId}`);

          const { data: ucRowsRaw, error: ucErr } = await supabase
            .from('unified_collections')
            .select('id, collection_code, total_value, computed_value, total_weight_kg, status, created_at, updated_at, customer_id, customer_email, created_by')
            .in('status', ['approved','completed'])
            .or(orParts.join(','))
            .order('updated_at', { ascending: false });

          if (!ucErr) {
            const rows = Array.isArray(ucRowsRaw) ? ucRowsRaw : [];
            if (rows.length > 0) {
              // Derive wallet-approved revenue from collection_materials EXCLUDING PET items
              const ids = rows.map((r: any) => r.id).filter(Boolean);
              let approvedRevenue = 0;
              try {
                if (ids.length > 0) {
                  const { data: mats } = await supabase
                    .from('collection_materials')
                    .select('collection_id, quantity, unit_price, materials(name)')
                    .in('collection_id', ids);
                  if (Array.isArray(mats)) {
                    approvedRevenue = mats.reduce((sum: number, m: any) => {
                      const name = String(m?.materials?.name || '').toLowerCase();
                      const isPet = name.includes('pet');
                      const qty = Number(m.quantity) || 0;
                      const price = Number(m.unit_price) || 0;
                      return isPet ? sum : sum + (qty * price);
                    }, 0);
                  }
                }
              } catch (_em) {
                // Fallback: if materials query fails, use stored totals (may include PET)
                approvedRevenue = rows.reduce((s: number, r: any) => s + (Number((r.computed_value ?? r.total_value) || 0) || 0), 0);
              }

              const weightKg = rows.reduce((s: number, r: any) => s + (Number(r.total_weight_kg) || 0), 0);
              totalApprovedRevenue = approvedRevenue;
              totalWeight = weightKg;
              totalPickups = rows.length;
            }
          }
        } catch (_e) {
          // If unified query fails due to RLS or missing table, retain any queue-derived totals
        }

        // Calculate total approved/processed withdrawals (prefer withdrawal_requests to avoid missing legacy table)
        let totalWithdrawals = 0;
        try {
          const { data: wrRows, error: wrErr } = await supabase
            .from('withdrawal_requests')
            .select('amount, status')
            .eq('user_id', userId)
            .in('status', ['approved', 'processing', 'completed']);
          if (!wrErr && Array.isArray(wrRows)) {
            totalWithdrawals = wrRows.reduce((sum, w: any) => sum + (Number(w.amount) || 0), 0);
          } else {
            // Fallback to legacy withdrawals table
            const { data: withdrawalsV1 } = await supabase
              .from('withdrawals')
              .select('amount, status')
              .eq('user_id', userId)
              .in('status', ['approved', 'processed', 'completed']);
            totalWithdrawals = (withdrawalsV1 || []).reduce((sum, w: any) => sum + (Number(w.amount) || 0), 0);
          }
        } catch (_e) {
          totalWithdrawals = 0;
        }

        // Calculate total used (all spending including withdrawals, rewards, donations, etc.)
        let totalUsed = totalWithdrawals; // Start with withdrawals
        
        // Add other types of spending from wallet_transactions
        try {
          const { data: spendingTransactions, error: spendingErr } = await supabase
            .from('wallet_transactions')
            .select('amount, source_type')
            .eq('user_id', userId)
            .lt('amount', 0); // Negative amounts are spending
          
          if (!spendingErr && Array.isArray(spendingTransactions)) {
            const otherSpending = spendingTransactions.reduce((sum, t: any) => sum + Math.abs(Number(t.amount) || 0), 0);
            totalUsed += otherSpending;
          }
        } catch (_e) {
          // If wallet_transactions table doesn't exist or has issues, just use withdrawals
        }

        // Use queue/unified-by-email totals for points (1kg = 1 point)
        const pointsBalance = Math.floor(totalWeight);
        const totalPointsEarned = pointsBalance;
        
        // Display money balance: total earned minus total used (withdrawals + other spending)
        totalApprovedRevenue = Number(totalApprovedRevenue.toFixed(2));
        moneyBalance = Math.max(0, totalApprovedRevenue - totalUsed);
        moneyBalance = Number(moneyBalance.toFixed(2));

        // No legacy wallet or points-to-cash fallbacks
        const tier = getTierFromWeight(totalWeight);
        
        // Create wallet data from queue/unified aggregates
        const walletDataObj = {
          id: user.id,
          user_id: userId,
          current_points: pointsBalance,
          total_points_earned: totalPointsEarned,
          total_points_spent: walletTableData?.total_points_spent || 0,
          last_updated: new Date().toISOString(),
          tier: tier
        };
        
        // Create collection summary from queue/unified aggregates
        collectionSummary = {
          total_pickups: totalPickups,
          total_materials_kg: Number(totalWeight.toFixed(2)),
          total_value: Number(totalApprovedRevenue.toFixed(2)),
          total_points_earned: pointsBalance
        };

        // Assign wallet data
        walletData = walletDataObj;

        console.log('WorkingWalletService: Wallet computed from queue + total used:', {
          moneyBalance,
          totalApprovedRevenue,
          totalWithdrawals,
          totalUsed,
          totalWeight,
          totalPickups,
          pointsBalance,
          totalPointsEarned,
          tier,
          walletData: walletData,
          pickupsSummary: {
            totalPickups: totalPickups,
            totalWeight: totalWeight,
            totalApprovedRevenue: totalApprovedRevenue,
            totalUsed: totalUsed,
            netBalance: moneyBalance
          }
        });
        
      } catch (err) {
        console.log('WorkingWalletService: Unified schema query failed, using fallback:', err);
        
        // Fallback to empty data if unified schema is not available
        walletData = {
          id: user.id,
          user_id: user.id,
          current_points: 0,
          total_points_earned: 0,
          total_points_spent: 0,
          last_updated: new Date().toISOString(),
          tier: 'bronze'
        };
        
        collectionSummary = {
          total_pickups: 0,
          total_materials_kg: 0,
          total_value: 0,
          total_points_earned: 0
        };
      }

      // Use tier from wallet data or calculate from weight
      const finalTier = walletData?.tier || getTierFromWeight(collectionSummary.total_materials_kg);
      
      // Calculate environmental impact
      const environmentalImpact = {
        co2_saved_kg: collectionSummary.total_materials_kg * 0.5,
        water_saved_liters: collectionSummary.total_materials_kg * 10,
        landfill_saved_kg: collectionSummary.total_materials_kg * 0.8
      };

      // Calculate next tier requirements based on weight
      const nextTierRequirements = this.calculateNextTierRequirementsByWeight(collectionSummary.total_materials_kg);

      const result: WorkingWalletInfo = {
        wallet: walletData,
        profile: profile,
        collectionSummary: collectionSummary,
        tier: finalTier,
        // Show the best-available money balance (approved collections → wallets table → points conversion)
        balance: moneyBalance,
        points: walletData?.current_points || 0,
        totalWeightKg: collectionSummary.total_materials_kg,
        environmentalImpact: environmentalImpact,
        nextTierRequirements: nextTierRequirements
      };

      console.log('WorkingWalletService: Wallet data retrieved successfully:', {
        balance: result.balance,
        points: result.points,
        tier: result.tier,
        totalWeightKg: result.totalWeightKg,
        totalPickups: result.collectionSummary.total_pickups
      });

      return result;

    } catch (error) {
      console.error('WorkingWalletService: Error fetching wallet data:', error);
      return this.getEmptyWalletInfo();
    }
  }

  private static calculateTier(points: number): string {
    // This method is now deprecated - use getTierFromWeight instead
    if (points >= 1000) return 'platinum';
    if (points >= 500) return 'gold';
    if (points >= 100) return 'silver';
    return 'bronze';
  }

  private static calculateNextTierRequirementsByWeight(currentWeightKg: number): {
     nextTier: string | null;
     weightNeeded: number;
     progressPercentage: number;
   } {
    const tiers = [
      { name: 'bronze', minWeight: 0 },
      { name: 'silver', minWeight: 50 },
      { name: 'gold', minWeight: 150 },
      { name: 'platinum', minWeight: 300 },
      { name: 'diamond', minWeight: 500 }
    ];

    // Find current tier index as the last tier whose minWeight <= current
    let currentIdx = 0;
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (currentWeightKg >= tiers[i].minWeight) { currentIdx = i; break; }
    }
    const next = currentIdx < tiers.length - 1 ? tiers[currentIdx + 1] : null;
    if (!next) {
      return { nextTier: null, weightNeeded: 0, progressPercentage: 100 };
    }

    const currentMin = tiers[currentIdx].minWeight;
    const nextMin = next.minWeight;
    const weightNeeded = Math.max(0, nextMin - currentWeightKg);
    const denom = Math.max(1, nextMin - currentMin);
    const progressPercentage = Math.min(100, Math.max(0, ((currentWeightKg - currentMin) / denom) * 100));

    return { nextTier: next.name, weightNeeded, progressPercentage };
  }

  private static getEmptyWalletInfo(): WorkingWalletInfo {
    return {
      wallet: null,
      profile: null,
      collectionSummary: {
        total_pickups: 0,
        total_materials_kg: 0,
        total_value: 0,
        total_points_earned: 0
      },
      tier: 'bronze',
      balance: 0,
      points: 0,
      totalWeightKg: 0,
      environmentalImpact: {
        co2_saved_kg: 0,
        water_saved_liters: 0,
        landfill_saved_kg: 0
      },
      nextTierRequirements: {
        nextTier: 'silver',
        weightNeeded: 20, // 20kg to reach silver tier
        progressPercentage: 0
      }
    };
  }

  static async refreshWalletData(userId: string): Promise<WorkingWalletInfo> {
    return this.getWalletData(userId);
  }

  /**
   * Get transaction history for a user (for History page)
   * Returns all approved collections as transactions, sorted by date (latest first)
   */
  static async getTransactionHistory(userId: string): Promise<any[]> {
    try {
      console.log('WorkingWalletService: Fetching transaction history for user:', userId);
      
      if (!userId) {
        console.error('WorkingWalletService: No userId provided for transaction history');
        return [];
      }

      // Resolve auth user for email-based sources (wallet_update_queue)
      let authEmail: string | null = null;
      try {
        const { data: authData } = await supabase.auth.getUser();
        const rawEmail = authData?.user?.email || authData?.user?.user_metadata?.email || null;
        authEmail = rawEmail ? String(rawEmail).toLowerCase().trim() : null;
      } catch (_e) {
        authEmail = null;
      }

      // Resolve unified customer_id (user_profiles.id) from auth user id
      let profileId: string | null = null;
      try {
        const { data: prof } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        profileId = (prof as any)?.id || null;
      } catch (_e) {
        profileId = null;
      }

      // 0) Skip wallet_update_queue completely to avoid REST errors; rely on unified_collections + withdrawals
      let queuedTransactions: any[] = [];

      // 1) Preferred: unified_collections with canonical totals
      let unifiedTransactions: any[] = [];
      try {
        // Build a single OR condition that matches typical RLS policies
        const orParts: string[] = [];
        if (userId) orParts.push(`customer_id.eq.${userId}`);
        if (authEmail) orParts.push(`customer_email.eq.${authEmail}`);
        if (userId) orParts.push(`created_by.eq.${userId}`);

        const { data: rowsRaw } = await supabase
          .from('unified_collections')
          .select('id, collection_code, total_value, computed_value, total_weight_kg, status, created_at, updated_at, customer_id, customer_email, created_by')
          .in('status', ['approved','completed'])
          .or(orParts.join(','))
          .order('updated_at', { ascending: false });

        const rows = Array.isArray(rowsRaw) ? rowsRaw : [];

        // Look up top material per collection (by quantity) for display
        let topMaterialByCollection: Record<string, string> = {};
        try {
          const ids = rows.map((r: any) => r.id).filter(Boolean);
          if (ids.length > 0) {
            const { data: mats } = await supabase
              .from('collection_materials')
              .select('collection_id, quantity, materials(name)')
              .in('collection_id', ids);
            const byCol: Record<string, { name: string; qty: number }> = {};
            (Array.isArray(mats) ? mats : []).forEach((m: any) => {
              const cid = String(m.collection_id);
              const name = m.materials?.name || 'Mixed Materials';
              const qty = Number(m.quantity) || 0;
              const cur = byCol[cid];
              if (!cur || qty > cur.qty) byCol[cid] = { name, qty };
            });
            Object.keys(byCol).forEach(cid => { topMaterialByCollection[cid] = byCol[cid].name; });
          }
        } catch (_eMat) {
          topMaterialByCollection = {};
        }

        unifiedTransactions = rows.map((r: any) => ({
          id: r.id,
          type: 'credit',
          amount: Number((r.computed_value ?? r.total_value) || 0) || 0, // full total (may include PET)
          material_type: topMaterialByCollection[String(r.id)] || 'Mixed Materials',
          kgs: Number(r.total_weight_kg || 0) || 0,
          status: r.status,
          created_at: r.created_at,
          approved_at: r.updated_at,
          updated_at: r.updated_at,
          reference: r.id,
          reference_code: r.collection_code || null,
          source_type: 'unified_collection',
          description: `${topMaterialByCollection[String(r.id)] || 'Mixed Materials'} approved`
        }));
      } catch (_e) {
        unifiedTransactions = [];
      }

      // 2) Remove legacy synthetic fallback from collections to avoid showing mock data
      const legacyTransactions: any[] = [];

      // Align with canonical source: if a unified collection was deleted, drop any queue-only entries for it
      if (unifiedTransactions.length > 0 && queuedTransactions.length > 0) {
        const validUnifiedIds = new Set<string>(
          unifiedTransactions.map((t: any) => String(t.reference || t.id))
        );
        queuedTransactions = queuedTransactions.filter((q: any) =>
          validUnifiedIds.has(String(q.reference || q.id))
        );
      }

      // 3) Add withdrawals (pending/approved/etc.) as negative transactions
      let withdrawalTransactions: any[] = [];
      try {
        const { data: wr } = await supabase
          .from('withdrawal_requests')
          .select('id, amount, status, created_at, updated_at')
          .eq('user_id', userId)
          .in('status', ['pending','approved','processing','completed'])
          .order('updated_at', { ascending: false });
        const rows = Array.isArray(wr) ? wr : [];
        withdrawalTransactions = rows.map((w: any) => {
          const status = String(w.status || '').toLowerCase();
          const statusLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
          return {
            id: w.id,
            type: 'debit',
            amount: -Math.abs(Number(w.amount) || 0),
            material_type: undefined,
            kgs: 0,
            status: status,
            created_at: w.created_at,
            approved_at: w.updated_at || w.created_at,
            updated_at: w.updated_at || w.created_at,
            reference: w.id,
            reference_code: null,
            source_type: 'withdrawal',
            description: `Withdrawal ${statusLabel}`
          };
        });
      } catch (_e) {
        withdrawalTransactions = [];
      }

      // Merge & dedupe (prefer unified by reference_code)
      const mergedMap = new Map<string, any>();
      [...queuedTransactions, ...unifiedTransactions, ...withdrawalTransactions, ...legacyTransactions].forEach((tx: any) => {
        const key = String(tx.reference || tx.reference_code || tx.id);
        if (!mergedMap.has(key)) mergedMap.set(key, tx);
      });
      const merged = Array.from(mergedMap.values()).sort((a, b) => {
        const ad = new Date(a.approved_at || a.updated_at || a.created_at).getTime();
        const bd = new Date(b.approved_at || b.updated_at || b.created_at).getTime();
        return bd - ad;
      });

      console.log('WorkingWalletService: Transaction history retrieved:', {
        userId,
        profileId,
        totalTransactions: merged.length,
        totalValue: merged.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
        unifiedCount: unifiedTransactions.length,
        queueCount: queuedTransactions.length
      });

      return merged;

    } catch (error) {
      const msg = (error as any)?.message || (typeof error === 'string' ? error : '');
      if (msg) {
        console.warn('WorkingWalletService: Error fetching transaction history (returning empty):', msg);
      }
      return [];
    }
  }

  static async getNonPetApprovedTotal(userId: string): Promise<number> {
    try {
      if (!userId) return 0;
      // Fetch approved/completed collections for the user
      const { data: ucRows } = await supabase
        .from('unified_collections')
        .select('id')
        .in('status', ['approved','completed'])
        .eq('customer_id', userId);
      const ids = (Array.isArray(ucRows) ? ucRows : []).map((r: any) => r.id).filter(Boolean);
      if (ids.length === 0) return 0;

      // Sum non-PET amounts from collection_materials
      const { data: mats } = await supabase
        .from('collection_materials')
        .select('collection_id, quantity, unit_price, materials(name)')
        .in('collection_id', ids);
      const total = (Array.isArray(mats) ? mats : []).reduce((sum: number, m: any) => {
        const name = String(m?.materials?.name || '').toLowerCase();
        const isPet = name.includes('pet');
        const qty = Number(m.quantity) || 0;
        const price = Number(m.unit_price) || 0;
        return isPet ? sum : sum + (qty * price);
      }, 0);
      return Number((total || 0).toFixed(2));
    } catch (_e) {
      return 0;
    }
  }
}

