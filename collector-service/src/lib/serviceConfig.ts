// Service configuration based on environment
export interface ServiceConfig {
  serviceType: 'office' | 'collector';
  port: number;
  appTitle: string;
  features: {
    adminPanel: boolean;
    analytics: boolean;
    userManagement: boolean;
    collectionManagement: boolean;
    collectorDashboard: boolean;
    photoCapture: boolean;
    routeManagement: boolean;
    collectionVerification: boolean;
  };
}

// Get service configuration from environment
export const getServiceConfig = (): ServiceConfig => {
  const serviceType = (process.env.NEXT_PUBLIC_SERVICE_TYPE || process.env.VITE_SERVICE_TYPE || 'collector') as 'office' | 'collector';
  const port = parseInt(process.env.NEXT_PUBLIC_PORT || process.env.VITE_PORT || '8082');
  
  const isOffice = serviceType === 'office';
  const isCollector = serviceType === 'collector';
  
  return {
    serviceType,
    port,
    appTitle: process.env.NEXT_PUBLIC_APP_TITLE || process.env.VITE_APP_TITLE || 'WozaMali',
    features: {
      // Office features
      adminPanel: isOffice && (process.env.NEXT_PUBLIC_ENABLE_ADMIN_PANEL || process.env.VITE_ENABLE_ADMIN_PANEL) === 'true',
      analytics: isOffice && (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS || process.env.VITE_ENABLE_ANALYTICS) === 'true',
      userManagement: isOffice && (process.env.NEXT_PUBLIC_ENABLE_USER_MANAGEMENT || process.env.VITE_ENABLE_USER_MANAGEMENT) === 'true',
      collectionManagement: isOffice && (process.env.NEXT_PUBLIC_ENABLE_COLLECTION_MANAGEMENT || process.env.VITE_ENABLE_COLLECTION_MANAGEMENT) === 'true',
      
      // Collector features
      collectorDashboard: isCollector && (process.env.NEXT_PUBLIC_ENABLE_COLLECTOR_DASHBOARD || process.env.VITE_ENABLE_COLLECTOR_DASHBOARD) === 'true',
      photoCapture: isCollector && (process.env.NEXT_PUBLIC_ENABLE_PHOTO_CAPTURE || process.env.VITE_ENABLE_PHOTO_CAPTURE) === 'true',
      routeManagement: isCollector && (process.env.NEXT_PUBLIC_ENABLE_ROUTE_MANAGEMENT || process.env.VITE_ENABLE_ROUTE_MANAGEMENT) === 'true',
      collectionVerification: isCollector && (process.env.NEXT_PUBLIC_ENABLE_COLLECTION_VERIFICATION || process.env.VITE_ENABLE_COLLECTION_VERIFICATION) === 'true',
    }
  };
};

// Export the current service configuration
export const serviceConfig = getServiceConfig();
