// Material pricing configuration for Main App
// Based on WozaMaliOffice recycling-schema.ts

export interface MaterialPricing {
  id: string;
  type: string;
  name: string;
  pricePerKg: number;
  pointsPerKg: number;
  co2SavedPerKg: number;
  waterSavedPerKg: number;
  landfillSavedPerKg: number;
  isActive: boolean;
  lastUpdated: Date;
}

export const defaultMaterialPricing: MaterialPricing[] = [
  {
    id: 'pet-001',
    type: 'PET',
    name: 'PET Plastic Bottles',
    pricePerKg: 1.50,
    pointsPerKg: 1.5,
    co2SavedPerKg: 1.7,
    waterSavedPerKg: 30,
    landfillSavedPerKg: 2.0,
    isActive: true,
    lastUpdated: new Date(),
  },
  {
    id: 'aluminum-001',
    type: 'ALUMINUM_CANS',
    name: 'Aluminum Cans',
    pricePerKg: 18.55,
    pointsPerKg: 18.55,
    co2SavedPerKg: 9.1,
    waterSavedPerKg: 140,
    landfillSavedPerKg: 2.0,
    isActive: true,
    lastUpdated: new Date(),
  },
  {
    id: 'glass-001',
    type: 'GLASS',
    name: 'Glass Bottles',
    pricePerKg: 2.50,
    pointsPerKg: 2.5,
    co2SavedPerKg: 0.8,
    waterSavedPerKg: 20,
    landfillSavedPerKg: 2.0,
    isActive: true,
    lastUpdated: new Date(),
  },
  {
    id: 'paper-001',
    type: 'PAPER',
    name: 'Paper & Cardboard',
    pricePerKg: 1.20,
    pointsPerKg: 1.2,
    co2SavedPerKg: 0.9,
    waterSavedPerKg: 15,
    landfillSavedPerKg: 2.0,
    isActive: true,
    lastUpdated: new Date(),
  },
  {
    id: 'electronics-001',
    type: 'ELECTRONICS',
    name: 'Electronic Waste',
    pricePerKg: 25.00,
    pointsPerKg: 25.0,
    co2SavedPerKg: 15.0,
    waterSavedPerKg: 200,
    landfillSavedPerKg: 5.0,
    isActive: true,
    lastUpdated: new Date(),
  },
  {
    id: 'batteries-001',
    type: 'BATTERIES',
    name: 'Batteries',
    pricePerKg: 35.00,
    pointsPerKg: 35.0,
    co2SavedPerKg: 20.0,
    waterSavedPerKg: 300,
    landfillSavedPerKg: 8.0,
    isActive: true,
    lastUpdated: new Date(),
  },
];

// Tier system based on weight (kg) recycled
export function getTierFromWeight(weightKg: number): string {
  if (weightKg >= 100) return 'platinum';
  if (weightKg >= 50) return 'gold';
  if (weightKg >= 20) return 'silver';
  return 'bronze';
}

// Calculate points and value based on material type and weight
export function calculateCollectionValue(
  materialType: string,
  weightKg: number
): { points: number; value: number; co2Saved: number; waterSaved: number; landfillSaved: number } {
  const material = defaultMaterialPricing.find(m => m.type === materialType && m.isActive);
  
  if (!material) {
    // Default fallback for unknown materials
    return {
      points: weightKg * 1, // 1 point per kg fallback
      value: weightKg * 1, // R1 per kg fallback
      co2Saved: weightKg * 1,
      waterSaved: weightKg * 10,
      landfillSaved: weightKg * 1,
    };
  }

  return {
    points: Math.round(weightKg * material.pointsPerKg),
    value: Math.round(weightKg * material.pricePerKg * 100) / 100,
    co2Saved: Math.round(weightKg * material.co2SavedPerKg * 100) / 100,
    waterSaved: Math.round(weightKg * material.waterSavedPerKg * 100) / 100,
    landfillSaved: Math.round(weightKg * material.landfillSavedPerKg * 100) / 100,
  };
}

// Calculate total points and value for multiple collections
export function calculateTotalCollectionValue(
  collections: Array<{ material_type?: string; weight_kg: number }>
): { totalPoints: number; totalValue: number; totalCo2Saved: number; totalWaterSaved: number; totalLandfillSaved: number } {
  let totalPoints = 0;
  let totalValue = 0;
  let totalCo2Saved = 0;
  let totalWaterSaved = 0;
  let totalLandfillSaved = 0;

  collections.forEach(collection => {
    const materialType = collection.material_type || 'PET'; // Default to PET if no type specified
    const calculation = calculateCollectionValue(materialType, collection.weight_kg);
    
    totalPoints += calculation.points;
    totalValue += calculation.value;
    totalCo2Saved += calculation.co2Saved;
    totalWaterSaved += calculation.waterSaved;
    totalLandfillSaved += calculation.landfillSaved;
  });

  return {
    totalPoints: Math.round(totalPoints),
    totalValue: Math.round(totalValue * 100) / 100,
    totalCo2Saved: Math.round(totalCo2Saved * 100) / 100,
    totalWaterSaved: Math.round(totalWaterSaved * 100) / 100,
    totalLandfillSaved: Math.round(totalLandfillSaved * 100) / 100,
  };
}
