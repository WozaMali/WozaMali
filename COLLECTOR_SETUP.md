# WozaMali Collector Setup Guide

This guide will help you set up and configure the collector functionality for the WozaMali recycling platform.

## 🗄️ Database Setup

### 1. Run the Collector Schema

First, execute the collector database schema in your Supabase SQL Editor:

```sql
-- Run the contents of collector-schema.sql in your Supabase SQL Editor
```

This will create the following tables:
- `collection_areas` - Defines collection areas and zones
- `collection_schedules` - Collection schedules for each area
- `collection_routes` - Collection routes combining multiple areas
- `collection_logs` - Daily collection activity logs
- `household_collections` - Individual household collection records

### 2. Verify Role System

Ensure your profiles table has the role column with proper constraints:

```sql
-- Check if role column exists
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';

-- Verify role constraints
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%role%';
```

## 👥 User Role Management

### 1. Assign Collector Role

To make a user a collector, update their profile:

```sql
-- Update a user to have collector role
UPDATE public.profiles 
SET role = 'collector' 
WHERE email = 'collector@example.com';

-- Or update by user ID
UPDATE public.profiles 
SET role = 'collector' 
WHERE id = 'user-uuid-here';
```

### 2. Available Roles

The system supports these roles:
- `admin` - Full system access
- `manager` - Management access
- `collector` - Collection management access
- `recycler` - Recycling user access
- `member` - Basic member access
- `user` - Standard user access

## 🏗️ Collection Areas Setup

### 1. Create Collection Areas

```sql
-- Insert sample collection areas
INSERT INTO public.collection_areas (name, city, province) VALUES
    ('Baragwanath Central', 'Soweto', 'Gauteng'),
    ('Chiawelo Extension', 'Soweto', 'Gauteng'),
    ('Dlamini Zone 1', 'Soweto', 'Gauteng'),
    ('Protea Glen North', 'Soweto', 'Gauteng');
```

### 2. Assign Areas to Collectors

```sql
-- Create collection schedules
INSERT INTO public.collection_schedules (area_id, collector_id, day_of_week, start_time, end_time) VALUES
    ('area-uuid-1', 'collector-uuid-1', 1, '08:00:00', '12:00:00'), -- Monday
    ('area-uuid-2', 'collector-uuid-1', 2, '08:00:00', '12:00:00'), -- Tuesday
    ('area-uuid-3', 'collector-uuid-1', 3, '08:00:00', '12:00:00'); -- Wednesday
```

## 🚀 Frontend Setup

### 1. Components Created

The following components have been created:

- **CollectorUI** (`src/components/CollectorUI.tsx`) - Main collector interface
- **ProtectedCollectorRoute** (`src/components/ProtectedCollectorRoute.tsx`) - Route protection
- **CollectorPage** (`src/app/collector/page.tsx`) - Collector page route

### 2. Services Created

- **collectorService** (`src/lib/collectorService.ts`) - API operations
- **collector types** (`src/types/collector.ts`) - TypeScript interfaces

### 3. Context Updates

The `AuthContext` has been updated to include:
- User role management
- Role-based access control
- Collector-specific functionality

## 🔐 Access Control

### 1. Route Protection

The collector page is protected by `ProtectedCollectorRoute` which:
- Checks if user is authenticated
- Verifies user has collector, admin, or manager role
- Redirects unauthorized users with appropriate messages

### 2. Database Security

Row Level Security (RLS) policies ensure:
- Collectors can only see their assigned areas and routes
- Collectors can only create/update their own collection logs
- Admins and managers have full access

## 📱 Using the Collector Interface

### 1. Dashboard Overview

The collector dashboard shows:
- **Statistics Cards**: Total areas, routes, collections, households, and weight
- **Date Filter**: Filter collections by specific dates
- **Tabbed Interface**: Organized sections for different functions

### 2. Collection Areas Tab

- View assigned collection areas
- Search and filter areas
- See area details and status

### 3. Schedules Tab

- View weekly collection schedules
- Organized by day of the week
- Shows area assignments and time slots

### 4. Routes Tab

- View assigned collection routes
- See route details and estimated duration
- Track route status

### 5. Collection Logs Tab

- View daily collection logs
- Create new collection logs
- Track collection progress and completion

## 🛠️ Creating Collection Logs

### 1. Log Creation Process

1. Click "Create Log" button
2. Select collection area
3. Set collection date
4. Enter household counts (visited vs collected)
5. Record total weight collected
6. Set collection status
7. Add optional notes

### 2. Log Statuses

- `scheduled` - Collection planned
- `in_progress` - Collection ongoing
- `completed` - Collection finished
- `cancelled` - Collection cancelled

## 🔧 Troubleshooting

### 1. Common Issues

**"Access Restricted" Error**
- Ensure user has collector role
- Check database role assignment
- Verify RLS policies are active

**"No collection areas found"**
- Verify collection areas exist in database
- Check collector assignments in schedules
- Ensure RLS policies allow access

**Database Connection Errors**
- Verify Supabase configuration
- Check environment variables
- Ensure database schema is properly set up

### 2. Debug Steps

1. Check browser console for errors
2. Verify user role in database
3. Test database queries directly
4. Check RLS policy enforcement

## 📊 Testing the System

### 1. Test User Setup

```sql
-- Create a test collector user
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at) VALUES
    ('testcollector@example.com', crypt('password123', gen_salt('bf')), NOW());

-- Get the user ID and update profile
UPDATE public.profiles 
SET role = 'collector' 
WHERE email = 'testcollector@example.com';
```

### 2. Test Data

```sql
-- Create test collection areas
INSERT INTO public.collection_areas (name, city, province) VALUES
    ('Test Area 1', 'Soweto', 'Gauteng'),
    ('Test Area 2', 'Soweto', 'Gauteng');

-- Create test schedules
INSERT INTO public.collection_schedules (area_id, collector_id, day_of_week, start_time, end_time) VALUES
    ('test-area-1-uuid', 'test-collector-uuid', 1, '09:00:00', '13:00:00');
```

## 🚀 Next Steps

### 1. Enhanced Features

Consider implementing:
- Mobile app for collectors
- GPS tracking for collection routes
- Real-time collection updates
- Automated payment processing
- Collection analytics and reporting

### 2. Integration

- Connect with existing user management
- Integrate with payment systems
- Add notification systems
- Implement audit logging

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review database logs
3. Test with sample data
4. Contact development team

---

**Note**: This collector system is designed to be scalable and secure. Always test thoroughly in development before deploying to production.
