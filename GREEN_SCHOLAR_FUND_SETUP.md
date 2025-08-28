# 🎓 Green Scholar Fund Setup Guide

## Overview
The Green Scholar Fund has been enhanced to collect PET/Plastic Bottle information in Supabase and provide real-time updates for donations and monthly targets. This system tracks both monetary donations and bottle collections to support educational initiatives.

## 🗄️ Database Setup

### 1. Run the Database Script
Execute the `green-scholar-fund-setup.sql` script in your Supabase SQL editor:

```sql
-- This will create all necessary tables, policies, and functions
-- Run the entire script in Supabase SQL Editor
```

### 2. Tables Created

#### `green_scholar_fund_donations`
- Tracks monetary donations from users
- Supports wallet, MTN MoMo, and cash payment methods
- Status tracking: pending, completed, failed

#### `green_scholar_fund_bottles`
- Tracks PET/Plastic bottle collections
- Records bottle count, weight, type, and collection date
- Status tracking: pending, verified, processed
- Each kg contributes R2 to the fund

#### `green_scholar_fund_stats`
- Real-time fund statistics
- Monthly goals and progress tracking
- Automatic calculation of total fund value
- Progress percentage and remaining amount

#### `green_scholar_fund_applications`
- Student applications for support
- Multi-step form data storage
- Application status tracking

### 3. Real-time Features
- **Automatic Updates**: Fund statistics update in real-time
- **Triggers**: Database triggers automatically recalculate totals
- **Subscriptions**: Frontend subscribes to real-time changes
- **Progress Tracking**: Monthly goal progress with visual indicators

## 🚀 Frontend Integration

### 1. New Service Layer
```typescript
// src/lib/greenScholarFundService.ts
- Handles all database operations
- Real-time subscriptions
- Error handling and validation
```

### 2. Custom Hook
```typescript
// src/hooks/useGreenScholarFund.ts
- Manages fund state
- Real-time data synchronization
- User contributions tracking
```

### 3. Enhanced Component
```typescript
// src/components/GreenScholarFund.tsx
- Real-time fund statistics display
- PET/Plastic bottle collection form
- Progress tracking visualization
- User contribution breakdown
```

## 📊 Features

### Real-time Fund Statistics
- **Total Fund**: Combined donations + bottle value
- **Monthly Goal**: R50,000 target
- **Progress**: Visual percentage indicator
- **Remaining**: Amount needed to reach goal

### PET/Plastic Bottle Collection
- **Collection Form**: Submit bottle count and weight
- **Type Selection**: PET, HDPE, Other
- **Value Calculation**: R2 per kg automatically calculated
- **Status Tracking**: Pending → Verified → Processed

### User Contributions
- **Personal Dashboard**: View your contributions
- **Bottle Collections**: Track your recycling impact
- **Donations**: Monitor your monetary support
- **Total Impact**: Combined contribution value

### Application System
- **Multi-step Form**: 5-step application process
- **Documentation**: Required document tracking
- **Status Updates**: Application review process
- **Database Storage**: Persistent application data

## 🔧 Configuration

### Environment Variables
Ensure these are set in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Permissions
The setup script automatically configures:
- Row Level Security (RLS) policies
- User authentication requirements
- Proper table permissions
- Function execution rights

## 📱 Usage

### For Users
1. **View Fund Status**: See real-time progress
2. **Submit Bottles**: Collect and submit PET bottles
3. **Make Donations**: Support via wallet or MTN MoMo
4. **Apply for Support**: Submit student applications

### For Administrators
1. **Monitor Fund**: Track monthly progress
2. **Verify Collections**: Approve bottle submissions
3. **Review Applications**: Process student requests
4. **Update Goals**: Modify monthly targets

## 🔄 Real-time Updates

### Automatic Triggers
- **Bottle Collections**: Updates fund value immediately
- **Donations**: Adds to total fund instantly
- **Statistics**: Recalculates progress automatically
- **User Data**: Syncs contributions in real-time

### Frontend Subscriptions
- **Fund Stats**: Live progress updates
- **User Collections**: Personal contribution tracking
- **Donations**: Real-time donation history
- **Applications**: Status change notifications

## 📈 Progress Tracking

### Monthly Goals
- **Default Target**: R50,000 per month
- **Progress Calculation**: (Total Fund / Monthly Goal) × 100
- **Remaining Amount**: Monthly Goal - Total Fund
- **Visual Indicators**: Progress bars and percentages

### Bottle Value
- **Rate**: R2 per kilogram
- **Types Supported**: PET, HDPE, Other
- **Verification Process**: Admin approval required
- **Automatic Calculation**: Weight × Rate = Value

## 🛠️ Troubleshooting

### Common Issues
1. **Database Connection**: Check Supabase credentials
2. **RLS Policies**: Ensure user authentication
3. **Real-time Updates**: Verify subscription setup
4. **Type Errors**: Check TypeScript interfaces

### Debug Steps
1. Check browser console for errors
2. Verify Supabase table permissions
3. Test database functions manually
4. Check RLS policy configuration

## 🚀 Next Steps

### Potential Enhancements
1. **Admin Dashboard**: Fund management interface
2. **Analytics**: Detailed reporting and insights
3. **Notifications**: Email/SMS alerts for updates
4. **Mobile App**: Native mobile application
5. **Payment Integration**: Direct payment processing

### Integration Points
1. **Wallet System**: Connect with existing wallet
2. **User Profiles**: Link with user management
3. **Reporting**: Export data for analysis
4. **API Endpoints**: External system integration

## 📚 API Reference

### Service Methods
```typescript
// Bottle Collections
submitBottleCollection(collection: BottleCollection)
getUserBottleCollections(userId: string)
getUserBottleContributions(userId: string)

// Donations
submitDonation(donation: Donation)
getUserDonations(userId: string)

// Fund Statistics
getCurrentFundStats()
getFundStatsForMonth(monthYear: string)

// Applications
submitApplication(application: ApplicationData)
getUserApplications(userId: string)
```

### Real-time Subscriptions
```typescript
// Subscribe to fund updates
subscribeToFundStats(callback: (stats: FundStats) => void)

// Subscribe to user collections
subscribeToBottleCollections(userId: string, callback)

// Subscribe to user donations
subscribeToDonations(userId: string, callback)
```

## 🎯 Success Metrics

### Fund Performance
- Monthly goal achievement
- Total funds raised
- Number of beneficiaries supported
- Community participation rates

### User Engagement
- Bottle collection frequency
- Donation amounts and frequency
- Application submission rates
- User retention and activity

---

**Note**: This system provides a comprehensive foundation for managing the Green Scholar Fund with real-time tracking, user engagement, and transparent progress monitoring. All data is securely stored with proper user authentication and access controls.
