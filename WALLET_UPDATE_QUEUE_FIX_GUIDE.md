# Fix Wallet Update Queue and Transaction History Issue

## Problem
The user `legacymusicsa@gmail.com` is not seeing their previous transactions on the History Page in the Main App. The error shows:

```
GET https://mljtjntkddwkcjixkyuy.supabase.co/rest/v1/wallet_update_queue?select=*&or=%28resident_email.eq.legacymusicsa%40gmail.com%2Cemail.eq.legacymusicsa%40gmail.com%29 400 (Bad Request)
```

This indicates that the `wallet_update_queue` table either doesn't exist or has permission issues.

## Root Cause
1. The `wallet_update_queue` table is missing from the database
2. The `WorkingWalletService` is trying to query this table for transaction history
3. When the table doesn't exist, it causes a 400 Bad Request error
4. This prevents the History page from showing any transactions

## Solution

### Step 1: Run the Database Fix Script

**Option A: Complete Version (Recommended)**
1. Open your **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the entire contents of `fix-wallet-update-queue-complete.sql`
3. Click **Run** to execute the script

**Option B: Simple Version (If you get foreign key errors)**
If you encounter the error "column 'user_id' does not exist" or foreign key constraint issues:
1. Open your **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the entire contents of `fix-wallet-update-queue-simple.sql`
3. Click **Run** to execute the script

The simple version creates the table without foreign key constraints to avoid dependency issues.

This script will:
- ✅ Create the `wallet_update_queue` table with proper structure
- ✅ Set up RLS policies for security
- ✅ Migrate existing approved collections to the queue
- ✅ Create triggers to automatically sync new approved collections
- ✅ Verify the data for `legacymusicsa@gmail.com`

### Step 2: Verify the Fix
After running the script, you should see output like:
```
✅ WALLET_UPDATE_QUEUE FIX COMPLETE
Table created with proper structure and RLS policies
Existing approved collections migrated to wallet_update_queue
Transaction history should now work for all users including legacymusicsa@gmail.com
```

### Step 3: Test the History Page
1. Go to the Main App History page
2. Log in as `legacymusicsa@gmail.com`
3. Verify that previous transactions now appear
4. Check that the 400 error is gone from the browser console

## What the Fix Does

### 1. Creates Missing Table
```sql
CREATE TABLE IF NOT EXISTS public.wallet_update_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_id UUID,
    resident_email TEXT,
    email TEXT,
    material_name TEXT,
    material TEXT,
    weight_kg DECIMAL(10,2),
    value DECIMAL(10,2),
    status TEXT DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Sets Up Security
- Enables Row Level Security (RLS)
- Creates permissive policies for authenticated users
- Adds proper indexes for performance

### 3. Migrates Existing Data
- Finds all approved collections in `unified_collections`
- Creates corresponding entries in `wallet_update_queue`
- Ensures `legacymusicsa@gmail.com` transactions are included

### 4. Creates Automation
- Trigger function to automatically add new approved collections
- Sync function to manually update the queue
- Ensures future transactions are automatically tracked

### 5. Improves Error Handling
- Updated `WorkingWalletService` to check if table exists before querying
- Better error handling for missing tables
- Graceful fallback when table is not accessible

## Expected Results

After applying the fix:

1. **No More 400 Errors**: The browser console should be clean
2. **Transaction History Visible**: `legacymusicsa@gmail.com` should see their previous transactions
3. **Real-time Updates**: New approved collections automatically appear in history
4. **Proper Data**: All transaction amounts and dates should be accurate

## Verification Queries

The script includes verification queries that will show:
- Table structure confirmation
- Data migration summary
- Specific data for `legacymusicsa@gmail.com`
- Sample entries from the queue

## Troubleshooting

### If the script fails:
1. Check that you have admin permissions in Supabase
2. Ensure the `unified_collections` table exists and has data
3. Verify that `legacymusicsa@gmail.com` has approved collections

### If transactions still don't appear:
1. Check the browser console for any remaining errors
2. Verify that the user has approved collections in `unified_collections`
3. Run the sync function manually: `SELECT public.sync_approved_collections_to_wallet_queue();`

### To manually check user data:
```sql
-- Check unified_collections for the user
SELECT * FROM public.unified_collections 
WHERE customer_email = 'legacymusicsa@gmail.com';

-- Check wallet_update_queue for the user
SELECT * FROM public.wallet_update_queue 
WHERE email = 'legacymusicsa@gmail.com' 
   OR resident_email = 'legacymusicsa@gmail.com';
```

## Files Modified
- `fix-wallet-update-queue-complete.sql` - Main database fix script
- `src/lib/workingWalletService.ts` - Improved error handling
- `WALLET_UPDATE_QUEUE_FIX_GUIDE.md` - This guide

## Next Steps
1. Run the SQL script in Supabase
2. Test the History page for `legacymusicsa@gmail.com`
3. Monitor that new collections automatically appear in history
4. Consider adding similar fixes for other missing tables if needed
