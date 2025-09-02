# Woza Mali App-Specific TypeScript Types and Queries

This document describes the app-specific TypeScript types and Supabase queries organized for each of the three applications in the Woza Mali waste collection program.

## Overview

Each app has its own dedicated TypeScript types and query functions tailored to its specific needs and permissions:

- **User App** (`apps/user-app/`) - For residents to manage their collections and view their data
- **Collector App** (`apps/collector-app/`) - For collectors to manage collections in their assigned area
- **Office App** (`apps/office-app/`) - For office staff to manage all data and operations

## File Structure

```
apps/
├── user-app/
│   ├── types/
│   │   └── database.types.ts
│   └── lib/
│       ├── supabase.ts
│       └── supabase-queries.ts
├── collector-app/
│   ├── types/
│   │   └── database.types.ts
│   └── lib/
│       ├── supabase.ts
│       └── supabase-queries.ts
└── office-app/
    ├── types/
    │   └── database.types.ts
    └── lib/
        ├── supabase.ts
        └── supabase-queries.ts
```

## User App (`apps/user-app/`)

### Types (`types/database.types.ts`)
- **Focused on resident operations**: Users can only access their own data
- **Collection operations**: Create collections, view own collections
- **Transaction operations**: View own transactions and points
- **Profile management**: Update own profile information

### Queries (`lib/supabase-queries.ts`)
- `userQueries.getCurrentUser()` - Get current user profile
- `userQueries.updateCurrentUser()` - Update own profile
- `collectionQueries.getMyCollections()` - Get user's own collections
- `collectionQueries.createCollection()` - Create new collection
- `transactionQueries.getMyTransactions()` - Get user's transactions
- `transactionQueries.getMyTotalPoints()` - Get user's total points
- `analyticsQueries.getMyCollectionsSummary()` - Get user's collection stats
- `utilityQueries.getAreas()` - Get available areas for selection

### Key Features
- **Self-service**: Users can only access and modify their own data
- **Collection creation**: Residents can create collection requests
- **Points tracking**: View earned points and transaction history
- **Profile management**: Update personal information

## Collector App (`apps/collector-app/`)

### Types (`types/database.types.ts`)
- **Area-focused operations**: Collectors work within their assigned area
- **Collection management**: Update assigned collections, view area collections
- **User management**: View users in assigned area
- **Assignment tracking**: Manage collection assignments

### Queries (`lib/supabase-queries.ts`)
- `userQueries.getCurrentCollector()` - Get collector profile
- `userQueries.getUsersInMyArea()` - Get users in collector's area
- `collectionQueries.getCollectionsInMyArea()` - Get collections in area
- `collectionQueries.getMyAssignedCollections()` - Get assigned collections
- `collectionQueries.assignCollectionToMe()` - Assign collection to collector
- `collectionQueries.updateCollection()` - Update assigned collection
- `analyticsQueries.getMyStats()` - Get collector performance stats
- `utilityQueries.getPendingCollectionsInArea()` - Get unassigned collections

### Key Features
- **Area-based access**: Collectors can only see data in their assigned area
- **Collection assignment**: Assign and manage collection requests
- **Performance tracking**: View collection statistics and performance
- **User interaction**: View and interact with users in their area

## Office App (`apps/office-app/`)

### Types (`types/database.types.ts`)
- **Full system access**: Office staff can access all data and operations
- **Complete CRUD operations**: Create, read, update, delete all entities
- **Analytics and reporting**: Comprehensive system analytics
- **Bulk operations**: Manage multiple records at once

### Queries (`lib/supabase-queries.ts`)
- `areaQueries.*` - Full area management (CRUD)
- `userQueries.*` - Full user management (CRUD)
- `collectionQueries.*` - Full collection management (CRUD)
- `transactionQueries.*` - Full transaction management (CRUD)
- `analyticsQueries.getOverallAnalytics()` - System-wide analytics
- `analyticsQueries.getAreaAnalytics()` - Analytics by area
- `analyticsQueries.getCollectionAnalytics()` - Analytics by material type
- `utilityQueries.bulkApproveCollections()` - Bulk operations
- `utilityQueries.bulkRejectCollections()` - Bulk operations

### Key Features
- **Administrative control**: Full access to all system data
- **Analytics dashboard**: Comprehensive reporting and analytics
- **Bulk operations**: Efficient management of multiple records
- **System oversight**: Monitor and manage all operations

## Usage Examples

### User App
```typescript
import { userAppQueries } from './apps/user-app/lib/supabase-queries';

// Get user's collections
const myCollections = await userAppQueries.collections.getMyCollections();

// Create new collection
const newCollection = await userAppQueries.collections.createCollection({
  material_type: 'plastic',
  weight_kg: 5.5,
  photo_url: 'https://example.com/photo.jpg'
});

// Get user's points
const totalPoints = await userAppQueries.transactions.getMyTotalPoints();
```

### Collector App
```typescript
import { collectorAppQueries } from './apps/collector-app/lib/supabase-queries';

// Get collections in my area
const areaCollections = await collectorAppQueries.collections.getCollectionsInMyArea();

// Assign collection to myself
await collectorAppQueries.collections.assignCollectionToMe(collectionId);

// Update collection status
await collectorAppQueries.collections.updateCollection(collectionId, {
  status: 'approved',
  notes: 'Collection completed successfully'
});

// Get my performance stats
const stats = await collectorAppQueries.analytics.getMyStats();
```

### Office App
```typescript
import { officeAppQueries } from './apps/office-app/lib/supabase-queries';

// Get all users
const allUsers = await officeAppQueries.users.getAll();

// Create new area
const newArea = await officeAppQueries.areas.create({ name: 'New Area' });

// Approve collection and award points
const result = await officeAppQueries.collections.approve(collectionId, 55);

// Get system analytics
const analytics = await officeAppQueries.analytics.getOverallAnalytics();

// Bulk approve collections
await officeAppQueries.utility.bulkApproveCollections(collectionIds, 10);
```

## Security and Permissions

Each app's queries are designed to work with the Row Level Security (RLS) policies:

- **User App**: Can only access own data (user_id = auth.uid())
- **Collector App**: Can access data in assigned area (area_id = collector's area_id)
- **Office App**: Can access all data (role = 'office')

## Environment Configuration

Each app uses the same Supabase configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Benefits of App-Specific Organization

1. **Clear separation of concerns**: Each app has its own types and queries
2. **Tailored functionality**: Queries are optimized for each app's needs
3. **Better maintainability**: Changes to one app don't affect others
4. **Type safety**: Each app has types that match its specific use cases
5. **Easier testing**: Each app can be tested independently
6. **Scalability**: Easy to add new apps or modify existing ones

This organization ensures that each app has exactly the functionality it needs while maintaining security and type safety across the entire system.
