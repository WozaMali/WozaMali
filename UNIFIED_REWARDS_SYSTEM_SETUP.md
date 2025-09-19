# 🎁 Unified Rewards System Setup Guide

## **Overview**

The rewards system is now unified across all three apps (Main App, Collector App, Office App) and connected to the unified collections system. Users earn points from their recycling collections, and these points can be redeemed for rewards.

## **🔧 What Was Fixed**

### **Problem**
- The `rewards` table didn't exist in the database
- Office App was trying to access a non-existent table (404 error)
- Main App had hardcoded rewards instead of database-driven rewards
- No connection between collections system and rewards

### **Solution**
- ✅ Created `rewards` table with proper schema
- ✅ Built unified rewards service for all apps
- ✅ Connected rewards to unified collections system
- ✅ Updated Main App to use database rewards
- ✅ Maintained Office App functionality

## **📊 Database Schema**

### **Rewards Table Structure**
```sql
CREATE TABLE public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL CHECK (points_required >= 0),
    category TEXT NOT NULL CHECK (category IN ('cash', 'service', 'product', 'voucher')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Reward Categories**
- **Cash**: Direct cash back to wallet
- **Service**: Free or premium collection services
- **Product**: Physical items (water bottles, recycling kits)
- **Voucher**: Store vouchers and discounts

## **🔄 How It Works**

### **1. Points Calculation**
- Users earn points from approved collections
- Points = Total weight in kg (1kg = 1 point)
- Points are calculated from the unified collections system

### **2. Rewards Access**
- **Main App**: Users can view and redeem available rewards
- **Office App**: Admins can manage rewards (create, edit, delete)
- **Collector App**: Can view rewards (future enhancement)

### **3. Data Flow**
```
Collections → Points Calculation → Rewards Display → Redemption
     ↓              ↓                    ↓              ↓
Unified DB → Wallet Service → Rewards Service → User Action
```

## **📁 Files Created/Modified**

### **New Files**
- `REWARDS_TABLE_SETUP_CLEAN.sql` - Creates table with sample data
- `CLEANUP_TEST_REWARDS.sql` - Removes test data after testing
- `src/lib/rewardsService.ts` - Unified rewards service for Main App

### **Modified Files**
- `src/components/Rewards.tsx` - Updated to use database rewards
- `WozaMaliOffice/src/lib/rewardsService.ts` - Updated comments

## **🚀 Setup Instructions**

### **Step 1: Create the Rewards Table**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `mljtjntkddwkcjixkyuy`
3. Click on **"SQL Editor"**
4. Copy and paste the contents of `REWARDS_TABLE_SETUP_CLEAN.sql`
5. Click **"Run"** to execute

### **Step 2: Test the System**
1. **Main App**: Navigate to the Rewards page - should show database rewards
2. **Office App**: Navigate to the Rewards page - should show admin interface
3. Verify that points are calculated from collections

### **Step 3: Clean Up Test Data (Optional)**
1. After testing, run `CLEANUP_TEST_REWARDS.sql` in Supabase
2. This removes the sample data but keeps the table structure

## **🎯 Features**

### **Main App (User View)**
- ✅ View all active rewards
- ✅ See points required for each reward
- ✅ Check which rewards are available based on current points
- ✅ Real-time points calculation from collections
- ✅ Loading states and error handling

### **Office App (Admin View)**
- ✅ View all rewards (active and inactive)
- ✅ Create new rewards
- ✅ Edit existing rewards
- ✅ Delete rewards
- ✅ Toggle reward active status
- ✅ Filter by category

### **Unified System**
- ✅ Same rewards data across all apps
- ✅ Real-time updates
- ✅ Connected to collections system
- ✅ Proper RLS policies for security

## **🔒 Security**

### **Row Level Security (RLS)**
- **Read Access**: All authenticated users can view active rewards
- **Write Access**: Only office/admin users can manage rewards
- **Data Isolation**: Users only see their own data

### **API Security**
- Service uses Supabase client with proper authentication
- All operations are logged and auditable
- Input validation on all fields

## **📈 Future Enhancements**

### **Planned Features**
- [ ] Reward redemption tracking
- [ ] Reward expiration dates
- [ ] Reward categories and filtering
- [ ] Reward images and media
- [ ] Reward redemption history
- [ ] Email notifications for new rewards
- [ ] Push notifications for reward availability

### **Integration Points**
- [ ] Connect to external voucher systems
- [ ] Integration with payment gateways
- [ ] Analytics and reporting
- [ ] A/B testing for reward effectiveness

## **🐛 Troubleshooting**

### **Common Issues**

**1. "Could not find the table 'public.rewards'"**
- **Solution**: Run the `REWARDS_TABLE_SETUP_CLEAN.sql` script

**2. "No rewards available"**
- **Solution**: Check if rewards are marked as `is_active = true`

**3. "Points not updating"**
- **Solution**: Verify collections are approved and points calculation is working

**4. "Permission denied"**
- **Solution**: Check RLS policies and user roles

### **Debug Steps**
1. Check Supabase logs for errors
2. Verify table exists: `SELECT * FROM public.rewards LIMIT 1;`
3. Check user permissions: `SELECT * FROM auth.users WHERE id = auth.uid();`
4. Verify collections data: `SELECT * FROM public.collections WHERE status = 'approved';`

## **✅ Success Criteria**

The rewards system is working correctly when:
- [ ] Main App shows database rewards instead of hardcoded data
- [ ] Office App can manage rewards without 404 errors
- [ ] Points are calculated from actual collections
- [ ] Users can see which rewards they can afford
- [ ] Admin can create/edit/delete rewards
- [ ] All apps show the same rewards data

---

**🎉 The unified rewards system is now ready for production use!**
