# 🗺️ WozaMoney Location Features

This document describes the comprehensive location management system built for WozaMoney, including the enhanced sign-up form and Collector UI.

## 🚀 **Features Overview**

### 1. **Enhanced Sign-Up Form**
- **Soweto Townships Dropdown**: 20 townships with auto-postal code filling
- **Gauteng Cities Dropdown**: Soweto first, then other cities
- **Ext/Zone/Phase Dropdown**: 25 common patterns + custom input option
- **Auto-Postal Code**: Automatically fills when township is selected
- **Enhanced Street Address**: Clear guidance for house number + street name

### 2. **Collector UI**
- **Collection Area Management**: View and manage collection areas
- **Location-Based Filtering**: Filter by city, township, and ext/zone/phase
- **Search Functionality**: Search across all location data
- **Statistics Dashboard**: Collector counts, household counts, schedules

### 3. **Database Integration**
- **Structured Location Data**: Townships, cities, and ext/zone/phases
- **PostgreSQL Functions**: Optimized data retrieval
- **Row Level Security**: Secure access control
- **Caching System**: Performance optimization

## 🗄️ **Database Setup**

### Step 1: Run the Location Data Script
Execute `supabase-location-data.sql` in your Supabase SQL editor:

```sql
-- This will create:
-- 1. townships table (20 Soweto townships with postal codes)
-- 2. cities table (20 Gauteng cities)
-- 3. ext_zone_phases table (25 common patterns)
-- 4. PostgreSQL functions for data retrieval
-- 5. RLS policies and indexes
```

### Step 2: Verify Data Creation
Check that the tables were created successfully:

```sql
-- Verify data insertion
SELECT 'Townships' as table_name, COUNT(*) as record_count FROM public.townships
UNION ALL
SELECT 'Cities' as table_name, COUNT(*) as record_count FROM public.cities
UNION ALL
SELECT 'Ext_Zone_Phases' as table_name, COUNT(*) as record_count FROM public.ext_zone_phases;
```

## 🎯 **Usage Examples**

### 1. **Using the Location Service**

```typescript
import { locationService } from '@/lib/locationService';

// Get all townships
const townships = await locationService.getTownships();

// Get townships by city
const sowetoTownships = await locationService.getTownshipsByCity('Soweto');

// Get cities by province
const gautengCities = await locationService.getCitiesByProvince('Gauteng');

// Search locations
const searchResults = await locationService.searchLocations('Protea');

// Get location statistics
const stats = await locationService.getLocationStats();
```

### 2. **Using Location Types**

```typescript
import { Township, City, ExtZonePhase } from '@/types/location';

// Type-safe interfaces
const township: Township = {
  id: 'uuid',
  name: 'Dobsonville',
  postal_code: '1863',
  city: 'Soweto',
  province: 'Gauteng',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};
```

### 3. **Integration in Components**

```typescript
// In your React component
const [townships, setTownships] = useState<Township[]>([]);

useEffect(() => {
  const fetchData = async () => {
    const result = await locationService.getTownships();
    if (result.data) {
      setTownships(result.data);
    }
  };
  fetchData();
}, []);
```

## 🔧 **API Endpoints**

### PostgreSQL Functions

#### `get_townships_by_city(city_name TEXT)`
Returns townships filtered by city name.

#### `get_cities_by_province(province_name TEXT)`
Returns cities filtered by province, with Soweto first.

#### `get_ext_zone_phases_by_category(category_name TEXT)`
Returns ext/zone/phase patterns filtered by category.

### REST-like Operations via Supabase Client

```typescript
// Get all active townships
const { data, error } = await supabase
  .from('townships')
  .select('*')
  .eq('is_active', true)
  .order('name');

// Get specific township
const { data, error } = await supabase
  .from('townships')
  .select('*')
  .eq('name', 'Dobsonville')
  .single();
```

## 🎨 **UI Components**

### 1. **Enhanced Sign-Up Form** (`/auth/sign-up`)
- **Location**: `src/app/auth/sign-up/page.tsx`
- **Features**: Dynamic dropdowns, auto-fill, validation
- **Dependencies**: `@/components/ui/select`, `@/lib/locationService`

### 2. **Collector UI** (`/collector`)
- **Location**: `src/components/CollectorUI.tsx`
- **Features**: Collection area management, filtering, search
- **Dependencies**: `@/components/ui/card`, `@/lib/locationService`

### 3. **Location Service**
- **Location**: `src/lib/locationService.ts`
- **Features**: Caching, error handling, optimized queries
- **Dependencies**: `@/lib/supabase`, `@/types/location`

## 📊 **Data Structure**

### Townships Table
```sql
CREATE TABLE public.townships (
    id UUID PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    postal_code TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Soweto',
    province TEXT NOT NULL DEFAULT 'Gauteng',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Cities Table
```sql
CREATE TABLE public.cities (
    id UUID PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    province TEXT NOT NULL DEFAULT 'Gauteng',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Ext/Zone/Phases Table
```sql
CREATE TABLE public.ext_zone_phases (
    id UUID PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL, -- 'Extension', 'Zone', 'Phase', 'Section', 'Block'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚦 **Performance Features**

### 1. **Caching System**
- **Cache Duration**: 5 minutes
- **Cache Invalidation**: Automatic expiry
- **Memory Efficient**: Singleton pattern

### 2. **Optimized Queries**
- **Indexes**: On name, postal_code, city, province
- **Batch Operations**: Parallel data fetching
- **Error Handling**: Graceful fallbacks

### 3. **Lazy Loading**
- **Component-Level**: Data fetched when needed
- **State Management**: Loading states and error handling
- **User Experience**: Smooth interactions

## 🔒 **Security Features**

### 1. **Row Level Security (RLS)**
```sql
-- All authenticated users can read location data
CREATE POLICY "Anyone can view townships" ON public.townships
    FOR SELECT USING (true);
```

### 2. **Input Validation**
- **Type Safety**: TypeScript interfaces
- **Form Validation**: Required fields and formats
- **SQL Injection Prevention**: Parameterized queries

## 🧪 **Testing**

### 1. **Manual Testing**
- Visit `/auth/sign-up` to test the enhanced form
- Visit `/collector` to test the Collector UI
- Test dropdown functionality and auto-fill features

### 2. **Database Testing**
```sql
-- Test the functions
SELECT * FROM get_townships_by_city('Soweto');
SELECT * FROM get_cities_by_province('Gauteng');
SELECT * FROM get_ext_zone_phases_by_category('Extension');
```

## 🚀 **Next Steps**

### 1. **Immediate Actions**
- [ ] Run `supabase-location-data.sql` in Supabase
- [ ] Test the sign-up form at `/auth/sign-up`
- [ ] Test the Collector UI at `/collector`

### 2. **Future Enhancements**
- [ ] Add collection area creation/editing forms
- [ ] Implement collector assignment system
- [ ] Add route optimization algorithms
- [ ] Create location analytics dashboard

### 3. **Integration Points**
- [ ] Connect to user management system
- [ ] Integrate with payment processing
- [ ] Add notification systems
- [ ] Implement reporting features

## 📝 **Troubleshooting**

### Common Issues

#### 1. **Location Data Not Loading**
- Check Supabase connection
- Verify RLS policies are enabled
- Check browser console for errors

#### 2. **Dropdowns Empty**
- Ensure `supabase-location-data.sql` was executed
- Check table permissions
- Verify data exists in tables

#### 3. **Auto-fill Not Working**
- Check township selection logic
- Verify postal code mapping
- Test with browser dev tools

### Debug Commands
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('townships', 'cities', 'ext_zone_phases');

-- Check data counts
SELECT COUNT(*) FROM townships;
SELECT COUNT(*) FROM cities;
SELECT COUNT(*) FROM ext_zone_phases;
```

## 📚 **Additional Resources**

- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **TypeScript Handbook**: [typescriptlang.org/docs](https://www.typescriptlang.org/docs)
- **Tailwind CSS**: [tailwindcss.com/docs](https://tailwindcss.com/docs)

---

**Built with ❤️ for WozaMoney**
*Location management system for efficient waste collection operations*
