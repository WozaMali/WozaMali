# Woza Mali Password Reset Functionality

This document outlines the complete password reset system implemented for the Woza Mali application.

## 🚀 Features

### 1. Password Reset Flow
- **Forgot Password Page**: Users can request a password reset by entering their email
- **Email Delivery**: Secure reset links are sent to user's email address
- **Reset Password Page**: Users can set a new password using the reset link
- **Token Expiration**: Reset links expire after 1 hour for security
- **Audit Trail**: All password reset activities are logged for security monitoring

### 2. Security Features
- **Secure Token Generation**: Uses cryptographically secure random tokens
- **Token Hashing**: Tokens are stored as SHA-256 hashes in the database
- **Single-Use Tokens**: Each token can only be used once
- **Automatic Cleanup**: Expired tokens are automatically removed
- **Rate Limiting**: Built-in protection against abuse

### 3. User Experience
- **Consistent Design**: Matches the existing sign-in/sign-up page styling
- **Real-time Validation**: Password strength validation with helpful suggestions
- **Success/Error States**: Clear feedback for all user actions
- **Responsive Design**: Works seamlessly on all device sizes

## 📁 File Structure

```
src/
├── app/
│   └── auth/
│       ├── forgot-password/
│       │   └── page.tsx          # Forgot password request page
│       └── reset-password/
│           └── page.tsx          # Password reset page
├── lib/
│   ├── supabase.ts               # Updated with new database types
│   └── auth-utils.ts             # Authentication utility functions
└── components/
    └── ui/                       # UI components (existing)
```

## 🗄️ Database Schema

### New Tables Added

#### 1. `password_reset_tokens`
```sql
CREATE TABLE public.password_reset_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);
```

#### 2. `user_sessions`
```sql
CREATE TABLE public.user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL,
  device_info JSONB,
  ip_address INET,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. `user_activity_log`
```sql
CREATE TABLE public.user_activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. `email_templates`
```sql
CREATE TABLE public.email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. `email_logs`
```sql
CREATE TABLE public.email_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_name TEXT,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB
);
```

### Enhanced Existing Tables

#### `profiles` Table Updates
```sql
-- New fields added
email_verified BOOLEAN DEFAULT FALSE,
phone_verified BOOLEAN DEFAULT FALSE,
last_login TIMESTAMP WITH TIME ZONE,
login_count INTEGER DEFAULT 0,
status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'))
```

## 🔧 Database Functions

### 1. `create_password_reset_token(user_email TEXT)`
- Generates a secure random token
- Creates a hashed version for database storage
- Invalidates any existing tokens for the user
- Logs the reset request activity
- Returns the plain text token for email delivery

### 2. `verify_password_reset_token(token TEXT)`
- Verifies token validity and expiration
- Marks token as used
- Logs successful password reset
- Returns user ID for password update

### 3. `cleanup_expired_data()`
- Removes expired reset tokens
- Cleans up expired user sessions
- Archives old activity logs
- Maintains database performance

## 🛡️ Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Admin-only access for system tables
- Secure by default design

### Token Security
- 32-byte random tokens (256-bit security)
- SHA-256 hashing for storage
- 1-hour expiration window
- Single-use tokens only

### Audit Logging
- Complete activity tracking
- IP address logging
- User agent tracking
- Metadata storage for debugging

## 📧 Email Integration

### Default Templates
1. **Password Reset Template**
   - Subject: "Reset Your Woza Mali Password"
   - HTML and text versions
   - Variable substitution support

2. **Welcome Template**
   - Subject: "Welcome to Woza Mali!"
   - New user onboarding

### Email Logging
- Delivery status tracking
- Error message capture
- Metadata storage
- Performance monitoring

## 🚀 Setup Instructions

### 1. Database Setup
```bash
# Run the updated SQL schema in Supabase
psql -h your-supabase-host -U postgres -d postgres -f supabase-setup.sql
```

### 2. Environment Variables
Ensure these are set in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase Configuration
- Enable email confirmations in Authentication settings
- Configure email templates in Supabase dashboard
- Set up email provider (SendGrid, AWS SES, etc.)

### 4. Application Deployment
```bash
# Build and deploy
npm run build
npm start
```

## 🔄 Usage Flow

### 1. User Requests Password Reset
```
User → Forgot Password Page → Enters Email → Clicks "Send Reset Link"
```

### 2. System Processes Request
```
System → Validates Email → Generates Token → Stores Hash → Sends Email
```

### 3. User Resets Password
```
User → Clicks Email Link → Reset Password Page → Enters New Password → Submits
```

### 4. System Updates Password
```
System → Verifies Token → Updates Password → Invalidates Token → Logs Activity
```

## 🧪 Testing

### Test Scenarios
1. **Valid Email Request**
   - Enter existing user email
   - Verify email is sent
   - Check database token creation

2. **Invalid Email Request**
   - Enter non-existent email
   - Verify appropriate error message
   - Ensure no token is created

3. **Token Expiration**
   - Wait for token to expire
   - Attempt to use expired token
   - Verify error handling

4. **Password Validation**
   - Test weak passwords
   - Verify strength requirements
   - Check suggestion generation

## 📊 Monitoring

### Key Metrics
- Password reset request volume
- Success/failure rates
- Token expiration patterns
- Email delivery success rates

### Log Analysis
- User activity patterns
- Security incident detection
- Performance monitoring
- Error rate tracking

## 🔒 Security Considerations

### Best Practices
1. **Token Management**
   - Secure random generation
   - Proper expiration handling
   - Single-use enforcement

2. **Rate Limiting**
   - Implement request throttling
   - Monitor for abuse patterns
   - Block suspicious activity

3. **Audit Trail**
   - Complete activity logging
   - Regular log review
   - Incident response planning

4. **Data Protection**
   - Encrypted token storage
   - Secure email delivery
   - Privacy compliance

## 🚨 Troubleshooting

### Common Issues
1. **Email Not Received**
   - Check spam folder
   - Verify email configuration
   - Check Supabase email settings

2. **Token Expired**
   - Request new reset link
   - Check system time settings
   - Verify token cleanup jobs

3. **Database Errors**
   - Check RLS policies
   - Verify function permissions
   - Review error logs

### Debug Steps
1. Check browser console for errors
2. Review Supabase logs
3. Verify database connectivity
4. Test email delivery manually

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [Security Best Practices](https://owasp.org/www-project-top-ten/)
- [Email Security Guidelines](https://www.emailsecuritychecklist.com/)

## 🤝 Contributing

When contributing to the password reset functionality:
1. Follow security best practices
2. Add comprehensive tests
3. Update documentation
4. Review security implications
5. Test edge cases thoroughly

---

**Note**: This system is designed with security as a top priority. Always review security implications before making changes and ensure compliance with relevant data protection regulations.
