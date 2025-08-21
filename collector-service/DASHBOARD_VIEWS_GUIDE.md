# 🚀 Dashboard Views & Analytics Guide

## 🎯 **What's New**

Your recycling management system now has **comprehensive dashboard views** that provide real-time data for all user types (Customer, Collector, Admin) with **automated calculations** for:

- ✅ **Material Rates**: PET (R1.50), Cans (R18.55), HDPE (R2.00), Glass (R1.20), Paper (R0.80), Cardboard (R0.60)
- ✅ **Environmental Impact**: CO₂ saved, water saved, landfill saved, trees equivalent
- ✅ **Points System**: Material-based point calculations
- ✅ **Fund Allocation**: 70% Green Scholar Fund, 30% User Wallet
- ✅ **Performance Metrics**: Real-time analytics for all stakeholders

---

## 📊 **Dashboard Views Available**

### 1. **Customer Dashboard View** (`customer_dashboard_view`)
**Who**: Customers viewing their own recycling data
**Data**: Personal pickup history, environmental impact, earnings, points

```sql
SELECT * FROM customer_dashboard_view;
```

**Returns**:
- Pickup details (status, dates, weight, value)
- Environmental impact (CO₂, water, landfill, trees)
- Fund allocation (Green Scholar contribution, wallet balance)
- Points earned
- Material breakdown with individual impacts
- Collector information
- Address details

### 2. **Collector Dashboard View** (`collector_dashboard_view`)
**Who**: Collectors viewing their pickup performance
**Data**: Pickup history, customer details, earnings, environmental impact

```sql
SELECT * FROM collector_dashboard_view;
```

**Returns**:
- Pickup details and status
- Customer information (name, email, phone)
- Address details
- Environmental impact calculations
- Fund allocation breakdown
- Points generated
- Material breakdown
- Payment status and amounts

### 3. **Admin Dashboard View** (`admin_dashboard_view`)
**Who**: Administrators with full system access
**Data**: Complete pickup information, customer/collector details, approvals

```sql
SELECT * FROM admin_dashboard_view;
```

**Returns**:
- Complete pickup information
- Customer and collector details
- Environmental impact data
- Fund allocation breakdown
- Points calculations
- Material breakdown
- Photo counts
- Payment information
- Approval notes and status

---

## 📈 **Analytics Views for Dashboards**

### 4. **System Impact View** (`system_impact_view`)
**Purpose**: Overall system performance and environmental impact
**Access**: Admin only

```sql
SELECT * FROM system_impact_view;
```

**Returns**:
- Total pickups, customers, collectors
- Total kg collected and value generated
- System-wide environmental impact
- Total fund allocations
- Total points generated
- Status breakdown (pending/approved/rejected)

### 5. **Material Performance View** (`material_performance_view`)
**Purpose**: Material-specific performance tracking
**Access**: Admin only

```sql
SELECT * FROM material_performance_view;
```

**Returns**:
- Material name, category, rate per kg
- Pickup count and total kg collected
- Total value generated
- Average kg per pickup
- Environmental impact per material
- Total points generated per material

### 6. **Collector Performance View** (`collector_performance_view`)
**Purpose**: Individual collector performance metrics
**Access**: Admin only

```sql
SELECT * FROM collector_performance_view;
```

**Returns**:
- Collector details and contact info
- Total pickups and kg collected
- Total value generated
- Environmental impact contribution
- Points generated
- Status breakdown
- Last pickup date

### 7. **Customer Performance View** (`customer_performance_view`)
**Purpose**: Individual customer recycling performance
**Access**: Admin only

```sql
SELECT * FROM customer_performance_view;
```

**Returns**:
- Customer details and contact info
- Total pickups and kg recycled
- Total value earned
- Environmental impact contribution
- Points earned
- Fund allocation totals
- Last recycling date

---

## 🧮 **Calculation Functions**

### **Environmental Impact Calculation**
```sql
SELECT calculate_environmental_impact('PET', 5.0);
-- Returns: {"co2_saved": 12.5, "water_saved": 125, "landfill_saved": 4.0, "trees_equivalent": 0.57}
```

### **Points Calculation**
```sql
SELECT calculate_points('Aluminium Cans', 2.0);
-- Returns: 370 points (185 points per kg)
```

### **Fund Allocation**
```sql
SELECT calculate_fund_allocation(100.00);
-- Returns: {"green_scholar_fund": 70.00, "user_wallet": 30.00, "total_value": 100.00}
```

---

## 🎨 **Dashboard Integration Examples**

### **Customer Dashboard Component**
```typescript
// Fetch customer's recycling data
const { data: customerData } = await supabase
  .from('customer_dashboard_view')
  .select('*');

// Display environmental impact
const impact = customerData[0]?.environmental_impact;
console.log(`CO₂ Saved: ${impact.co2_saved} kg`);
console.log(`Water Saved: ${impact.water_saved} L`);
console.log(`Trees Equivalent: ${impact.trees_equivalent}`);
```

### **Collector Dashboard Component**
```typescript
// Fetch collector's performance data
const { data: collectorData } = await supabase
  .from('collector_dashboard_view')
  .select('*');

// Display earnings and impact
const totalValue = collectorData.reduce((sum, pickup) => sum + pickup.total_value, 0);
const totalKg = collectorData.reduce((sum, pickup) => sum + pickup.total_kg, 0);
```

### **Admin Analytics Component**
```typescript
// Fetch system-wide impact
const { data: systemImpact } = await supabase
  .from('system_impact_view')
  .select('*');

// Display system metrics
const { total_pickups, total_co2_saved, total_green_scholar_fund } = systemImpact[0];
```

---

## 🚀 **Next Steps**

### **1. Test the Views**
Run these queries in your Supabase SQL editor:
```sql
-- Test customer view (replace with actual user ID)
SELECT * FROM customer_dashboard_view LIMIT 5;

-- Test collector view (replace with actual collector ID)
SELECT * FROM collector_dashboard_view LIMIT 5;

-- Test admin view
SELECT * FROM admin_dashboard_view LIMIT 5;

-- Test system impact
SELECT * FROM system_impact_view;
```

### **2. Integrate with React Components**
- Replace hardcoded data with real-time view queries
- Build beautiful charts using the aggregated data
- Create real-time dashboards with live updates

### **3. Customize Calculations**
- Adjust environmental impact factors in the functions
- Modify point calculations for different materials
- Change fund allocation percentages (currently 70/30)

---

## 💡 **Pro Tips**

1. **Performance**: Views automatically aggregate data, reducing the need for multiple queries
2. **Real-time**: Data updates automatically when pickups are modified
3. **Security**: RLS policies ensure users only see their own data
4. **Scalability**: Functions are optimized for large datasets
5. **Flexibility**: Easy to modify calculations without changing application code

---

## 🔧 **Troubleshooting**

### **View Not Found Error**
- Ensure you've run the `08-views-and-seed-data.sql` file
- Check that all previous schema files are installed

### **Permission Denied Error**
- Verify RLS policies are enabled
- Check user role and authentication status

### **Calculation Errors**
- Ensure material names match exactly (case-sensitive)
- Check that weight values are positive numbers

---

## 🎉 **You're Ready!**

Your recycling management system now has **enterprise-grade analytics** that will make your dashboards:

- 📊 **Data-Rich**: Real-time environmental impact, earnings, and performance
- 🚀 **High-Performance**: Optimized views with minimal query overhead
- 🔒 **Secure**: Role-based access control for all data
- 📱 **Mobile-Ready**: Perfect for collector mobile apps and customer portals
- 🎯 **Insightful**: Comprehensive metrics for business intelligence

**Go build some amazing dashboards!** 🚀✨
