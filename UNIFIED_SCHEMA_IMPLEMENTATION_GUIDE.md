# 🏗️ WozaMali Unified Schema Implementation Guide

## **Overview**

This guide will help you implement a clean, unified database schema that supports all three apps (Main App, Collector App, Office App) with a logical information flow and no RLS conflicts.

## **Why Unified Schema?**

- ✅ **No RLS conflicts** - Clean, consistent policies
- ✅ **Single source of truth** - All apps use same data
- ✅ **Real-time sync** - Changes propagate instantly
- ✅ **Easy maintenance** - One schema to manage
- ✅ **Better performance** - Optimized queries
- ✅ **Future-proof** - Easy to extend

## **Information Flow Architecture**

```
User Registration → Profile Creation → Collection Request → 
Collector Assignment → Pickup Execution → Payment Processing → Analytics
```

## **Implementation Steps**

### **Step 1: Backup Current Data**
```sql
-- Run this first to backup your existing data
-- (The migration script already includes this)
```

### **Step 2: Create Unified Schema**
```sql
-- Run the unified schema creation script
-- This creates all tables, policies, and functions
```

### **Step 3: Migrate Existing Data**
```sql
-- Run the migration script to preserve your data
-- This moves data from old tables to new unified structure
```

### **Step 4: Test All Apps**
- Test Main App (user registration, wallet, collections)
- Test Collector App (pickups, assignments)
- Test Office App (admin functions, analytics)

## **New Schema Structure**

### **Core Tables**
- `users` - Core user data (linked to Supabase auth)
- `user_profiles` - Extended profile information
- `user_addresses` - Multiple addresses per user
- `user_wallets` - Wallet and points system

### **Collection System**
- `collection_zones` - Geographic collection areas
- `collection_requests` - User-initiated requests
- `collection_pickups` - Actual pickup execution
- `pickup_items` - Materials collected
- `pickup_photos` - Verification photos

### **Materials & Pricing**
- `material_categories` - Material groupings
- `materials` - Available materials with pricing

### **Financial System**
- `transactions` - All financial transactions
- `withdrawal_requests` - Withdrawal processing

### **Administrative**
- `system_settings` - Global configuration
- `audit_logs` - All system changes
- `notifications` - User notifications

## **Key Features**

### **1. Automatic Tier Calculation**
- Tiers update automatically based on points
- Bronze: 0-199 points
- Silver: 200-499 points
- Gold: 500-999 points
- Platinum: 1000+ points

### **2. Real-time Wallet Updates**
- Wallet updates automatically when transactions occur
- Points and balance stay in sync
- All changes are logged

### **3. Role-based Access Control**
- Users can only see their own data
- Collectors see assigned pickups
- Admins see everything
- Clean RLS policies

### **4. Audit Trail**
- All changes are logged
- Complete transaction history
- System activity tracking

## **App Integration**

### **Main App (Users)**
- User registration and profiles
- Collection requests
- Wallet and points display
- Personal analytics

### **Collector App**
- View assigned pickups
- Execute collections
- Record materials collected
- Update pickup status

### **Office App**
- User management
- Collection oversight
- Financial processing
- System analytics

## **Migration Benefits**

### **Before (Current Issues)**
- ❌ RLS conflicts blocking access
- ❌ Multiple table structures
- ❌ Data inconsistency
- ❌ Complex maintenance

### **After (Unified Schema)**
- ✅ Clean, consistent access
- ✅ Single table structure
- ✅ Data consistency
- ✅ Easy maintenance

## **Testing Checklist**

### **Main App Tests**
- [ ] User registration works
- [ ] Profile creation works
- [ ] Wallet displays correctly
- [ ] Collection requests work
- [ ] Points and tiers calculate correctly

### **Collector App Tests**
- [ ] Login works
- [ ] Assigned pickups display
- [ ] Collection execution works
- [ ] Status updates work
- [ ] Photos upload correctly

### **Office App Tests**
- [ ] Admin login works
- [ ] User management works
- [ ] Collection oversight works
- [ ] Analytics display correctly
- [ ] Financial processing works

## **Rollback Plan**

If you need to rollback:
1. The old tables are backed up as `backup_*` tables
2. You can restore from backups if needed
3. The migration script preserves all data

## **Next Steps After Implementation**

1. **Test all three apps** thoroughly
2. **Update app code** to use new table names if needed
3. **Monitor performance** and optimize if necessary
4. **Train users** on any new features
5. **Document changes** for future reference

## **Support**

If you encounter any issues:
1. Check the migration verification queries
2. Review the audit logs for errors
3. Test individual app functions
4. Contact support if needed

---

**Ready to implement?** Run the scripts in order:
1. `create-unified-schema.sql`
2. `migrate-to-unified-schema.sql`
3. Test all apps
4. Enjoy your unified system! 🎉
