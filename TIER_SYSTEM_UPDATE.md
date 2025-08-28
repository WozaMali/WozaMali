# 🔄 **Tier System Update: Points → Kilograms**

## **Overview**
The tier system has been updated to use **kilograms recycled** instead of points, making it more intuitive and directly tied to environmental impact.

## **Changes Made**

### **1. Tier Thresholds (Updated)**
| **Tier** | **Old (Points)** | **New (kg)** | **Description** |
|-----------|------------------|--------------|-----------------|
| **Bronze** | 0-199 | 0-19.9 | Basic recycler |
| **Silver** | 200-499 | 20-49.9 | Standard recycler |
| **Gold** | 500-999 | 50-99.9 | Advanced recycler |
| **Platinum** | 1000+ | 100+ | Elite recycler |

### **2. Code Changes**

#### **useWallet Hook** (`src/hooks/useWallet.ts`)
- ✅ **Function Updated**: `getNextTierRequirements(currentWeightKg: number)`
- ✅ **Interface Updated**: `weightNeeded` instead of `pointsNeeded`
- ✅ **Calculation**: Based on `totalWeight` from pickups

#### **Dashboard Component** (`src/components/Dashboard.tsx`)
- ✅ **Display**: Shows "X kg recycled" instead of "X points earned"
- ✅ **Progress**: Shows "X kg to go" instead of "X points to go"
- ✅ **Tier Progress**: Based on weight recycled

### **3. Materials Table Update** (`update-materials-rates.sql`)

#### **Updated Rates**
| **Material** | **Rate (R/kg)** | **Category** |
|--------------|-----------------|--------------|
| PET | 1.50 | Plastic |
| Aluminium Cans | 18.55 | Metal |
| HDPE | 2.00 | Plastic |
| Glass | 1.20 | Glass |
| Paper | 0.80 | Paper |
| Cardboard | 0.60 | Paper |

#### **New Materials Added**
| **Material** | **Rate (R/kg)** | **Category** |
|--------------|-----------------|--------------|
| Steel Cans | 2.50 | Metal |
| LDPE | 1.80 | Plastic |
| PP | 2.20 | Plastic |
| Mixed Metals | 5.00 | Metal |

## **Benefits of Weight-Based System**

### **🎯 More Intuitive**
- Users directly see their environmental impact in kg
- Easier to understand progress toward next tier
- Aligns with recycling industry standards

### **🌱 Better Environmental Tracking**
- Direct correlation between weight and environmental impact
- CO₂ saved = weight × 0.5
- Water saved = weight × 0.1
- Landfill saved = weight × 0.3

### **💰 Accurate Earnings**
- Earnings directly tied to material weight and rates
- Market-based pricing for different materials
- Transparent value calculation

## **Implementation Steps**

### **1. Run the Materials Update**
```sql
-- Execute in Supabase SQL Editor
-- File: update-materials-rates.sql
```

### **2. Verify Changes**
- Check that tiers now display in kg
- Confirm progress bars show weight-based progress
- Test with different user weights

### **3. Update Documentation**
- Update user guides to reflect kg-based system
- Modify training materials for collectors
- Update marketing materials

## **Migration Notes**

### **Existing Users**
- Current points will be converted to equivalent kg based on historical data
- Tier assignments will be recalculated automatically
- No user action required

### **Data Consistency**
- All environmental calculations remain the same
- Wallet balances unaffected
- Pickup history preserved

## **Testing Checklist**

- [ ] Dashboard shows "X kg recycled" instead of points
- [ ] Tier progress shows weight-based progress
- [ ] Progress bars calculate correctly
- [ ] Materials table updated with new rates
- [ ] New materials appear in collector interface
- [ ] Environmental impact calculations still work

## **Future Enhancements**

### **Material-Specific Tiers**
- Different tier requirements for different material types
- Specialized recycling programs
- Material-specific rewards

### **Dynamic Pricing**
- Real-time market rate updates
- Seasonal pricing adjustments
- Bulk recycling discounts

---

**Last Updated**: $(date)
**Version**: 2.0.0
**Status**: ✅ Implemented
