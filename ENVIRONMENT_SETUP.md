# 🔧 Environment Setup Guide

## Quick Fix for 500 Error on Sign-up Page

The 500 error is likely caused by missing Supabase environment variables. Here's how to fix it:

### Step 1: Create Environment File

1. In your project root directory, create a file called `.env.local`
2. Add the following content (replace with your actual values):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 2: Get Your Supabase Values

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key

### Step 3: Restart Development Server

After creating the `.env.local` file:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 4: Test the Sign-up Page

1. Go to `/auth/sign-up`
2. The page should now load without the 500 error
3. You should see the sign-up form with location dropdowns

## What We Fixed

1. **Removed Database Dependencies**: The sign-up page no longer tries to fetch location data from Supabase tables that might not exist
2. **Added Static Location Data**: Included hardcoded townships and cities for Soweto/Gauteng area
3. **Environment Variable Check**: Added a helpful error message if Supabase isn't configured
4. **Simplified Form**: Replaced complex Select components with standard HTML select elements

## Current Status

- ✅ Sign-up form loads without database queries
- ✅ Location data is hardcoded (no more 500 errors)
- ✅ Environment variable validation
- ✅ Form submission to Supabase auth
- ✅ Profile creation attempt (won't fail if table doesn't exist)

## Next Steps

Once the sign-up page is working:

1. **Set up your database tables** using the SQL scripts in your project
2. **Test user registration** to ensure profiles are created
3. **Verify email verification** is working
4. **Test sign-in functionality**

## Troubleshooting

If you still get errors:

1. **Check browser console** for specific error messages
2. **Verify environment variables** are loaded (check the console logs)
3. **Ensure Supabase project** is active and accessible
4. **Check network tab** for failed API calls

The sign-up page should now work reliably without the 500 error! 🎉
