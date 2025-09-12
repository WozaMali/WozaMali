export interface ServiceConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  features: string[];
  maxRequestsPerMinute: number;
  timeout: number;
}

export interface AppConfig {
  environment: 'development' | 'staging' | 'production';
  services: Record<string, ServiceConfig>;
  features: {
    authentication: boolean;
    recycling: boolean;
    rewards: boolean;
    analytics: boolean;
    notifications: boolean;
  };
  limits: {
    maxFileSize: number;
    maxUploadsPerDay: number;
    maxPickupsPerDay: number;
  };
}

// Default service configurations
export const defaultServiceConfigs: Record<string, ServiceConfig> = {
  main: {
    name: 'Main Service',
    baseUrl: process.env.NEXT_PUBLIC_MAIN_SERVICE_URL || 'http://localhost:3000',
    features: ['authentication', 'recycling', 'rewards'],
    maxRequestsPerMinute: 100,
    timeout: 30000,
  },
  collector: {
    name: 'Collector Service',
    baseUrl: process.env.NEXT_PUBLIC_COLLECTOR_SERVICE_URL || 'http://localhost:3001',
    features: ['pickups', 'collections', 'analytics'],
    maxRequestsPerMinute: 200,
    timeout: 30000,
  },
  office: {
    name: 'Office Service',
    baseUrl: process.env.NEXT_PUBLIC_OFFICE_SERVICE_URL || 'http://localhost:3002',
    features: ['admin', 'analytics', 'reports'],
    maxRequestsPerMinute: 50,
    timeout: 30000,
  },
};

// Application configuration
export const appConfig: AppConfig = {
  environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
  services: defaultServiceConfigs,
  features: {
    authentication: true,
    recycling: true,
    rewards: true,
    analytics: true,
    notifications: true,
  },
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxUploadsPerDay: 100,
    maxPickupsPerDay: 50,
  },
};

// Service configuration getter
export const serviceConfig = {
  get: (serviceName: string): ServiceConfig | null => {
    return appConfig.services[serviceName] || null;
  },
  
  getAll: (): Record<string, ServiceConfig> => {
    return appConfig.services;
  },
  
  getFeature: (feature: string): string[] => {
    return Object.entries(appConfig.services)
      .filter(([_, config]) => config.features.includes(feature))
      .map(([name, _]) => name);
  },
  
  isFeatureEnabled: (feature: string): boolean => {
    return appConfig.features[feature as keyof typeof appConfig.features] || false;
  },
  
  getEnvironment: (): string => {
    return appConfig.environment;
  },
  
  isDevelopment: (): boolean => {
    return appConfig.environment === 'development';
  },
  
  isProduction: (): boolean => {
    return appConfig.environment === 'production';
  },
  
  getLimit: (limit: string): number => {
    return appConfig.limits[limit as keyof typeof appConfig.limits] || 0;
  },
  
  // Compatibility properties for existing components
  appTitle: 'WozaMali',
  serviceType: 'Main',
  features: appConfig.features,
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
  // Development overrides
  appConfig.features.notifications = false; // Disable notifications in dev
  appConfig.limits.maxFileSize = 50 * 1024 * 1024; // 50MB in dev
  // Ensure Office service points to local dev server (Next.js on 8081)
  appConfig.services.office.baseUrl = process.env.NEXT_PUBLIC_OFFICE_SERVICE_URL || 'http://localhost:8081';
}

if (process.env.NODE_ENV === 'production') {
  // Production overrides
  appConfig.limits.maxUploadsPerDay = 1000;
  appConfig.limits.maxPickupsPerDay = 500;
}

export default serviceConfig;
