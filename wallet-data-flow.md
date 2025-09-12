# Wallet Data Flow: Office/Admin App → Main App

## 🔄 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    OFFICE/ADMIN APP                            │
│                                                                 │
│  1. Admin approves pickup                                      │
│     ↓                                                          │
│  2. Updates pickups.status = 'approved'                       │
│     ↓                                                          │
│  3. Trigger fires: update_wallet_on_pickup_approval()         │
│     ↓                                                          │
│  4. Calculates:                                                │
│     • Pickup total = SUM(kilograms × rate_per_kg)             │
│     • Wallet amount = 30% of pickup total                     │
│     • Points = total weight in kg                             │
│     • Tier = based on total points                            │
│     ↓                                                          │
│  5. Updates wallets table:                                    │
│     • balance = balance + wallet_amount                       │
│     • total_points = total_points + new_points                │
│     • tier = calculated_tier                                  │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE                                │
│                                                                 │
│  wallets table:                                                │
│  • user_id (UUID)                                              │
│  • balance (DECIMAL) ← Updated by Office/Admin                 │
│  • total_points (INTEGER) ← Updated by Office/Admin            │
│  • tier (VARCHAR) ← Updated by Office/Admin                    │
│  • created_at, updated_at                                      │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                      MAIN APP                                  │
│                                                                 │
│  1. User opens Main App                                        │
│     ↓                                                          │
│  2. Main App queries main_app_user_wallet view                │
│     ↓                                                          │
│  3. View reads from wallets table:                            │
│     • current_balance = wallets.balance                       │
│     • total_points = wallets.total_points                     │
│     • current_tier = wallets.tier                             │
│     ↓                                                          │
│  4. User sees updated wallet data instantly                   │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 CALCULATION LOGIC

### Office/Admin App Calculations:
- **Pickup Total Value** = `SUM(kilograms × rate_per_kg)` from pickup_items
- **Wallet Amount** = `30% of pickup total value`
- **Points** = `Total weight in kilograms`
- **Tier** = Based on total points:
  - 1000+ points = Diamond Recycler
  - 500+ points = Platinum Recycler
  - 250+ points = Gold Recycler
  - 100+ points = Silver Recycler
  - <100 points = Bronze Recycler

### Main App Display:
- **Balance** = `wallets.balance` (accumulated from all approved pickups)
- **Points** = `wallets.total_points` (total weight from all approved pickups)
- **Tier** = `wallets.tier` (calculated based on total points)

## 🔧 IMPLEMENTATION STEPS

1. **Run the SQL script** (`office-to-main-wallet-integration.sql`) in Supabase
2. **Test the integration** by approving a pickup in Office/Admin App
3. **Check Main App** to see if wallet balance updates automatically

## ✅ BENEFITS

- **Single Source of Truth**: All wallet data comes from Office/Admin calculations
- **Real-time Updates**: Main App automatically reflects Office/Admin changes
- **Consistent Logic**: Same 30% calculation and tier system used everywhere
- **No Duplication**: No need to sync data between different systems
