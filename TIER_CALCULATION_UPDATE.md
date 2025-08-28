# 🎯 **Tier Calculation Update: Dynamic Based on Kilograms**

## **Overview**
The tier system now **dynamically calculates** the customer's tier based on their actual recycled kilograms instead of using a hardcoded tier from the wallet.

## **Changes Made**

### **1. Dynamic Tier Calculation** (`src/hooks/useWallet.ts`)

#### **New Function Added**
```typescript
function getTierFromWeight(weightKg: number): string {
  if (weightKg >= 100) return 'platinum';
  if (weightKg >= 50) return 'gold';
  if (weightKg >= 20) return 'silver';
  return 'bronze';
}
```

#### **Tier Thresholds**
| **Tier** | **Weight Required** | **Description** |
|-----------|---------------------|-----------------|
| **Bronze** | 0-19.9 kg | Basic recycler |
| **Silver** | 20-49.9 kg | Standard recycler |
| **Gold** | 50-99.9 kg | Advanced recycler |
| **Platinum** | 100+ kg | Elite recycler |

### **2. Updated Data Flow**

#### **Before (Static Tier)**
```typescript
tier: simpleWallet.tier, // Hardcoded from database
```

#### **After (Dynamic Tier)**
```typescript
// Calculate tier based on actual weight recycled
const calculatedTier = getTierFromWeight(totalWeight);

// Use calculated tier instead of wallet tier
tier: calculatedTier,
```

### **3. Dashboard Display Updates**

#### **Tier Name Capitalization**
```typescript
// Before
<h3>{userTier} Recycler</h3>

// After  
<h3>{userTier.charAt(0).toUpperCase() + userTier.slice(1)} Recycler</h3>
```

**Result**: "bronze Recycler" → "Bronze Recycler"

## **How It Works Now**

### **1. Real-Time Calculation**
- Tier is calculated **every time** wallet data is fetched
- Based on **current total weight** from pickups
- **No more hardcoded tiers** from database

### **2. Automatic Updates**
- When user recycles more materials → weight increases
- Tier automatically **upgrades** when thresholds are met
- **Immediate reflection** on dashboard

### **3. Data Consistency**
- Tier always matches actual recycling performance
- **No discrepancies** between displayed tier and actual weight
- **Accurate progress tracking** toward next tier

## **Example Scenarios**

### **Scenario 1: New User**
- **Weight Recycled**: 0 kg
- **Calculated Tier**: Bronze
- **Display**: "Bronze Recycler (0 kg recycled)"

### **Scenario 2: Active Recycler**
- **Weight Recycled**: 35 kg
- **Calculated Tier**: Silver
- **Display**: "Silver Recycler (35 kg recycled)"
- **Progress**: 15 kg to reach Gold tier

### **Scenario 3: Elite Recycler**
- **Weight Recycled**: 125 kg
- **Calculated Tier**: Platinum
- **Display**: "Platinum Recycler (125 kg recycled)"
- **Status**: Max level achieved

## **Benefits**

### **🎯 Accuracy**
- Tier always reflects actual recycling performance
- No more outdated tier assignments

### **🚀 Motivation**
- Users see immediate tier upgrades
- Clear progress toward next level

### **📊 Transparency**
- Direct correlation between weight and tier
- Easy to understand progression system

### **🔄 Real-Time**
- Instant updates when recycling more
- Live tier calculation

## **Testing**

### **Check These Points**
- [ ] Dashboard shows correct tier based on weight
- [ ] Tier name is properly capitalized
- [ ] Progress bar shows correct weight-based progress
- [ ] Tier upgrades when weight thresholds are met
- [ ] No hardcoded tier values remain

### **Test Scenarios**
1. **New user** (0 kg) → Should show "Bronze Recycler"
2. **Add 25 kg** → Should upgrade to "Silver Recycler"
3. **Add 30 more kg** (total 55 kg) → Should upgrade to "Gold Recycler"
4. **Add 50 more kg** (total 105 kg) → Should upgrade to "Platinum Recycler"

## **Code Changes Summary**

| **File** | **Change** | **Purpose** |
|-----------|------------|-------------|
| `useWallet.ts` | Added `getTierFromWeight()` function | Calculate tier from weight |
| `useWallet.ts` | Changed `tier: calculatedTier` | Use dynamic tier |
| `Dashboard.tsx` | Capitalized tier display | Better UI presentation |

---

**Last Updated**: $(date)
**Version**: 2.1.0
**Status**: ✅ Implemented
**Impact**: High - Core tier calculation now dynamic
