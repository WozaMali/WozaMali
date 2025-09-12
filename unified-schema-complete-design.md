# WozaMali Unified Schema - Complete Design

## **Information Flow Architecture**

```
User Registration → Role Assignment → Area Assignment → Collection Request → 
Collector Assignment → Pickup Execution → Payment Processing → Analytics
```

## **SECTION 1: Core Identity Layer** ✅ (Your Design)

### **1.1 Roles Table**
```sql
create table public.roles (
    id uuid primary key default gen_random_uuid(),
    name text not null unique, -- e.g. resident, collector, office
    description text,
    permissions jsonb default '{}', -- Store role permissions
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

### **1.2 Areas Table**
```sql
create table public.areas (
    id uuid primary key default gen_random_uuid(),
    name text not null unique, -- e.g. Dobsonville
    description text,
    city text not null,
    province text default 'Gauteng',
    boundaries jsonb, -- GeoJSON for area boundaries
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

### **1.3 Users Table**
```sql
create table public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    phone text,
    email text unique,
    role_id uuid not null references public.roles(id) on delete restrict,
    area_id uuid references public.areas(id) on delete set null,
    street_addr text,
    suburb text,
    city text,
    postal_code text,
    status text default 'active' check (status in ('active', 'suspended', 'deleted')),
    last_login timestamptz,
    login_count integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

## **SECTION 2: Materials & Pricing System**

### **2.1 Material Categories**
```sql
create table public.material_categories (
    id uuid primary key default gen_random_uuid(),
    name text not null unique, -- e.g. 'Plastic', 'Paper', 'Metal'
    description text,
    icon text, -- emoji or icon name
    color text, -- hex color for UI
    sort_order integer default 0,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

### **2.2 Materials**
```sql
create table public.materials (
    id uuid primary key default gen_random_uuid(),
    category_id uuid references public.material_categories(id) on delete set null,
    name text not null, -- e.g. 'PET Bottles', 'Cardboard'
    description text,
    unit text default 'kg' check (unit in ('kg', 'piece', 'liter', 'meter')),
    current_rate decimal(10,2) not null default 0, -- Price per unit
    points_per_unit integer default 0, -- Points earned per unit
    is_active boolean default true,
    sort_order integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

## **SECTION 3: Collection System**

### **3.1 Collection Requests**
```sql
create table public.collection_requests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    area_id uuid references public.areas(id) on delete set null,
    request_type text default 'scheduled' check (request_type in ('scheduled', 'immediate', 'recurring')),
    preferred_date date,
    preferred_time time,
    special_instructions text,
    status text default 'pending' check (status in ('pending', 'assigned', 'scheduled', 'in_progress', 'completed', 'cancelled')),
    assigned_collector_id uuid references public.users(id) on delete set null,
    assigned_at timestamptz,
    scheduled_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

### **3.2 Collection Pickups**
```sql
create table public.collection_pickups (
    id uuid primary key default gen_random_uuid(),
    request_id uuid references public.collection_requests(id) on delete cascade,
    collector_id uuid not null references public.users(id) on delete cascade,
    customer_id uuid not null references public.users(id) on delete cascade,
    pickup_code text unique not null, -- Human-readable code like 'PK001234'
    pickup_date date not null,
    pickup_time time,
    status text default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
    total_weight_kg decimal(10,2) default 0,
    total_value decimal(10,2) default 0,
    total_points integer default 0,
    notes text,
    customer_feedback text,
    completed_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

### **3.3 Pickup Items**
```sql
create table public.pickup_items (
    id uuid primary key default gen_random_uuid(),
    pickup_id uuid not null references public.collection_pickups(id) on delete cascade,
    material_id uuid not null references public.materials(id) on delete cascade,
    quantity decimal(10,2) not null,
    unit_price decimal(10,2) not null,
    total_price decimal(10,2) generated always as (quantity * unit_price) stored,
    points_earned integer not null default 0,
    quality_rating integer check (quality_rating >= 1 and quality_rating <= 5),
    notes text,
    created_at timestamptz default now()
);
```

### **3.4 Pickup Photos**
```sql
create table public.pickup_photos (
    id uuid primary key default gen_random_uuid(),
    pickup_id uuid not null references public.collection_pickups(id) on delete cascade,
    photo_url text not null,
    photo_type text default 'general' check (photo_type in ('before', 'after', 'general', 'verification')),
    uploaded_by uuid references public.users(id) on delete set null,
    uploaded_at timestamptz default now()
);
```

## **SECTION 4: Financial System**

### **4.1 User Wallets**
```sql
create table public.user_wallets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade unique,
    balance decimal(10,2) default 0.00,
    total_earned decimal(10,2) default 0.00,
    total_spent decimal(10,2) default 0.00,
    current_points integer default 0,
    total_points_earned integer default 0,
    total_points_spent integer default 0,
    tier text default 'bronze' check (tier in ('bronze', 'silver', 'gold', 'platinum')),
    last_updated timestamptz default now(),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

### **4.2 Transactions**
```sql
create table public.transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    transaction_type text not null check (transaction_type in ('earned', 'spent', 'withdrawal', 'refund', 'bonus', 'penalty')),
    amount decimal(10,2) not null,
    points integer default 0,
    description text not null,
    reference_type text, -- 'pickup', 'withdrawal', 'bonus', etc.
    reference_id uuid, -- ID of the related record
    status text default 'completed' check (status in ('pending', 'completed', 'failed', 'cancelled')),
    processed_by uuid references public.users(id) on delete set null,
    processed_at timestamptz,
    created_at timestamptz default now()
);
```

### **4.3 Withdrawal Requests**
```sql
create table public.withdrawal_requests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    amount decimal(10,2) not null,
    bank_name text not null,
    bank_code text not null,
    account_number text not null,
    account_holder_name text not null,
    status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    processed_by uuid references public.users(id) on delete set null,
    processed_at timestamptz,
    failure_reason text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

## **SECTION 5: System Administration**

### **5.1 System Settings**
```sql
create table public.system_settings (
    id uuid primary key default gen_random_uuid(),
    key text not null unique,
    value jsonb not null,
    description text,
    is_public boolean default false,
    updated_by uuid references public.users(id) on delete set null,
    updated_at timestamptz default now()
);
```

### **5.2 Audit Logs**
```sql
create table public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.users(id) on delete set null,
    action text not null,
    table_name text,
    record_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamptz default now()
);
```

### **5.3 Notifications**
```sql
create table public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    type text not null check (type in ('info', 'success', 'warning', 'error')),
    title text not null,
    message text not null,
    is_read boolean default false,
    action_url text,
    expires_at timestamptz,
    created_at timestamptz default now()
);
```

## **KEY RELATIONSHIPS**

1. **Users** → **Roles** (many-to-one)
2. **Users** → **Areas** (many-to-one)
3. **Collection Requests** → **Users** (many-to-one, customer)
4. **Collection Pickups** → **Users** (many-to-one, collector)
5. **Pickup Items** → **Materials** (many-to-one)
6. **User Wallets** → **Users** (one-to-one)
7. **Transactions** → **Users** (many-to-one)

## **DATA FLOW**

1. **User Registration** → Create user with role and area
2. **Collection Request** → User requests pickup in their area
3. **Collector Assignment** → Office assigns collector to request
4. **Pickup Execution** → Collector picks up materials
5. **Payment Processing** → Calculate points and update wallet
6. **Analytics** → Track performance and generate reports

## **BENEFITS**

- ✅ **Single source of truth** - All apps use same data
- ✅ **Clear relationships** - Logical data flow
- ✅ **Scalable design** - Easy to extend
- ✅ **Audit trail** - Complete tracking
- ✅ **Role-based access** - Proper security
- ✅ **Real-time updates** - Live data sync

---

**Ready to implement section by section?** We'll start with Section 1 (Core Identity Layer) and build up from there!
