# Woza Mali Unified Database Schema

This document describes the unified PostgreSQL schema for the Woza Mali waste collection program, supporting three applications: User App, Collector App, and Office App.

## Overview

The schema is designed to support a comprehensive waste collection system with user management, collection tracking, and point-based rewards. All applications share the same Supabase database with Row Level Security (RLS) policies ensuring proper data access control.

## Database Tables

### 1. Areas Table
Stores geographical areas for waste collection.

```sql
areas (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
```

### 2. Users Table
Stores user information for residents, collectors, and office staff.

```sql
users (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  address TEXT,
  area_id UUID REFERENCES areas(id),
  role VARCHAR(20) CHECK (role IN ('resident', 'collector', 'office')),
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
```

### 3. Collections Table
Tracks waste collection requests and their status.

```sql
collections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  collector_id UUID REFERENCES users(id),
  material_type VARCHAR(100) NOT NULL,
  weight_kg DECIMAL(10,2) CHECK (weight_kg > 0),
  photo_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
```

### 4. Transactions Table
Records point transactions for users.

```sql
transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  collection_id UUID REFERENCES collections(id),
  points INTEGER DEFAULT 0,
  transaction_type VARCHAR(50) DEFAULT 'collection' CHECK (transaction_type IN ('collection', 'withdrawal', 'bonus', 'penalty')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
```

## Relationships

- `users.area_id` → `areas.id` (Many-to-One)
- `collections.user_id` → `users.id` (Many-to-One)
- `collections.collector_id` → `users.id` (Many-to-One)
- `transactions.user_id` → `users.id` (Many-to-One)
- `transactions.collection_id` → `collections.id` (Many-to-One)

## Row Level Security (RLS) Policies

### Areas Table
- **Read**: Everyone can view areas
- **Write**: Only office users can create, update, or delete areas

### Users Table
- **Read**: 
  - Users can view their own profile
  - Collectors can view users in their assigned area
  - Office can view all users
- **Write**:
  - Users can update their own profile
  - Only office can create or delete users

### Collections Table
- **Read**:
  - Residents can view their own collections
  - Collectors can view collections in their assigned area
  - Office can view all collections
- **Write**:
  - Residents can create collections
  - Collectors can update collections they're assigned to
  - Office can update all collections
  - Only office can delete collections

### Transactions Table
- **Read**: Users can view their own transactions, office can view all
- **Write**: Only office can create, update, or delete transactions

## Database Views

### User Collections Summary
Provides aggregated collection data per user:
- Total collections
- Total weight collected
- Approved vs pending collections

### User Points Summary
Provides aggregated point data per user:
- Total points earned
- Total transactions

## Indexes

The schema includes optimized indexes for:
- User lookups by area and role
- Collection filtering by user, collector, and status
- Transaction queries by user and date
- Phone number and email lookups

## Sample Data

The schema includes sample data for testing:
- 3 areas (Downtown, Suburbs, Industrial Zone)
- 4 users (2 residents, 1 collector, 1 office staff)
- 2 sample collections
- 2 sample transactions

## Usage Examples

### TypeScript Types
```typescript
import type { User, Collection, Transaction } from './types/database.types';

// Use typed interfaces for type safety
const user: User = {
  id: 'uuid',
  name: 'John Doe',
  role: 'resident',
  // ... other fields
};
```

### Supabase Queries
```typescript
import { wozaMaliQueries } from './lib/supabase-queries';

// Get user's collections
const collections = await wozaMaliQueries.collections.getByUserId(userId);

// Create new collection
const newCollection = await wozaMaliQueries.collections.create({
  user_id: userId,
  material_type: 'plastic',
  weight_kg: 5.5,
  photo_url: 'https://example.com/photo.jpg'
});

// Approve collection and award points
const result = await wozaMaliQueries.collections.approve(collectionId, 55);
```

## Setup Instructions

1. **Run the SQL Schema**:
   ```sql
   -- Copy and paste the contents of unified-schema.sql into Supabase SQL Editor
   -- Execute the script to create all tables, policies, and sample data
   ```

2. **Configure Environment Variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Install Dependencies**:
   ```bash
   npm install @supabase/supabase-js
   ```

4. **Import Types and Queries**:
   ```typescript
   import type { User, Collection, Transaction } from './types/database.types';
   import { wozaMaliQueries } from './lib/supabase-queries';
   ```

## Security Considerations

- All tables have RLS enabled
- Policies are role-based and area-based
- Users can only access data they're authorized to see
- Office users have full access for administrative purposes
- Collectors are restricted to their assigned areas

## Performance Optimizations

- Strategic indexes on frequently queried columns
- Efficient foreign key relationships
- Database views for common aggregations
- Proper data types and constraints

## Maintenance

- Regular monitoring of query performance
- Index optimization based on usage patterns
- Backup and recovery procedures
- Schema versioning for future updates

This unified schema provides a solid foundation for the Woza Mali waste collection program, ensuring data integrity, security, and scalability across all three applications.
