# WozaMali Unified Schema Design

## **Information Flow Architecture**

```
User Registration → Profile Creation → Collection Request → Collector Assignment → 
Pickup Execution → Payment Processing → Analytics & Reporting
```

## **Core Entities & Relationships**

### 1. **Users & Authentication**
- `users` - Core user data (linked to Supabase auth)
- `user_profiles` - Extended profile information
- `user_addresses` - Multiple addresses per user
- `user_roles` - Role assignments and permissions

### 2. **Collections & Pickups**
- `collection_requests` - User-initiated collection requests
- `collection_pickups` - Actual pickup execution by collectors
- `pickup_items` - Individual materials collected
- `pickup_photos` - Verification photos

### 3. **Materials & Pricing**
- `materials` - Available recyclable materials
- `material_rates` - Current pricing per material
- `material_categories` - Material groupings

### 4. **Financial System**
- `user_wallets` - User balance and points
- `transactions` - All financial transactions
- `payments` - Payment processing records
- `withdrawals` - Withdrawal requests

### 5. **Geographic & Logistics**
- `collection_zones` - Geographic collection areas
- `collection_schedules` - Collection timing
- `collector_assignments` - Collector-to-zone assignments

### 6. **Administrative**
- `system_settings` - Global system configuration
- `audit_logs` - All system changes
- `notifications` - User notifications

## **Key Design Principles**

1. **Single Source of Truth** - Each entity has one primary table
2. **Clear Relationships** - Foreign keys define data flow
3. **Audit Trail** - All changes are logged
4. **Role-Based Access** - RLS policies based on user roles
5. **Real-time Updates** - Optimized for live data sync
6. **Scalable Structure** - Easy to extend and maintain

## **Data Flow Mapping**

| Stage | Main App | Collector App | Office App |
|-------|----------|---------------|------------|
| **User Registration** | Create profile | - | View new users |
| **Collection Request** | Submit request | View assigned | Manage requests |
| **Pickup Execution** | Track status | Execute pickup | Monitor progress |
| **Payment Processing** | View balance | - | Process payments |
| **Analytics** | Personal stats | Performance | System analytics |

## **Benefits of Unified Schema**

- ✅ **No RLS conflicts** - Clean, consistent policies
- ✅ **Real-time sync** - All apps see same data
- ✅ **Easy maintenance** - Single schema to manage
- ✅ **Better performance** - Optimized queries
- ✅ **Clear data flow** - Logical relationships
- ✅ **Future-proof** - Easy to extend
