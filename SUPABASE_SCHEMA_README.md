# WozaMali Supabase Schema Update Guide

## 📋 Overview

This repository contains a comprehensive Supabase database schema update script (`supabase-schema-update.sql`) that provides the complete database structure for the WozaMali recycling application. This script can be used to update any Supabase project to match the current schema.

## 🚀 Quick Start

### 1. **Run the Schema Update Script**

```sql
-- In your Supabase SQL Editor, run:
\i supabase-schema-update.sql
```

Or copy and paste the entire script content into the Supabase SQL Editor.

### 2. **Verify Installation**

Check that the schema version was recorded:

```sql
SELECT * FROM schema_versions ORDER BY applied_at DESC LIMIT 1;
```

## 🏗️ What This Script Creates

### **🆕 New Tables Added**

#### **Withdrawal System**
- `withdrawal_requests` - User withdrawal requests with banking details
- `withdrawal_banks` - Reference table for South African banks and branch codes

#### **Green Scholar Fund**
- `green_scholar_fund_donations` - Monetary donations to the fund
- `green_scholar_fund_bottles` - PET/Plastic bottle collections
- `green_scholar_fund_stats` - Real-time fund statistics
- `green_scholar_fund_applications` - Student support applications

#### **Enhanced Wallet System**
- `enhanced_wallets` - Advanced wallet with weight tracking
- `user_metrics` - Environmental impact calculations
- `materials` - Updated recycling material rates
- `pickups` - User recycling pickup records

### **🔧 Enhanced Features**

- **Automatic Calculations** - Environmental impact metrics
- **Real-time Updates** - Fund statistics and wallet balances
- **Comprehensive RLS** - Row Level Security for all tables
- **Performance Indexes** - Optimized database queries
- **Data Views** - Simplified data access patterns

## 📊 Database Schema Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   auth.users    │    │ enhanced_wallets │    │ user_metrics    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│withdrawal_      │    │   materials      │    │    pickups      │
│requests         │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│withdrawal_      │    │green_scholar_    │    │green_scholar_   │
│banks            │    │fund_donations    │    │fund_bottles     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                       │
                                │                       │
                                ▼                       ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │green_scholar_    │    │green_scholar_   │
                       │fund_stats        │    │fund_applications│
                       └──────────────────┘    └─────────────────┘
```

## 🔐 Security Features

### **Row Level Security (RLS)**
All tables have RLS enabled with appropriate policies:

- **Users can only access their own data**
- **Bank information is read-only for all authenticated users**
- **Fund statistics are publicly viewable**
- **Materials and rates are publicly accessible**

### **Policy Examples**
```sql
-- Users can only see their own withdrawal requests
CREATE POLICY "Users can view their own withdrawal requests" 
ON withdrawal_requests FOR SELECT 
USING (auth.uid() = user_id);
```

## 📈 Performance Optimizations

### **Database Indexes**
- User ID indexes for fast user data retrieval
- Status indexes for filtering
- Date indexes for time-based queries
- Category indexes for material filtering

### **Views for Common Queries**
- `current_fund_status` - Current month's fund progress
- `user_wallet_summary` - Complete user wallet overview

## 🔄 Automatic Functions

### **Triggers and Functions**
- **Wallet Metrics Updates** - Automatic calculation of environmental impact
- **Fund Statistics** - Real-time updates of donation and bottle values
- **User Contributions** - Automatic aggregation of user recycling data

### **Example Function**
```sql
-- Automatically updates user metrics when pickups change
CREATE TRIGGER trigger_update_user_metrics
  AFTER INSERT OR UPDATE OR DELETE ON pickups
  FOR EACH ROW EXECUTE FUNCTION update_wallet_metrics();
```

## 📱 Frontend Integration

### **TypeScript Interfaces**
Use these interfaces in your frontend code:

```typescript
interface WithdrawalRequest {
  id?: string;
  user_id: string;
  owner_name: string;
  account_type: string;
  bank_name: string;
  bank_code: string;
  branch_code: string;
  account_number: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
}

interface BankInfo {
  id: string;
  bank_name: string;
  bank_code: string;
  branch_code: string;
}
```

### **API Endpoints**
The schema supports these common operations:

```typescript
// Get user's withdrawal requests
const { data } = await supabase
  .from('withdrawal_requests')
  .select('*')
  .eq('user_id', userId);

// Get available banks
const { data: banks } = await supabase
  .from('withdrawal_banks')
  .select('*')
  .eq('is_active', true);
```

## 🧪 Testing the Schema

### **1. Test Withdrawal System**
```sql
-- Insert a test withdrawal request
INSERT INTO withdrawal_requests (
  user_id, owner_name, account_type, bank_name, 
  bank_code, branch_code, account_number, amount
) VALUES (
  'your-user-id', 'Test User', 'Savings Account', 
  'ABSA Bank', '632005', '632005', '1234567890', 100.00
);
```

### **2. Test Green Scholar Fund**
```sql
-- Insert a test bottle collection
INSERT INTO green_scholar_fund_bottles (
  user_id, bottle_count, weight_kg, bottle_type
) VALUES (
  'your-user-id', 50, 2.5, 'PET'
);
```

### **3. Verify Triggers**
```sql
-- Check if user metrics were automatically updated
SELECT * FROM user_metrics WHERE user_id = 'your-user-id';
```

## 🚨 Important Notes

### **Before Running**
1. **Backup your existing database** if you have important data
2. **Test in a development environment** first
3. **Ensure you have admin access** to your Supabase project

### **After Running**
1. **Verify all tables were created** successfully
2. **Check RLS policies** are working correctly
3. **Test basic CRUD operations** for each table
4. **Monitor performance** and adjust indexes if needed

## 🔧 Troubleshooting

### **Common Issues**

#### **Permission Denied Errors**
```sql
-- Ensure RLS policies are created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'withdrawal_requests';
```

#### **Function Not Found Errors**
```sql
-- Check if functions were created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

#### **Trigger Errors**
```sql
-- Verify triggers are attached
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers;
```

### **Reset Schema (If Needed)**
```sql
-- Drop all tables (⚠️ DESTRUCTIVE - USE WITH CAUTION)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then re-run the schema script
```

## 📚 Additional Resources

### **Related Files**
- `supabase-schema-update.sql` - Complete database schema
- `green-scholar-fund-setup.sql` - Green Scholar Fund specific setup
- `quick-wallet-setup.sql` - Basic wallet setup
- `fix-rls-policies.sql` - RLS policy fixes

### **Documentation**
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🤝 Support

If you encounter issues with the schema update:

1. **Check the troubleshooting section** above
2. **Verify your Supabase version** is compatible
3. **Review the error logs** in Supabase dashboard
4. **Test with a minimal dataset** first

## 📝 Changelog

### **Version 2.0.0** (Current)
- ✅ Complete withdrawal system
- ✅ Green Scholar Fund integration
- ✅ Enhanced wallet functionality
- ✅ Comprehensive RLS policies
- ✅ Performance optimizations
- ✅ Automatic calculations and triggers

### **Version 1.0.0** (Previous)
- ✅ Basic wallet system
- ✅ Simple recycling tracking
- ✅ Basic user authentication

---

**Last Updated:** December 2024  
**Schema Version:** 2.0.0  
**Compatibility:** Supabase v2.0+  
**PostgreSQL:** 14+
