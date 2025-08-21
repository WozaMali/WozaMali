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
  const serviceType = (import.meta.env.VITE_SERVICE_TYPE || 'office') as 'office' | 'collector';
  const port = parseInt(import.meta.env.VITE_PORT || '8081');
  
  const isOffice = serviceType === 'office';
  const isCollector = serviceType === 'collector';
  
  return {
    serviceType,
    port,
    appTitle: import.meta.env.VITE_APP_TITLE || 'WozaMali',
    features: {
      // Office features
      adminPanel: isOffice && import.meta.env.VITE_ENABLE_ADMIN_PANEL === 'true',
      analytics: isOffice && import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
      userManagement: isOffice && import.meta.env.VITE_ENABLE_USER_MANAGEMENT === 'true',
      collectionManagement: isOffice && import.meta.env.VITE_ENABLE_COLLECTION_MANAGEMENT === 'true',
      
      // Collector features
      collectorDashboard: isCollector && import.meta.env.VITE_ENABLE_COLLECTOR_DASHBOARD === 'true',
      photoCapture: isCollector && import.meta.env.VITE_ENABLE_PHOTO_CAPTURE === 'true',
      routeManagement: isCollector && import.meta.env.VITE_ENABLE_ROUTE_MANAGEMENT === 'true',
      collectionVerification: isCollector && import.meta.env.VITE_ENABLE_COLLECTION_VERIFICATION === 'true',
    }
  };
};

// Export the current service configuration
export const serviceConfig = getServiceConfig();
