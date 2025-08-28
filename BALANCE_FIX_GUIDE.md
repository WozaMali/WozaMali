# 🔧 Fix Dashboard Balance Display Issue

## 🚨 Problem
The wallet balance is not showing on the dashboard, showing "Error" or "Failed to load balance" instead of the actual balance amount.

## 🔍 Root Causes
1. **Database Tables Missing**: The `wallets` or `enhanced_wallets` tables don't exist
2. **RLS Policies**: Row Level Security policies are blocking access to wallet data
3. **Missing Wallet Records**: User profiles exist but no corresponding wallet records
4. **Authentication Issues**: User is not properly authenticated when fetching wallet data

## 🛠️ Solution Steps

### Step 1: Run Database Setup Script

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `mljtjntkddwkcjixkyuy`
3. Go to **SQL Editor**
4. Copy and paste the entire contents of `quick-wallet-setup.sql`
5. Click **Run** to execute the script

**Expected Output:**
```
Setup Complete | wallets_count | enhanced_wallets_count | profiles_count
Setup Complete | 1             | 1                     | 1
```

### Step 2: Verify Database Tables

After running the setup script, check that these tables exist:

```sql
-- Check if tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('wallets', 'enhanced_wallets', 'profiles');

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'wallets';
```

### Step 3: Check RLS Policies

Verify that Row Level Security is properly configured:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('wallets', 'enhanced_wallets');

-- Check policies
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('wallets', 'enhanced_wallets');
```

### Step 4: Test with Your User Account

1. **Sign out** of your application
2. **Sign in** again with your credentials
3. Go to the **Dashboard** page
4. Check the browser console for any error messages

### Step 5: Use Debug Tools

The dashboard now includes debug tools:

1. **Database Button** (🔍): Shows raw wallet data from Supabase
2. **Refresh Button** (🔄): Checks wallet table status and refreshes data
3. **Error Retry Button**: Click "Click to retry" if balance shows error

## 🔧 Manual Database Check

If the setup script doesn't work, manually check your database:

```sql
-- 1. Check if you have a profile
SELECT * FROM public.profiles WHERE email = 'your-email@example.com';

-- 2. Check if you have a wallet
SELECT * FROM public.wallets WHERE user_id = 'your-user-id';

-- 3. Check if you have an enhanced wallet
SELECT * FROM public.enhanced_wallets WHERE user_id = 'your-user-id';

-- 4. Create wallet manually if missing
INSERT INTO public.wallets (user_id, balance, total_points, tier)
VALUES ('your-user-id', 50.00, 50, 'bronze');
```

## 🐛 Troubleshooting

### Issue: "Permission denied" or "42501" error
**Solution**: Run the database setup script to create tables and RLS policies

### Issue: "No wallet found" error
**Solution**: The setup script should create wallets automatically, but you can create one manually

### Issue: Balance shows "Error" with retry button
**Solution**: Click the retry button or use the refresh button to force a data refresh

### Issue: Tables exist but no data
**Solution**: Check if your user profile exists and create a wallet record manually

## 📱 Testing the Fix

1. **Clear browser cache** and cookies
2. **Restart your Next.js development server**:
   ```bash
   npm run dev
   ```
3. **Sign in** to your account
4. **Navigate to Dashboard**
5. **Check the balance display** - should show R 50.00 or your actual balance

## 🔍 Debug Information

The dashboard now includes enhanced logging. Check your browser console for:

- `SimpleWalletService: Fetching wallet data for user: [user-id]`
- `Dashboard: Using simple wallet balance: [amount]`
- `Dashboard Debug - Wallet Values: [detailed info]`

## 📞 Still Having Issues?

If the problem persists:

1. **Check browser console** for error messages
2. **Verify your Supabase project** is active and accessible
3. **Ensure your environment variables** are correctly set in `.env`
4. **Check if your user account** has the correct permissions

## 🎯 Expected Result

After following these steps, your dashboard should display:
- ✅ **Wallet Balance**: R 50.00 (or your actual balance)
- ✅ **Recycling Level**: Bronze Recycler (or your tier)
- ✅ **Points Earned**: 50 points (or your actual points)
- ✅ **No Error Messages**: Clean balance display

---

**Note**: The setup script creates a default balance of R 50.00 and 50 points for new users. You can adjust these values in the script if needed.
