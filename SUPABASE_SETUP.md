# 🚀 WozaMoney Supabase Setup Guide

## Prerequisites
- A Supabase account (free tier works great!)
- Your WozaMoney Next.js app ready

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `wozamoney` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project to be created (2-3 minutes)

## Step 2: Get Your API Keys

1. In your project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)
   - **Service Role Key** (starts with `eyJ...`) - Keep this secret!

## Step 3: Set Environment Variables

1. Create a `.env.local` file in your project root
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

3. Restart your Next.js development server

## Step 4: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-setup.sql`
3. Paste and run the script
4. Verify tables are created in **Table Editor**

## Step 5: Configure Authentication

1. Go to **Authentication** → **Settings**
2. Configure email templates:
   - **Confirm signup**: Customize welcome message
   - **Reset password**: Customize reset message
3. Set password policy (optional):
   - Minimum length: 8 characters
   - Require numbers: Yes
   - Require special characters: No

## Step 6: Test Authentication

1. Start your app: `npm run dev`
2. Go to `/signup` and create a test account
3. Check your email for confirmation
4. Try logging in at `/login`

## Step 7: Verify Database

1. In Supabase dashboard, go to **Table Editor**
2. Check that `profiles` and `wallets` tables exist
3. Verify a new user record was created when you signed up
4. Check that a wallet was automatically created

## Troubleshooting

### Common Issues

**"Missing Supabase environment variables"**
- Ensure `.env.local` exists and has correct values
- Restart your development server

**"User not found" after signup**
- Check if email confirmation is required
- Verify database trigger is working
- Check Supabase logs for errors

**Authentication not working**
- Verify API keys are correct
- Check if RLS policies are enabled
- Ensure tables exist and have correct structure

### Database Issues

**Tables not created**
- Run the SQL script again
- Check for syntax errors in Supabase logs
- Verify you have permission to create tables

**RLS policies not working**
- Ensure RLS is enabled on tables
- Check policy syntax
- Verify user authentication state

## Next Steps

Once basic authentication is working:

1. **Add more tables**: Collections, rewards, transactions
2. **Implement real-time features**: Live updates for wallet balance
3. **Add file storage**: User avatars, collection photos
4. **Set up edge functions**: Custom business logic
5. **Add analytics**: User behavior tracking

## Security Notes

- Never expose your service role key in client-side code
- Use RLS policies to restrict data access
- Regularly rotate API keys
- Monitor authentication logs for suspicious activity

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
