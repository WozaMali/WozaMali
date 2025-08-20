# 🚀 Complete WozaMoney Supabase Setup & Fixes

## 📋 What We've Fixed

### 1. Database Schema Issues
- ✅ Added missing `pg_cron` extension support
- ✅ Fixed table creation with proper constraints
- ✅ Improved error handling in database functions
- ✅ Added proper indexes for performance

### 2. Row Level Security (RLS) Policies
- ✅ Recreated all RLS policies with proper permissions
- ✅ Fixed policy conflicts and duplicates
- ✅ Added admin access for email templates
- ✅ Ensured users can only access their own data

### 3. Database Functions
- ✅ Fixed `handle_new_user()` function with error handling
- ✅ Added `sync_existing_users()` function for migration
- ✅ Improved trigger functions for user management

### 4. Environment Configuration
- ✅ Fixed environment variable setup
- ✅ Added proper service role key configuration
- ✅ Ensured secure key management

## 🔧 Setup Instructions

### Step 1: Get Your Service Role Key

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `mljtjntkddwkcjixkyuy`
3. Go to **Settings** → **API**
4. Copy the **service_role** key (NOT the anon key)
5. Update your `.env` file:

```env
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

### Step 2: Run the Database Setup

1. In Supabase dashboard, go to **SQL Editor**
2. Run the main setup script first:
   - Copy and paste the contents of `supabase-setup.sql`
   - Click "Run" to execute

3. Then run the fixes script:
   - Copy and paste the contents of `supabase-fixes.sql`
   - Click "Run" to execute

### Step 3: Verify the Setup

After running both scripts, you should see:

1. **Table Counts**: Shows profiles, wallets, and auth users
2. **RLS Status**: All tables should show `rowsecurity: true`
3. **No Errors**: All functions and triggers should be created successfully

### Step 4: Test Authentication

1. Restart your Next.js development server:
   ```bash
   npm run dev
   ```

2. Go to `/auth/sign-up` and create a test account
3. Check that:
   - User is created in `auth.users`
   - Profile is created in `public.profiles`
   - Wallet is created in `public.wallets`
   - Activity is logged in `public.user_activity_log`

## 🗄️ Database Structure

### Tables Created

| Table | Purpose | RLS Enabled |
|-------|---------|-------------|
| `profiles` | User profile information | ✅ |
| `wallets` | User wallet and points | ✅ |
| `password_reset_tokens` | Secure password resets | ✅ |
| `user_sessions` | Session management | ✅ |
| `user_activity_log` | Audit trail | ✅ |
| `email_templates` | Email notification templates | ✅ |
| `email_logs` | Email delivery tracking | ✅ |

### Key Features

- **Automatic Profile Creation**: When a user signs up, profile and wallet are automatically created
- **Row Level Security**: Users can only access their own data
- **Activity Logging**: All user actions are logged for audit purposes
- **Password Reset**: Secure token-based password reset system
- **Email Templates**: Customizable email notifications

## 🔐 Security Features

### RLS Policies

- **Profiles**: Users can only view/update their own profile
- **Wallets**: Users can only access their own wallet
- **Sessions**: Users can only manage their own sessions
- **Activity Logs**: Users can only see their own activity
- **Email Templates**: Admin-only access
- **Email Logs**: Users can only see their own email history

### Data Protection

- All sensitive operations use `SECURITY DEFINER`
- Proper foreign key constraints with CASCADE deletes
- Input validation and sanitization
- Secure token generation and verification

## 🚨 Troubleshooting

### Common Issues

**"Extension pg_cron does not exist"**
- This is normal on Supabase free tier
- Use Supabase's built-in cron jobs instead
- Go to Dashboard > Database > Functions > Create cron job

**"Policy already exists"**
- The fixes script handles this automatically
- Policies are dropped and recreated

**"Function already exists"**
- Functions are replaced with `CREATE OR REPLACE`
- No data loss occurs

**"RLS not enabled"**
- Run the fixes script to ensure RLS is enabled
- Check the verification query at the end

### Verification Queries

Run these in SQL Editor to verify setup:

```sql
-- Check table counts
SELECT 
  'Profiles' as table_name,
  COUNT(*) as record_count
FROM public.profiles
UNION ALL
SELECT 
  'Wallets' as table_name,
  COUNT(*) as record_count
FROM public.wallets;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'wallets', 'password_reset_tokens');
```

## 🎯 Next Steps

### 1. Test User Registration
- Create a test account
- Verify profile and wallet creation
- Check activity logging

### 2. Test Authentication
- Sign in with test account
- Verify session management
- Test profile updates

### 3. Add More Features
- Collections and rewards system
- Transaction history
- Real-time updates
- File storage for avatars

### 4. Monitor Performance
- Check query performance
- Monitor RLS policy effectiveness
- Review activity logs

## 📞 Support

If you encounter issues:

1. Check the Supabase logs in your dashboard
2. Verify all SQL scripts ran without errors
3. Ensure environment variables are correct
4. Check that RLS is enabled on all tables

## 🔄 Maintenance

### Regular Tasks

- Monitor user activity logs
- Clean up expired sessions and tokens
- Review and update email templates
- Check database performance

### Backup

- Supabase automatically backs up your database
- Consider exporting important data periodically
- Test restore procedures

---

**Your Supabase setup is now complete and secure! 🎉**

All tables, policies, and functions are properly configured for production use.
