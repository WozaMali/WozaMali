# WozaMali Multi-Service Architecture Setup

This repository contains both the **Office Backend** and **Collector App** services, configured to run on different ports for development and production.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WozaMali     │    │  WozaMaliOffice │    │ WozaMaliOffice │
│   Frontend     │    │   (Office)      │    │  (Collector)   │
│   Port: 8080   │    │   Port: 8081    │    │   Port: 8082   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Option 1: Run All Services Simultaneously
```bash
npm run dev:all
```

This will start both Office and Collector services automatically.

### Option 2: Run Services Individually

#### Start Office Service (Port 8081)
```bash
npm run dev:office
```

#### Start Collector Service (Port 8082)
```bash
npm run dev:collector
```

## 🔧 Service Configuration

### Office Service (Port 8081)
- **Purpose**: Administrative dashboard and business management
- **Features**: User management, analytics, collection management, admin panel
- **URL**: http://localhost:8081
- **Environment**: `.env.office`

### Collector Service (Port 8082)
- **Purpose**: Mobile interface for collectors
- **Features**: Collection scheduling, photo capture, route management
- **URL**: http://localhost:8082
- **Environment**: `.env.collector`

## 📁 Project Structure

```
WozaMaliOffice/
├── src/
│   ├── components/          # Shared UI components
│   ├── pages/              # Application pages
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React contexts
│   ├── lib/
│   │   ├── serviceConfig.ts # Service configuration
│   │   └── supabase.ts     # Database configuration
│   └── App.tsx             # Main app with conditional routing
├── .env.office             # Office service configuration
├── .env.collector          # Collector service configuration
├── vite.config.ts          # Vite configuration with port support
├── dev-all.js              # Multi-service development script
└── package.json            # Scripts for different services
```

## 🌐 Available Routes

### Office Service Routes (Port 8081)
- `/` - Login page
- `/dashboard` - Main dashboard
- `/admin/*` - Admin portal routes
- `/calculator` - Recycling calculator

### Collector Service Routes (Port 8082)
- `/` - Login page
- `/collector` - Collector dashboard
- `/collector-login` - Collector login

## 🔑 Environment Variables

### Common Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Office-Specific Variables
- `VITE_ENABLE_ADMIN_PANEL` - Enable admin features
- `VITE_ENABLE_ANALYTICS` - Enable analytics
- `VITE_ENABLE_USER_MANAGEMENT` - Enable user management

### Collector-Specific Variables
- `VITE_ENABLE_COLLECTOR_DASHBOARD` - Enable collector features
- `VITE_ENABLE_PHOTO_CAPTURE` - Enable photo capture
- `VITE_ENABLE_ROUTE_MANAGEMENT` - Enable route management

## 🛠️ Development Workflow

1. **Clone the repository**
   ```bash
   git clone https://github.com/WozaMali/WozaMaliOffice.git
   cd WozaMaliOffice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment files**
   - Copy `.env.office` and `.env.collector` from the repository
   - Update with your Supabase credentials

4. **Start development**
   ```bash
   # Run all services
   npm run dev:all
   
   # Or run individually
   npm run dev:office    # Port 8081
   npm run dev:collector # Port 8082
   ```

## 🚀 Production Deployment

### Build Commands
```bash
# Build Office service
npm run build:office

# Build Collector service
npm run build:collector

# Build both services
npm run build:office && npm run build:collector
```

### Preview Commands
```bash
# Preview Office service
npm run preview:office

# Preview Collector service
npm run preview:collector
```

## 🔗 Integration with Frontend

The WozaMali Frontend (Port 8080) can communicate with both services:

- **Office API**: http://localhost:8081/api/*
- **Collector API**: http://localhost:8082/api/*

## 🐛 Troubleshooting

### Port Already in Use
If you get a "port already in use" error:
1. Check if another service is running on the port
2. Kill the process using the port
3. Restart the service

### Environment Variables Not Loading
1. Ensure `.env.office` and `.env.collector` files exist
2. Check that environment variables are properly set
3. Restart the development server

### Service Not Starting
1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure Supabase credentials are correct

## 📞 Support

For issues and questions:
- Check the main README.md
- Review the Supabase setup guides
- Contact the WozaMali development team

## 🔄 Updates

To update the repository:
```bash
git pull origin main
npm install
npm run dev:all
```
