# WozaMali Rewards, Metrics & Wallet System

## Overview

This document describes the comprehensive rewards, metrics, and wallet system implemented in WozaMali, which provides a complete ecosystem for managing user rewards, environmental impact tracking, and financial transactions.

## 🏗️ System Architecture

### Core Components

1. **Enhanced Wallet System** (`enhanced_wallets` table)
   - Real-time balance tracking
   - Tier-based progression (Bronze → Silver → Gold → Platinum)
   - External service synchronization
   - Points and monetary balance management

2. **Rewards System** (`reward_definitions` + `user_rewards` tables)
   - Configurable reward types (discount, cashback, product, service, badge)
   - Points-based redemption
   - Expiration and status management
   - Real-time updates

3. **Donations System** (`donation_campaigns` + `user_donations` tables)
   - Campaign-based fundraising
   - Points earning for donations
   - Progress tracking and goal setting

4. **Withdrawal System** (`withdrawal_requests` table)
   - Multiple payment methods (bank transfer, mobile money, PayPal, crypto)
   - Status tracking and admin approval workflow
   - Account details encryption

5. **Metrics & Analytics** (`user_metrics` + `system_metrics` tables)
   - Environmental impact calculations
   - User performance tracking
   - System-wide statistics
   - Real-time data collection

6. **Cross-Repository Sync** (`external_services` + `sync_queue` tables)
   - External service integration
   - Queue-based synchronization
   - Webhook management
   - API key management

## 🗄️ Database Schema

### Key Tables

#### Enhanced Wallets
```sql
enhanced_wallets (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE,
  balance DECIMAL(10,2),
  total_points INTEGER,
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  external_wallet_id TEXT,
  last_sync_at TIMESTAMP,
  sync_status TEXT CHECK (sync_status IN ('synced', 'pending', 'failed'))
)
```

#### Reward Definitions
```sql
reward_definitions (
  id UUID PRIMARY KEY,
  reward_code TEXT UNIQUE,
  name TEXT,
  description TEXT,
  points_cost INTEGER,
  monetary_value DECIMAL(10,2),
  reward_type TEXT CHECK (reward_type IN ('discount', 'cashback', 'product', 'service', 'badge')),
  is_active BOOLEAN
)
```

#### User Rewards
```sql
user_rewards (
  id UUID PRIMARY KEY,
  user_id UUID,
  reward_definition_id UUID,
  status TEXT CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  points_spent INTEGER,
  monetary_value DECIMAL(10,2),
  redeemed_at TIMESTAMP,
  expires_at TIMESTAMP
)
```

### Database Views

#### Customer Dashboard View
Provides comprehensive pickup and wallet information:
- Pickup status and details
- Environmental impact calculations
- Wallet balance and earnings
- Collector and address information

#### Customer Wallet Balance View
Calculates accurate wallet balances:
- Base balance from enhanced_wallets
- Earnings from approved pickups
- Deductions from withdrawals and donations
- Real-time balance calculation

#### Customer Metrics View
Aggregates user performance data:
- Total pickups and status breakdown
- Weight and earnings totals
- Environmental impact summary

## 🔧 Frontend Implementation

### Services

#### WalletService (`/src/lib/walletService.ts`)
- Enhanced wallet management
- Real-time subscriptions
- Environmental impact calculations
- Tier progression tracking
- Cross-service synchronization

#### RewardsService (`/src/lib/rewardsService.ts`)
- Reward definition management
- User reward redemption
- Donation campaign handling
- Withdrawal request processing
- Real-time updates

### Hooks

#### useWallet (`/src/hooks/useWallet.ts`)
Comprehensive wallet data management:
```typescript
const {
  // Legacy properties (backward compatibility)
  balance, points, tier, totalEarnings,
  
  // Enhanced properties
  environmentalImpact, tierBenefits, nextTierRequirements,
  customerMetrics, customerDashboard, customerPerformance,
  
  // Actions
  refreshWallet, syncWalletBalances, updateWalletWithSync
} = useWallet(userId);
```

#### useRewards (`/src/hooks/useRewards.ts`)
Complete rewards system management:
```typescript
const {
  // Data
  availableRewards, userRewards, donationCampaigns,
  
  // Actions
  redeemReward, createDonation, createWithdrawalRequest,
  
  // Utilities
  getAffordableRewards, getUserRewardStats, calculateDonationProgress
} = useRewards(userId);
```

### Components

#### Dashboard (`/src/components/Dashboard.tsx`)
Enhanced dashboard with:
- Real-time wallet balance
- Environmental impact visualization
- Tier progression tracking
- Pickup statistics
- Tier benefits display

#### Rewards (`/src/components/Rewards.tsx`)
Dynamic rewards system:
- Real-time reward availability
- Points-based redemption
- Donation campaigns
- Withdrawal requests
- Real-time updates

## 🌱 Environmental Impact Tracking

### Calculations

The system automatically calculates environmental impact based on recycling data:

- **CO₂ Saved**: 0.5 kg per kg recycled
- **Water Saved**: 0.1 liters per kg recycled  
- **Landfill Saved**: 0.3 kg per kg recycled
- **Trees Equivalent**: CO₂ saved ÷ 22 (annual tree absorption)

### Real-Time Updates

Environmental impact is calculated in real-time using:
- Database views for performance
- Materialized views for analytics
- Triggers for automatic updates
- Real-time subscriptions for live data

## 🏆 Tier System

### Progression Levels

| Tier | Points Required | Benefits |
|------|----------------|----------|
| Bronze | 0+ | Basic recycling rewards, standard access |
| Silver | 100+ | Enhanced rewards, priority support |
| Gold | 500+ | Premium rewards, VIP support, early access |
| Platinum | 1000+ | Maximum rewards, dedicated support, beta access |

### Tier Benefits

Each tier provides:
- **Bronze**: Basic recycling rewards, access to standard rewards, monthly reports
- **Silver**: Enhanced recycling rewards, priority customer support, exclusive silver-tier rewards
- **Gold**: Premium recycling rewards, VIP customer support, exclusive gold-tier rewards, early feature access
- **Platinum**: Maximum recycling rewards, dedicated customer support, exclusive platinum-tier rewards, beta feature access

## 💰 Financial Management

### Wallet Operations

- **Real-time Balance**: Calculated from all transactions
- **Points System**: 1 point per kg recycled
- **Automatic Sync**: Cross-service synchronization
- **Audit Trail**: Complete transaction history

### Withdrawal Methods

- Bank Transfer
- Mobile Money
- PayPal
- Cryptocurrency

### Donation System

- Campaign-based fundraising
- Points earning (1 point per R1 donated)
- Progress tracking
- Goal setting and achievement

## 🔄 Real-Time Features

### Subscriptions

The system provides real-time updates for:
- Wallet balance changes
- Reward redemptions
- Donation updates
- Withdrawal status changes
- Pickup status updates

### Implementation

```typescript
// Subscribe to wallet changes
const subscription = WalletService.subscribeToEnhancedWalletChanges(
  userId, 
  (updatedWallet) => {
    // Handle real-time wallet updates
    updateWalletDisplay(updatedWallet);
  }
);

// Subscribe to reward changes
const rewardSubscription = RewardsService.subscribeToRewardChanges(
  userId,
  (updatedReward) => {
    // Handle real-time reward updates
    updateRewardsDisplay(updatedReward);
  }
);
```

## 🚀 Performance Optimizations

### Database Indexes

- User-specific queries optimized
- Status-based filtering
- Date range queries
- Real-time subscription performance

### Materialized Views

- Customer performance summary
- Environmental impact calculations
- Monthly statistics
- Auto-refresh triggers

### Caching Strategy

- Real-time data subscriptions
- Optimistic updates
- Background synchronization
- Error handling and retry logic

## 🔒 Security Features

### Row Level Security (RLS)

- User-specific data access
- Role-based permissions
- Admin-only system operations
- Secure external service integration

### Data Encryption

- Account details encryption
- API key hashing
- Webhook signature verification
- Secure external communications

## 📊 Analytics & Reporting

### User Metrics

- Daily activity tracking
- Pickup performance
- Environmental impact
- Financial transactions

### System Metrics

- Platform-wide statistics
- User engagement metrics
- Environmental impact totals
- Performance indicators

### Export Capabilities

- Real-time data access
- Historical analysis
- Custom date ranges
- External service integration

## 🛠️ Development & Testing

### Setup Instructions

1. **Database Schema**
   ```bash
   # Run the rewards-metrics-system.sql in Supabase
   # This creates all tables, views, and functions
   ```

2. **Frontend Dependencies**
   ```bash
   npm install
   # All required dependencies are already included
   ```

3. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Testing

- **Unit Tests**: Service layer testing
- **Integration Tests**: Database operations
- **E2E Tests**: User workflows
- **Performance Tests**: Real-time subscriptions

## 🔮 Future Enhancements

### Planned Features

- **Advanced Analytics**: Machine learning insights
- **Gamification**: Achievement badges, leaderboards
- **Social Features**: Community challenges, sharing
- **Mobile App**: Native mobile experience
- **API Marketplace**: Third-party integrations

### Scalability

- **Microservices**: Service decomposition
- **Event Sourcing**: Complete audit trail
- **CQRS**: Read/write optimization
- **Distributed Caching**: Redis integration

## 📚 API Documentation

### Wallet Operations

```typescript
// Get enhanced wallet
const wallet = await WalletService.getEnhancedWallet(userId);

// Update wallet with sync
const success = await WalletService.updateWalletWithSync(
  userId, 
  balanceChange, 
  pointsChange, 
  description
);

// Sync all wallets
await WalletService.syncWalletBalances();
```

### Reward Operations

```typescript
// Get available rewards
const rewards = await RewardsService.getActiveRewards();

// Redeem reward
const redeemedReward = await RewardsService.redeemReward({
  reward_definition_id: rewardId,
  user_id: userId
});

// Create donation
const donation = await RewardsService.createDonation({
  campaign_id: campaignId,
  amount: 50.00,
  donation_type: 'monetary',
  user_id: userId
});
```

## 🤝 Contributing

### Development Guidelines

1. **Type Safety**: Full TypeScript implementation
2. **Error Handling**: Comprehensive error management
3. **Real-time**: Live data updates throughout
4. **Performance**: Optimized database queries
5. **Security**: RLS policies and data encryption

### Code Standards

- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- React best practices
- Supabase patterns

## 📞 Support

### Getting Help

- **Documentation**: This README and inline code comments
- **Issues**: GitHub issue tracking
- **Community**: Developer forums and discussions
- **Support**: Technical support team

### Troubleshooting

Common issues and solutions:
- **Real-time not working**: Check Supabase configuration
- **Database errors**: Verify schema installation
- **Performance issues**: Check database indexes
- **Authentication errors**: Verify RLS policies

---

**WozaMali Rewards System** - Building a sustainable future through smart recycling rewards and environmental impact tracking.
