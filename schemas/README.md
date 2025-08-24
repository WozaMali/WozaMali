# Supabase Schema Management

This directory contains all database schemas for the WozaMali project. Both the main repo and UI repo connect to the same Supabase project, so all schemas are managed here.

## Schema Organization

### Core Schemas
- **`auth-profiles.sql`** - User authentication and profile management
- **`wallet-system.sql`** - Wallet, balance, and transaction management
- **`points-rewards.sql`** - Points system and gamification
- **`metrics-analytics.sql`** - Analytics, tracking, and reporting

### Combined Schemas
- **`complete-schema.sql`** - All schemas combined for full database setup
- **`migration-scripts/`** - Database migration and update scripts

## How to Use

### For Main Repo
1. Run individual schema files for specific features
2. Use `complete-schema.sql` for full database setup
3. Apply migrations as needed

### For UI Repo
1. Reference these schema files (don't duplicate)
2. Use `complete-schema.sql` to ensure database compatibility
3. Run schema updates from main repo

## Schema Dependencies

```
auth-profiles.sql (required first)
    ↓
wallet-system.sql (depends on profiles)
    ↓
points-rewards.sql (depends on profiles + wallets)
    ↓
metrics-analytics.sql (depends on all above)
```

## Best Practices

1. **Always update schemas in main repo first**
2. **Test schema changes in development environment**
3. **Use migration scripts for production updates**
4. **Keep both repos in sync with schema changes**
5. **Document any schema dependencies**

## Deployment Order

1. Deploy main repo with schema updates
2. Apply database schema changes
3. Deploy UI repo (it will work with updated schema)
4. Verify both repos function correctly
