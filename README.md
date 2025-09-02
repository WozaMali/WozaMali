# Woza Mali Monorepo

A comprehensive recycling rewards platform built with Next.js, Supabase, and TypeScript, organized as a monorepo with three distinct applications.

## 🏗️ Architecture Overview

This monorepo contains three applications that share a unified design system and database:

- **Main App** (`apps/main`) - Customer-facing recycling rewards platform
- **Office UI** (`apps/office`) - Administrative dashboard for office staff
- **Collector UI** (`apps/collector`) - Field operations for waste collectors

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 10+
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd wozamali-monorepo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Fill in your Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development servers**
   ```bash
   # Start all apps simultaneously
   npm run dev
   
   # Or start individual apps
   npm run dev --workspace=@wozamali/main      # Port 3000
   npm run dev --workspace=@wozamali/office    # Port 3001
   npm run dev --workspace=@wozamali/collector # Port 3002
   ```

## 📱 Applications

### Main App (Port 3000)
- **URL**: `http://localhost:3000`
- **Purpose**: Customer-facing recycling rewards platform
- **Users**: Regular customers who recycle and earn rewards
- **Features**: Wallet, rewards, collection booking, profile management

### Office UI (Port 3001)
- **URL**: `http://localhost:3001`
- **Purpose**: Administrative dashboard for office staff
- **Users**: Office workers, managers, administrators
- **Pages**:
  - Dashboard - System overview and metrics
  - Users - Customer management
  - Withdrawals - Process withdrawal requests
  - Rewards - Manage reward catalog
  - Green Scholar Fund - Donation management
  - Collections - Schedule oversight
  - Analytics - Business intelligence
  - Settings - System configuration
  - Admin Logs - Audit trail

### Collector UI (Port 3002)
- **URL**: `http://localhost:3002`
- **Purpose**: Field operations for waste collectors
- **Users**: Waste collection workers, route managers
- **Features**:
  - Collection area management
  - Route planning and optimization
  - Collection logs and reporting
  - Real-time status updates
  - Mobile-optimized interface

## 🗂️ Project Structure

```
wozamali-monorepo/
├── apps/
│   ├── main/                    # Customer app (port 3000)
│   ├── office/                  # Office UI (port 3001)
│   └── collector/               # Collector UI (port 3002)
├── packages/
│   ├── ui/                      # Shared UI components
│   ├── auth/                    # Shared authentication
│   ├── database/                # Shared database types
│   └── config/                  # Shared configuration
├── package.json                 # Root package.json
├── turbo.json                   # Turborepo configuration
└── README.md                    # This file
```

## 🎨 Shared Design System

All applications use the same Woza Mali design system:

- **Colors**: Yellow and orange gradient scheme
- **Components**: Radix UI primitives with custom styling
- **Typography**: Inter font family
- **Icons**: Lucide React icon set
- **Responsive**: Mobile-first design approach

## 🔐 Authentication & Authorization

- **Shared Auth**: Single authentication system across all apps
- **Role-based Access**: 
  - `member` - Regular customers (Main app)
  - `collector` - Waste collectors (Collector UI)
  - `office` - Office staff (Office UI)
  - `admin` - System administrators (Office UI)
- **Seamless Switching**: Admin users can navigate between apps

## 🗄️ Database Schema

All applications share a unified Supabase database with:

- **User Profiles**: Authentication and profile data
- **Wallet System**: Balance, points, and transactions
- **Collection Management**: Areas, routes, schedules, logs
- **Rewards System**: Catalog and redemption tracking
- **Analytics**: Performance metrics and reporting

## 🚀 Development Commands

### Root Level
```bash
npm run dev          # Start all apps
npm run build        # Build all apps
npm run lint         # Lint all packages
npm run type-check   # Type check all packages
npm run clean        # Clean build artifacts
```

### Individual Apps
```bash
# Main app
npm run dev --workspace=@wozamali/main

# Office UI
npm run dev --workspace=@wozamali/office

# Collector UI
npm run dev --workspace=@wozamali/collector
```

### Individual Packages
```bash
# UI package
npm run type-check --workspace=@wozamali/ui

# Auth package
npm run type-check --workspace=@wozamali/auth
```

## 🔧 Configuration

### Environment Variables

Create `.env.local` in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App URLs (for cross-app navigation)
NEXT_PUBLIC_MAIN_URL=http://localhost:8080
NEXT_PUBLIC_OFFICE_URL=http://localhost:8082
NEXT_PUBLIC_COLLECTOR_URL=http://localhost:8081

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_REAL_TIME=true
```

### Tailwind Configuration

The design system is configured in `packages/config/src/index.css` with CSS variables for:
- Color palette
- Gradients
- Shadows
- Border radius
- Typography scales

## 📦 Package Dependencies

### Shared Packages
- **@wozamali/ui**: UI components, hooks, and utilities
- **@wozamali/auth**: Authentication context and utilities
- **@wozamali/database**: Database types and utilities
- **@wozamali/config**: Configuration constants and styles

### External Dependencies
- **Next.js 14**: React framework
- **Supabase**: Backend and database
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Type safety

## 🚀 Deployment

### Production URLs
- **Main App**: `wozamali.com`
- **Office UI**: `office.wozamali.com`
- **Collector UI**: `collector.wozamali.com`

### Build Process
```bash
# Build all apps for production
npm run build

# The build output will be in each app's .next directory
```

## 🔄 Real-time Workflow

The system implements a real-time workflow:

1. **Collector punches in data** → Database triggers
2. **Office sees pending approval** → Real-time updates
3. **Office approves** → Database updates
4. **Customer sees money + metrics** → Real-time updates

## 🧪 Testing

```bash
# Run tests for all packages
npm run test

# Run tests for specific workspace
npm run test --workspace=@wozamali/main
```

## 📝 Contributing

1. **Create feature branch** from `main`
2. **Make changes** in appropriate app/package
3. **Test changes** across all affected apps
4. **Submit pull request** with description

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 8080, 8081, 8082 are available
2. **Build errors**: Run `npm run clean` then `npm install`
3. **Type errors**: Run `npm run type-check` to identify issues
4. **Auth issues**: Verify Supabase environment variables

### Development Tips

- Use `npm run dev` to start all apps simultaneously
- Check the browser console for detailed error messages
- Verify database connections in Supabase dashboard
- Use TypeScript for better development experience

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Support

For technical support or questions:
- Check the troubleshooting section above
- Review the Supabase dashboard for database issues
- Check browser console for client-side errors
- Verify environment variable configuration

---

**Built with ❤️ for Woza Mali - Making recycling rewarding!**
