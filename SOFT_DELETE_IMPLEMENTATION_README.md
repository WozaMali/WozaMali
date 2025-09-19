# Soft Delete Implementation for WozaMali

This document describes the implementation of a soft delete system for transactions in the WozaMali platform. When super admins delete transactions, they are moved to a `deleted_transactions` table instead of being permanently removed, ensuring data integrity and the ability to restore records if needed.

## Overview

The soft delete system ensures that:
- When super admins delete collections/pickups, they are moved to `deleted_transactions` table
- Deleted transactions are excluded from all unified collections views
- Main App and Office App cannot see deleted transactions
- Super admins can view and restore deleted transactions
- All related data (points, revenue, kilograms) is preserved in the deleted records

## Database Schema Changes

### 1. New Table: `deleted_transactions`

```sql
CREATE TABLE public.deleted_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_collection_id uuid NOT NULL,
  original_wallet_transaction_id uuid,
  
  -- Collection data (from unified_collections)
  collection_code text,
  status text NOT NULL,
  customer_id uuid,
  collector_id uuid,
  pickup_address_id uuid,
  customer_name text,
  customer_email text,
  collector_name text,
  collector_email text,
  pickup_address text,
  weight_kg numeric(10,2),
  total_weight_kg numeric(10,2),
  computed_value numeric(12,2),
  total_value numeric(12,2),
  admin_notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  
  -- Wallet transaction data (if exists)
  wallet_user_id uuid,
  wallet_source_type text,
  wallet_source_id uuid,
  wallet_amount numeric(12,2),
  wallet_points integer,
  wallet_description text,
  wallet_created_at timestamptz,
  
  -- Deletion metadata
  deleted_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  deletion_reason text,
  
  -- Additional metadata for audit trail
  original_data jsonb,
  deletion_metadata jsonb DEFAULT '{}'::jsonb
);
```

### 2. Helper Functions

- `is_collection_deleted(p_collection_id uuid)` - Checks if a collection is soft deleted
- `soft_delete_collection(p_collection_id, p_deleted_by, p_deletion_reason)` - Performs soft delete
- `restore_deleted_collection(p_deleted_transaction_id, p_restored_by)` - Restores a deleted collection

### 3. Views

- `v_deleted_transactions` - Shows all deleted transactions (super admin only)
- `v_active_unified_collections` - Shows only active collections (excludes deleted)
- `v_active_wallet_transactions` - Shows only active wallet transactions (excludes deleted)

### 4. Updated RLS Policies

All existing RLS policies have been updated to exclude deleted transactions using the `is_collection_deleted()` function.

## Frontend Changes

### 1. New Service: `soft-delete-service.ts`

```typescript
// Soft delete a collection
const result = await softDeleteCollection(collectionId, 'Deletion reason');

// Get deleted transactions (super admin only)
const { data, error } = await getDeletedTransactions();

// Restore a deleted transaction
const result = await restoreDeletedTransaction(deletedTransactionId);
```

### 2. Updated Delete Buttons

- **Collections Page**: Updated to use `softDeleteCollection()` instead of `deleteCollectionDeep()`
- **Pickups Page**: Updated to use `softDeleteCollection()` instead of `deleteCollectionDeep()`
- **Confirmation Messages**: Updated to reflect soft delete behavior

## Installation Steps

### 1. Apply Database Schema

Run the following SQL file in your Supabase SQL editor:

```bash
# Apply the complete soft delete implementation
psql -h your-db-host -U your-username -d your-database -f schemas/fixed_soft_delete_implementation.sql
```

### 2. Update Frontend Code

The following files have been updated:
- `WozaMaliOffice/src/lib/soft-delete-service.ts` (new)
- `WozaMaliOffice/app/admin/AdminDashboardClient.tsx` (updated)
- `WozaMaliOffice/src/components/admin/PickupsPage.tsx` (updated)

### 3. Test the Implementation

Run the test script to verify everything works:

```bash
node test_soft_delete.js
```

## Usage

### For Super Admins

1. **Delete Collections/Pickups**: 
   - Click delete button on Collections or Pickups page
   - Confirm the soft delete action
   - Collection is moved to `deleted_transactions` table

2. **View Deleted Transactions**:
   ```typescript
   const { data: deletedTransactions } = await getDeletedTransactions();
   ```

3. **Restore Deleted Transactions**:
   ```typescript
   const result = await restoreDeletedTransaction(deletedTransactionId);
   ```

### For Regular Users

- Deleted transactions are automatically excluded from all views
- No changes to user experience
- Users cannot see or access deleted transactions

## Security

- Only users with `super_admin` role can access deleted transactions
- RLS policies ensure deleted transactions are hidden from all other users
- All soft delete operations are logged in the activity log

## Benefits

1. **Data Integrity**: No data is permanently lost
2. **Audit Trail**: Complete history of deletions and restorations
3. **Recovery**: Ability to restore accidentally deleted transactions
4. **Compliance**: Meets data retention requirements
5. **User Experience**: Seamless operation for end users

## Monitoring

- Check `deleted_transactions` table for soft-deleted records
- Monitor `activity_log` for deletion/restoration activities
- Use `v_deleted_transactions` view for reporting

## Troubleshooting

### Common Issues

1. **"v_deleted_transactions is not a table" error**:
   - This is fixed in the `fixed_soft_delete_implementation.sql` file
   - Views don't support RLS policies directly

2. **Permission denied errors**:
   - Ensure user has `super_admin` role
   - Check RLS policies are properly applied

3. **Collections still visible after deletion**:
   - Verify RLS policies are updated
   - Check if `is_collection_deleted()` function is working

### Testing

Use the provided test script to verify:
- All tables and functions exist
- RLS policies are working
- Views are accessible
- RPC functions are callable

## Future Enhancements

1. **Bulk Operations**: Add bulk delete/restore functionality
2. **Retention Policies**: Automatically purge old deleted records
3. **Advanced Filtering**: More sophisticated filtering for deleted transactions
4. **Export Functionality**: Export deleted transactions for analysis

## Support

For issues or questions regarding the soft delete implementation, refer to:
- Database logs in Supabase
- Activity log entries
- Console logs in the browser
- Test script output
