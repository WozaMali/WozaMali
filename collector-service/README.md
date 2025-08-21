# Woza Mali - Recycling Management System

A comprehensive recycling management platform for South Africa, built with React, TypeScript, and Supabase.

## 🌟 Features

- **Collector Dashboard** - Streamlined pickup workflow with photo capture
- **Admin Portal** - Complete management interface with analytics
- **Customer Dashboard** - Track recycling impact and rewards
- **Auto-Calculator** - Real-time pricing and environmental impact
- **Authentication System** - Role-based access control
- **Database Schema** - Complete Supabase backend with RLS

## 🚀 Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Supabase account and project

### Development Setup

1. **Clone the repository**
   ```sh
   git clone https://github.com/WozaMali/WozaMaliOffice.git
   cd WozaMaliOffice
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Install database schema**
   - Open Supabase SQL Editor
   - Run the contents of `schemas/00-install-all.sql`

5. **Start development server**
   ```sh
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Application pages
├── hooks/         # Custom React hooks
├── lib/           # Utility functions and schemas
└── contexts/      # React contexts for state management

schemas/           # Database schema files
├── 00-install-all.sql          # Master installation script
├── 01-profiles.sql             # User profiles
├── 02-addresses.sql            # Address management
├── 03-materials.sql            # Material pricing
├── 04-pickups.sql             # Pickup records
├── 05-pickup-items.sql        # Individual items
├── 06-pickup-photos.sql       # Photo storage
├── 07-payments.sql            # Payment tracking
└── 08-views-and-seed-data.sql # Dashboard views & sample data
```

## 🛠️ Technologies Used

- **Frontend**: React, TypeScript, Vite
- **UI Components**: shadcn-ui, Radix UI
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Context, React Query
- **Forms**: React Hook Form, Zod validation

## 📱 Available Routes

- `/` - Login page
- `/dashboard` - Main dashboard (authenticated)
- `/admin/*` - Admin portal routes
- `/collector` - Collector dashboard
- `/customer` - Customer dashboard
- `/calculator` - Recycling calculator

## 🚀 Deployment

This project can be deployed to any platform that supports Node.js applications:

- **Vercel** - Recommended for React apps
- **Netlify** - Great for static sites
- **Railway** - Full-stack deployment
- **Supabase** - Database hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is proprietary software for Woza Mali.

## 📞 Support

For support and questions, contact the Woza Mali development team.
