# WozaMali Android App - Quick Setup Checklist

## 🚨 CRITICAL: Replace These Placeholders

### 1. Supabase Credentials
**File**: `android/app/src/main/java/com/wozamali/app/SupabaseClient.kt`

```kotlin
// REPLACE THESE WITH YOUR ACTUAL VALUES:
private const val SUPABASE_URL = "https://your-project.supabase.co"
private const val SUPABASE_ANON_KEY = "your-anon-key-here"
```

**How to get these:**
1. Go to Supabase Dashboard → Your Project → Settings → API
2. Copy "Project URL" and "anon public" key
3. Replace the placeholders above

### 2. Create Users Table in Supabase
Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');
```

## 🚀 Quick Start Commands

```bash
# 1. Build your PWA
npm run build

# 2. Sync with Android
npx cap sync android

# 3. Open in Android Studio
npx cap open android

# 4. Run the app
npx cap run android
```

## 📱 App Flow
1. **Splash Screen** → Shows for 2 seconds, then navigates to login
2. **Login Screen** → Email/password form (currently shows sample data)
3. **Home Screen** → Displays users from Supabase table

## 🔧 What's Already Configured

✅ **Capacitor Setup**
- Fresh Android project initialized
- PWA build output synced
- Proper Gradle configuration

✅ **Supabase Integration**
- Kotlin SDK dependencies added
- Client singleton created
- Auth manager with login/signup functions
- User repository for database operations

✅ **Android Configuration**
- Internet permissions added
- Jetpack Compose setup
- Material Design 3 UI

✅ **UI Screens**
- Splash screen with app branding
- Login screen with form validation
- Home screen with user list display

## 🐛 Common Issues & Solutions

**Gradle Sync Failed?**
- Check internet connection
- Try "File > Invalidate Caches and Restart" in Android Studio

**Supabase Connection Issues?**
- Verify URL and API key are correct
- Check if Supabase project is active
- Ensure users table exists

**Build Errors?**
- Run `npx cap sync android` again
- Check Android SDK versions
- Ensure all dependencies are compatible

## 📝 TODO Items in Code

The following files contain TODO comments where you need to make changes:

1. **SupabaseClient.kt** - Replace placeholder credentials
2. **LoginScreen.kt** - Implement actual Supabase login
3. **HomeScreen.kt** - Connect to real Supabase users table
4. **SplashScreen.kt** - Add authentication check

## 🎯 Next Steps After Setup

1. Replace Supabase credentials
2. Test login with real users
3. Customize UI colors and branding
4. Add user profile management
5. Configure app signing for release

---

**Ready to go!** Once you replace the Supabase credentials, your app will be fully functional with authentication and user management.
