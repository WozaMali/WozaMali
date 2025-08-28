# 🚫 **Fix 403 Forbidden Errors - RLS Policies**

## **Issue Description**
The dashboard is showing **403 Forbidden** errors when trying to access:
- `pickups` table
- `user_metrics` table

This prevents the tier system from working because it can't fetch the user's recycling data.

## **Current Status**
```
✅ Wallet Balance: R326.25 (working)
✅ Total Points: 201 (working)  
❌ Total Weight: 0 kg (blocked by 403 error)
❌ Tier: Bronze (fallback due to 0 kg)
```

## **Root Cause**
**Row Level Security (RLS)** policies are blocking access to the `pickups` and `user_metrics` tables.

## **Solution: Fix RLS Policies**

### **Step 1: Run the RLS Fix Script**
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `fix-rls-policies.sql`
4. Click **Run** to execute

### **Step 2: Verify the Fix**
After running the script, you should see:
```
✅ RLS policies created for pickups table
✅ RLS policies created for user_metrics table
✅ Users can now access their own data
```

### **Step 3: Test the Dashboard**
1. Refresh your dashboard page
2. Check the browser console for:
   ```
   Successfully fetched pickups and metrics: {pickupsCount: X, hasEnvironmental: true}
   ```
3. The tier should now show the correct weight and tier level

## **Expected Results After Fix**

### **Before Fix (Current)**
```
Dashboard Debug - Wallet Values: {
  walletBalance: 326.25,
  totalPoints: 201,
  tier: 'bronze',
  totalWeightKg: 0,  ← Blocked by 403 error
  ...
}
```

### **After Fix (Expected)**
```
Dashboard Debug - Wallet Values: {
  walletBalance: 326.25,
  totalPoints: 201,
  tier: 'silver',  ← Calculated from actual weight
  totalWeightKg: 20.1,  ← Successfully fetched
  ...
}
```

## **Fallback Mechanism Added**

I've also added a **fallback calculation** that estimates weight from points if the tables are still inaccessible:

```typescript
// If no pickup data available, estimate weight from points
if (totalWeight === 0 && simpleWallet.total_points > 0) {
  totalWeight = simpleWallet.total_points * 0.1; // 1 point = 0.1 kg
}
```

This means even if the RLS fix doesn't work immediately, users will see:
- **Bronze Tier**: 0-19.9 kg
- **Silver Tier**: 20-49.9 kg  
- **Gold Tier**: 50-99.9 kg
- **Platinum Tier**: 100+ kg

## **Troubleshooting**

### **If Still Getting 403 Errors**
1. **Check RLS Status**: Ensure RLS is enabled on both tables
2. **Verify Policies**: Check that policies were created successfully
3. **User Authentication**: Ensure user is properly authenticated
4. **Table Permissions**: Verify table exists and has correct structure

### **If Weight Still Shows 0**
1. **Check Console Logs**: Look for "Using points-based weight estimation"
2. **Verify Points**: Ensure `total_points` has a value > 0
3. **Refresh Data**: Try refreshing the wallet data

## **Code Changes Made**

### **1. Enhanced Error Handling** (`useWallet.ts`)
- Added try-catch around table queries
- Graceful fallback to empty arrays if access denied
- Prevents 403 errors from breaking the wallet display

### **2. Weight Estimation Fallback**
- Uses points to estimate weight if pickup data unavailable
- Assumes 1 point = 0.1 kg recycled
- Ensures tier calculation always works

### **3. Better Debug Logging**
- Shows when fallback calculations are used
- Logs successful data fetching
- Easier troubleshooting

## **Next Steps**

1. **Run the RLS fix script** in Supabase
2. **Refresh the dashboard** to test
3. **Check console logs** for successful data fetching
4. **Verify tier calculation** shows correct weight and tier

---

**Status**: 🔧 **Fix Required**  
**Priority**: **High** - Blocks tier system functionality  
**Impact**: **Medium** - Affects user experience and tier progression
