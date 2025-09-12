# Fix Computed Value on Pickups Page

## Problem
The `computed_value` field in the `unified_collections` table is not automatically updating when `collection_materials` are added, updated, or deleted. This causes the Pickups page to show incorrect values that don't reflect the actual transaction amounts.

## Solution
We need to create database triggers that automatically recalculate the `computed_value` whenever `collection_materials` change.

## Steps to Fix

### 1. Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your WozaMali project
3. Navigate to **SQL Editor** in the left sidebar

### 2. Run the Fix Script
1. Copy the entire contents of `fix-computed-value-supabase.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the script

### 3. Verify the Fix
After running the script, you should see output like:
```
✅ COMPUTED_VALUE FIX COMPLETE
Triggers created to automatically update computed_value when collection_materials change
All existing collections have been recalculated
```

### 4. Test the Fix
1. Go to your Pickups page in the admin dashboard
2. Check that the values now reflect the actual transaction amounts
3. Try adding/editing collection materials to verify the values update automatically

## What the Fix Does

### 1. Creates Trigger Function
- `update_collection_totals()` - Automatically recalculates `computed_value` and `total_weight_kg` when collection materials change
- Handles PET materials (100% to Green Scholar Fund) vs other materials (100% to wallet)
- Updates both `computed_value` and `total_value` fields

### 2. Creates Database Triggers
- `update_collection_totals_trigger` - Fires on INSERT, UPDATE, DELETE of `collection_materials`
- Automatically calls the trigger function whenever materials are modified

### 3. Recalculates Existing Data
- `recalculate_all_collection_totals()` - Updates all existing collections with correct values
- `recalculate_collection_total(collection_id)` - Updates a specific collection

### 4. Verification Queries
- Shows trigger status
- Displays sample collections with their computed values
- Provides summary statistics

## Expected Results

After running the fix:

1. **Automatic Updates**: When collectors add/edit materials, the `computed_value` updates immediately
2. **Accurate Totals**: The Pickups page shows correct values based on actual material quantities and prices
3. **PET Handling**: PET materials contribute to Green Scholar Fund, others to wallet
4. **Real-time Sync**: Changes are reflected immediately in the admin dashboard

## Troubleshooting

### If the script fails:
1. Check that you have admin permissions in Supabase
2. Ensure the `unified_collections` and `collection_materials` tables exist
3. Verify the `materials` table has the correct structure

### If values still seem wrong:
1. Check that material prices are set correctly in the `materials` table
2. Verify that `collection_materials` have correct `quantity` and `unit_price` values
3. Run the recalculation function manually for specific collections

### To manually recalculate a specific collection:
```sql
SELECT * FROM public.recalculate_collection_total('your-collection-id-here');
```

## Files Created
- `fix-computed-value-supabase.sql` - Main fix script for Supabase SQL Editor
- `fix-computed-value-triggers.sql` - Alternative script (for direct PostgreSQL)
- `test-computed-value-fix.js` - Test script to verify the fix
- `COMPUTED_VALUE_FIX_GUIDE.md` - This guide

## Next Steps
1. Run the SQL script in Supabase
2. Test the Pickups page to verify values are correct
3. Monitor that new collections automatically calculate correct values
4. Consider adding similar triggers for other value calculations if needed
