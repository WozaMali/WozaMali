# Woza Mali Address Integration Summary

## Overview

The unified schema has been updated to integrate with the existing Woza Mali `user_addresses` table system. This ensures that all three apps (User App, Collector App, and Office App) can access and manage user addresses consistently.

## Key Changes Made

### 1. Database Schema Updates

#### **Unified Schema (`unified-schema.sql`)**
- ✅ **Removed** `address` field from `users` table
- ✅ **Added** `user_addresses` table with comprehensive address management
- ✅ **Added** `pickup_address_id` field to `collections` table
- ✅ **Added** foreign key relationships between tables
- ✅ **Added** RLS policies for address access control
- ✅ **Added** indexes for performance optimization
- ✅ **Added** sample address data

#### **User Addresses Table Structure**
```sql
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_type TEXT DEFAULT 'primary' CHECK (address_type IN ('primary', 'secondary', 'pickup', 'billing')),
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT,
    country TEXT DEFAULT 'South Africa',
    coordinates POINT, -- For GPS mapping and route optimization
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    notes TEXT, -- Additional delivery instructions, landmarks, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. TypeScript Types Updates

#### **Main Types (`types/database.types.ts`)**
- ✅ **Added** `UserAddress` interface
- ✅ **Updated** `User` interface (removed `address` field)
- ✅ **Updated** `Collection` interface (added `pickup_address_id`)
- ✅ **Added** `UserAddressInsert` and `UserAddressUpdate` interfaces
- ✅ **Updated** relationship interfaces to include addresses

#### **App-Specific Types**
- ✅ **User App** (`apps/user-app/types/database.types.ts`) - Updated with address types
- ✅ **Collector App** (`apps/collector-app/types/database.types.ts`) - Updated with address types  
- ✅ **Office App** (`apps/office-app/types/database.types.ts`) - Updated with address types

### 3. Row Level Security (RLS) Policies

#### **Address Access Control**
- **Users**: Can view and manage their own addresses
- **Collectors**: Can view addresses of users in their assigned area
- **Office**: Can view and manage all addresses

#### **Collection Access Control**
- **Users**: Can view their own collections with pickup addresses
- **Collectors**: Can view collections in their area with pickup addresses
- **Office**: Can view all collections with pickup addresses

### 4. Database Views

#### **New View: `collections_with_addresses`**
```sql
CREATE OR REPLACE VIEW collections_with_addresses AS
SELECT 
    c.id as collection_id,
    c.user_id,
    c.collector_id,
    c.pickup_address_id,
    c.material_type,
    c.weight_kg,
    c.photo_url,
    c.status,
    c.notes,
    c.created_at,
    c.updated_at,
    u.name as user_name,
    u.phone as user_phone,
    u.email as user_email,
    collector.name as collector_name,
    collector.phone as collector_phone,
    ua.address_type,
    ua.address_line1,
    ua.address_line2,
    ua.city,
    ua.province,
    ua.postal_code,
    ua.country,
    ua.coordinates,
    ua.notes as address_notes,
    CONCAT(
        ua.address_line1,
        CASE WHEN ua.address_line2 IS NOT NULL THEN ', ' || ua.address_line2 ELSE '' END,
        ', ', ua.city, ', ', ua.province,
        CASE WHEN ua.postal_code IS NOT NULL THEN ', ' || ua.postal_code ELSE '' END
    ) as full_address
FROM collections c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN users collector ON c.collector_id = collector.id
LEFT JOIN user_addresses ua ON c.pickup_address_id = ua.id;
```

## Integration Benefits

### 1. **Unified Address Management**
- All apps now use the same address system
- Consistent address data across all applications
- Single source of truth for user addresses

### 2. **Enhanced Collection Management**
- Collections can be linked to specific pickup addresses
- Collectors can see exact pickup locations
- Office can track collection locations accurately

### 3. **GPS Integration Ready**
- `coordinates` field supports GPS mapping
- Route optimization capabilities
- Location-based features

### 4. **Flexible Address Types**
- **Primary**: Main residence address
- **Secondary**: Alternative address
- **Pickup**: Collection/pickup address
- **Billing**: Billing address

### 5. **Default Address Management**
- One default address per type per user
- Easy address switching
- Automatic default selection

## Usage Examples

### For User App
```typescript
// Get user's addresses
const addresses = await supabase
  .from('user_addresses')
  .select('*')
  .eq('user_id', userId)
  .eq('is_active', true);

// Create new pickup address
const newAddress = await supabase
  .from('user_addresses')
  .insert({
    user_id: userId,
    address_type: 'pickup',
    address_line1: '123 Main Street',
    city: 'Cape Town',
    province: 'Western Cape',
    is_default: true
  });
```

### For Collector App
```typescript
// Get collections with pickup addresses in my area
const collections = await supabase
  .from('collections_with_addresses')
  .select('*')
  .eq('collector_id', collectorId)
  .eq('status', 'pending');

// Get pickup addresses for route planning
const pickupAddresses = await supabase
  .from('user_addresses')
  .select('*')
  .eq('address_type', 'pickup')
  .eq('is_active', true)
  .not('coordinates', 'is', null);
```

### For Office App
```typescript
// Get all collections with full address details
const allCollections = await supabase
  .from('collections_with_addresses')
  .select('*')
  .order('created_at', { ascending: false });

// Get user addresses for management
const userAddresses = await supabase
  .from('user_addresses')
  .select(`
    *,
    user:users(name, phone, email)
  `)
  .eq('is_active', true);
```

## Migration Notes

### Existing Data
- The schema includes sample address data for testing
- Existing collections will have `pickup_address_id` as `null` initially
- Users can add addresses and link them to collections

### Backward Compatibility
- The `users` table no longer has an `address` field
- All address data should be migrated to the `user_addresses` table
- Existing queries should be updated to use the new address system

## Security Considerations

### Row Level Security
- Users can only access their own addresses
- Collectors can only access addresses in their assigned area
- Office staff can access all addresses
- Proper permission checks in all queries

### Data Validation
- Address types are constrained to valid values
- Required fields are enforced
- Default address constraints prevent conflicts

## Performance Optimizations

### Indexes
- `idx_user_addresses_user_id` - Fast user lookups
- `idx_user_addresses_active` - Active address filtering
- `idx_user_addresses_default` - Default address queries
- `idx_user_addresses_coordinates` - Spatial queries for mapping

### Views
- `collections_with_addresses` - Pre-joined data for common queries
- Optimized for read-heavy operations
- Reduces need for complex joins in application code

## Next Steps

1. **Run the updated schema** in your Supabase database
2. **Update your applications** to use the new address system
3. **Migrate existing address data** from the old system
4. **Test the integration** with all three apps
5. **Implement GPS features** using the coordinates field
6. **Add route optimization** for collectors

The address integration is now complete and ready for use across all Woza Mali applications! 🎉
