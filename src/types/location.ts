// WozaMoney Location Types
// These types correspond to the location data in your Supabase database

export interface Township {
  id: string;
  name: string;
  postal_code: string;
  city: string;
  province: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: string;
  name: string;
  province: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationData {
  townships: Township[];
  cities: City[];
}

// Helper types for form data
export interface AddressFormData {
  streetAddress: string;
  township: string;
  city: string;
  postalCode: string;
}

// API response types
export interface LocationApiResponse {
  data: Township[] | City[] | null;
  error: string | null;
}

// Constants for the frontend (can be used as fallback)
export const SOWETO_TOWNSHIPS = [
  'Baragwanath', 'Chiawelo', 'Dlamini', 'Dobsonville', 'Emdeni',
  'Jabavu', 'Kliptown', 'Klipspruit', 'Meadowlands', 'Mofolo',
  'Moroka', 'Naledi', 'Orlando', 'Pimville', 'Protea Glen',
  'Protea North', 'Protea South', 'Senaoane', 'Zola', 'Zondi'
] as const;

export const SOWETO_POSTAL_CODES: Record<string, string> = {
  'Baragwanath': '1862', 'Chiawelo': '1818', 'Dlamini': '1804',
  'Dobsonville': '1804', 'Emdeni': '1804', 'Jabavu': '1804',
  'Kliptown': '1804', 'Klipspruit': '1804', 'Meadowlands': '1804',
  'Mofolo': '1804', 'Moroka': '1804', 'Naledi': '1804',
  'Orlando': '1804', 'Pimville': '1804', 'Protea Glen': '1804',
  'Protea North': '1804', 'Protea South': '1804', 'Senaoane': '1804',
  'Zola': '1804', 'Zondi': '1866'
};

export const GAUTENG_CITIES = [
  'Soweto', 'Johannesburg', 'Pretoria', 'Centurion', 'Sandton',
  'Randburg', 'Roodepoort', 'Krugersdorp', 'Boksburg', 'Benoni',
  'Springs', 'Brakpan', 'Kempton Park', 'Tembisa', 'Midrand',
  'Fourways', 'Northcliff', 'Melville', 'Rosebank', 'Parktown'
] as const;

// Utility functions
export const getPostalCode = (townshipName: string): string => {
  return SOWETO_POSTAL_CODES[townshipName] || '';
};

export const isSowetoTownship = (townshipName: string): boolean => {
  return SOWETO_TOWNSHIPS.includes(townshipName as any);
};

export const isGautengCity = (cityName: string): boolean => {
  return GAUTENG_CITIES.includes(cityName as any);
};
