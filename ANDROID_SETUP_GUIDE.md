# WozaMali Android App Setup Guide

This guide will help you set up and run the WozaMali Android app with Supabase integration.

## Prerequisites

- Android Studio (latest version)
- Java Development Kit (JDK) 8 or higher
- Android SDK with API level 22+ (Android 5.1)
- Node.js and npm
- Supabase account and project

## Project Structure

```
android/
├── app/
│   ├── build.gradle                 # App-level dependencies and configuration
│   ├── src/main/
│   │   ├── AndroidManifest.xml      # App permissions and configuration
│   │   ├── java/com/wozamali/app/
│   │   │   ├── MainActivity.kt      # Main activity with Compose integration
│   │   │   ├── SupabaseClient.kt    # Supabase client singleton
│   │   │   ├── AuthManager.kt       # Authentication functions
│   │   │   ├── UserRepository.kt    # User data operations
│   │   │   └── ui/
│   │   │       ├── WozaMaliApp.kt   # Main navigation component
│   │   │       └── screens/
│   │   │           ├── SplashScreen.kt
│   │   │           ├── LoginScreen.kt
│   │   │           └── HomeScreen.kt
│   │   └── assets/
│   │       └── public/              # PWA build output
└── build.gradle                     # Project-level configuration
```

## Setup Instructions

### 1. Configure Supabase Credentials

**IMPORTANT**: You need to replace the placeholder values in `SupabaseClient.kt` with your actual Supabase credentials.

1. Open `android/app/src/main/java/com/wozamali/app/SupabaseClient.kt`
2. Replace the following placeholders:

```kotlin
// TODO: Replace with your actual Supabase URL
private const val SUPABASE_URL = "https://your-project.supabase.co"

// TODO: Replace with your actual Supabase anonymous key
private const val SUPABASE_ANON_KEY = "your-anon-key-here"
```

**How to get your Supabase credentials:**
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy your Project URL and anon/public key
4. Replace the placeholders in the code

### 2. Create Users Table in Supabase

Run this SQL in your Supabase SQL editor to create the users table:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all users
CREATE POLICY "Allow authenticated users to read users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow users to insert their own data
CREATE POLICY "Allow users to insert own data" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Create policy to allow users to update their own data
CREATE POLICY "Allow users to update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);
```

### 3. Build and Sync the Project

1. **Build your PWA** (if not already built):
   ```bash
   npm run build
   ```

2. **Sync Capacitor with Android**:
   ```bash
   npx cap sync android
   ```

3. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

### 4. Run the App

1. **In Android Studio:**
   - Wait for Gradle sync to complete
   - Connect an Android device or start an emulator
   - Click the "Run" button (green play icon)

2. **From command line:**
   ```bash
   npx cap run android
   ```

## App Flow

1. **Splash Screen** → Shows WozaMali logo and loading indicator
2. **Login Screen** → Email/password authentication with Supabase
3. **Home Screen** → Displays users from the Supabase users table

## Key Features Implemented

### ✅ Capacitor Setup
- Fresh Capacitor project initialized
- Android platform added with proper configuration
- PWA build output synced to Android assets

### ✅ Supabase Integration
- Supabase Kotlin SDK dependencies added
- Client singleton with placeholder credentials
- Authentication manager with login/signup/session functions
- User repository for CRUD operations

### ✅ Native Build Configuration
- AndroidManifest.xml configured with internet permissions
- build.gradle with Jetpack Compose and Kotlin dependencies
- Proper Gradle configuration for Android Studio

### ✅ UI Flow
- Splash screen with app branding
- Login screen with Supabase auth integration
- Home screen displaying users from Supabase table
- Jetpack Compose UI with Material Design 3

## Troubleshooting

### Common Issues

1. **Gradle Sync Failed**
   - Ensure you have the latest Android Studio
   - Check internet connection for dependency downloads
   - Try "File > Invalidate Caches and Restart"

2. **Supabase Connection Issues**
   - Verify your Supabase URL and API key are correct
   - Check if your Supabase project is active
   - Ensure internet permissions are granted

3. **Build Errors**
   - Clean and rebuild: `npx cap sync android`
   - Check Android SDK versions in build.gradle
   - Ensure all dependencies are compatible

### Development Workflow

1. **Make changes to your PWA**:
   ```bash
   npm run build
   npx cap sync android
   ```

2. **Make changes to native Android code**:
   - Edit files in `android/app/src/main/java/`
   - Build and run in Android Studio

3. **Test on device**:
   - Enable USB debugging on your Android device
   - Connect via USB and run the app

## Next Steps

1. **Replace placeholder Supabase credentials** with your actual values
2. **Test authentication flow** with real Supabase users
3. **Customize UI** to match your app's design
4. **Add more features** like user profile management
5. **Configure app signing** for release builds

## Support

If you encounter issues:
1. Check the Supabase documentation for Kotlin SDK
2. Review Capacitor documentation for Android setup
3. Ensure all dependencies are up to date
4. Verify your Supabase project configuration

---

**Note**: This setup provides a solid foundation for your WozaMali Android app with Supabase integration. The app is ready to be built and run in Android Studio once you add your Supabase credentials.
