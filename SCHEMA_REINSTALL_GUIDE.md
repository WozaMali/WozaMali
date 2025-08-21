# WozaMali Schema Reinstall Guide

## Overview
This guide will help you completely reinstall your Supabase database schema to accommodate both **Office** and **Collector** roles with proper role-based access control.

## ⚠️ IMPORTANT WARNINGS

1. **This process will DROP all existing tables and data**
2. **Make sure you have backups of any critical data**
3. **Run this in a development environment first**
4. **Ensure you have admin access to your Supabase project**

## 📋 Prerequisites

- Admin access to your Supabase project
- Access to Supabase SQL Editor
- Backup of any critical data (if any exists)
- Understanding that this will reset your database

## 🚀 Execution Steps

### Step 1: Backup Current Data (Optional)
If you have existing data you want to preserve, first run a manual backup:

```sql
-- In Supabase SQL Editor, run this first to see what exists:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

### Step 2: Execute Main Schema Installation
1. Open your Supabase SQL Editor
2. Copy and paste the entire contents of `supabase-complete-schema-dump.sql`
3. Click "Run" to execute

**Expected Output:**
- Tables will be dropped and recreated
- You'll see notices about backup creation
- Final verification queries will show the new structure

### Step 3: Execute Office Role Setup
1. After the main schema is installed, copy and paste `office-role-setup.sql`
2. Click "Run" to execute

**Expected Output:**
- Office management functions will be created
- Views for office dashboard will be created
- Sample office data will be inserted

### Step 4: Verify Installation
Run these verification queries:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check role distribution
SELECT role, COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY count DESC;

-- Check office setup
SELECT name, city, province, is_active
FROM public.offices
ORDER BY name;
```

## 🏗️ New Schema Structure

### Core Tables
- **`profiles`** - Enhanced with `office_id` and `collector_id` fields
- **`offices`** - New table for managing office locations
- **`office_staff`** - New table for office personnel management
- **`office_zones`** - New table for office area management

### Collection Tables (Enhanced)
- **`collection_areas`** - Now linked to offices
- **`collection_schedules`** - Enhanced tracking
- **`collection_routes`** - Office-based route management
- **`collection_logs`** - Office-linked collection tracking
- **`household_collections`** - Individual collection records

### System Tables
- **`wallets`** - Office-linked user wallets
- **`user_activity_log`** - Office-tracked user activities
- **`office_notifications`** - New office notification system

## 🔐 Role-Based Access Control

### New Roles
- **`admin`** - Full system access
- **`office`** - Office management access
- **`collector`** - Collection management access
- **`manager`** - Office management
- **`staff`** - Office staff
- **`member`** - Regular users
- **`recycler`** - Recycling users

### Office Hierarchy
```
Office Manager → Office Staff → Collectors
     ↓
Collection Areas → Routes → Schedules
     ↓
Collection Logs → Household Collections
```

## 📊 Office Management Features

### Dashboard Views
- **`office_dashboard`** - Overview of office performance
- **`office_staff_view`** - Staff management
- **`office_collection_performance`** - Performance metrics

### Management Functions
- **`create_office_user()`** - Create office users
- **`assign_collector_to_office()`** - Assign collectors
- **`get_office_stats()`** - Get office statistics
- **`generate_office_daily_report()`** - Daily reports

## 🔄 Data Migration (If Applicable)

If you had existing data, the script automatically:
1. Creates backup tables with `_backup` suffix
2. Restores data to new schema structure
3. Maps existing roles to new role system
4. Assigns all users to default office

## 🧪 Testing the New System

### 1. Create Test Office User
```sql
-- First, ensure you have a profile to convert
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (gen_random_uuid(), 'test@office.com', 'Test Office User', 'member');

-- Then convert to office user
SELECT create_office_user('test@office.com', 'Test Office User', '+27123456789', 
    (SELECT id FROM public.offices LIMIT 1), 'staff');
```

### 2. Test Office Dashboard
```sql
-- View office dashboard
SELECT * FROM office_dashboard;

-- View office staff
SELECT * FROM office_staff_view;
```

### 3. Test Collection Management
```sql
-- Create collection area
INSERT INTO public.collection_areas (name, office_id, city, province)
VALUES ('Test Area', (SELECT id FROM public.offices LIMIT 1), 'Soweto', 'Gauteng');

-- View collection areas
SELECT * FROM public.collection_areas;
```

## 🚨 Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Ensure you're running as a superuser/admin
   - Check RLS policies are properly set

2. **Foreign Key Constraint Errors**
   - Tables are dropped in correct dependency order
   - Ensure all references are properly handled

3. **Role Assignment Issues**
   - Verify profiles exist before assigning roles
   - Check office_id references are valid

### Rollback Plan
If something goes wrong:
1. The backup tables (with `_backup` suffix) contain your original data
2. You can manually restore from these tables
3. Or re-run the installation script

## 📈 Next Steps

After successful installation:

1. **Configure Office Settings**
   - Update office details
   - Set up office zones
   - Configure collection areas

2. **Set Up Users**
   - Create office managers
   - Assign collectors to offices
   - Set up user permissions

3. **Configure Collection System**
   - Set up collection routes
   - Configure schedules
   - Test collection workflows

4. **Monitor and Optimize**
   - Use dashboard views
   - Generate reports
   - Optimize performance

## 📞 Support

If you encounter issues:
1. Check the verification queries in the scripts
2. Review the backup tables for data integrity
3. Check Supabase logs for detailed error messages
4. Ensure all dependencies are properly installed

---

**Remember**: This is a complete schema reset. Make sure you're ready to proceed and have proper backups if needed.
