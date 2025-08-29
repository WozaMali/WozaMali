/**
 * Session persistence utilities to prevent authentication state loss on refresh
 */

// Check if we're in a browser environment
export const isBrowser = typeof window !== 'undefined';

// Session storage keys
const SESSION_KEYS = {
  USER_ID: 'wozamali_user_id',
  USER_ROLE: 'wozamali_user_role',
  LAST_ACTIVITY: 'wozamali_last_activity',
  WALLET_CACHE: 'wozamali_wallet_cache'
} as const;

// Cache duration for wallet data (5 minutes)
const WALLET_CACHE_DURATION = 5 * 60 * 1000;

/**
 * Save user session data to localStorage
 */
export const saveSessionData = (userId: string, userRole: string) => {
  if (!isBrowser) return;
  
  try {
    localStorage.setItem(SESSION_KEYS.USER_ID, userId);
    localStorage.setItem(SESSION_KEYS.USER_ROLE, userRole);
    localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, Date.now().toString());
  } catch (error) {
    console.warn('Failed to save session data:', error);
  }
};

/**
 * Get user session data from localStorage
 */
export const getSessionData = () => {
  if (!isBrowser) return null;
  
  try {
    const userId = localStorage.getItem(SESSION_KEYS.USER_ID);
    const userRole = localStorage.getItem(SESSION_KEYS.USER_ROLE);
    const lastActivity = localStorage.getItem(SESSION_KEYS.LAST_ACTIVITY);
    
    if (!userId || !lastActivity) return null;
    
    // Check if session is expired (24 hours)
    const sessionAge = Date.now() - parseInt(lastActivity);
    if (sessionAge > 24 * 60 * 60 * 1000) {
      clearSessionData();
      return null;
    }
    
    return { userId, userRole, lastActivity: parseInt(lastActivity) };
  } catch (error) {
    console.warn('Failed to get session data:', error);
    return null;
  }
};

/**
 * Clear session data from localStorage
 */
export const clearSessionData = () => {
  if (!isBrowser) return;
  
  try {
    Object.values(SESSION_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Failed to clear session data:', error);
  }
};

/**
 * Save wallet data to cache
 */
export const saveWalletCache = (userId: string, walletData: any) => {
  if (!isBrowser) return;
  
  try {
    const cacheData = {
      data: walletData,
      timestamp: Date.now(),
      userId
    };
    localStorage.setItem(SESSION_KEYS.WALLET_CACHE, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to save wallet cache:', error);
  }
};

/**
 * Get wallet data from cache
 */
export const getWalletCache = (userId: string) => {
  if (!isBrowser) return null;
  
  try {
    const cached = localStorage.getItem(SESSION_KEYS.WALLET_CACHE);
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    
    // Check if cache is for the same user and not expired
    if (cacheData.userId === userId && 
        (Date.now() - cacheData.timestamp) < WALLET_CACHE_DURATION) {
      return cacheData.data;
    }
    
    // Clear expired cache
    localStorage.removeItem(SESSION_KEYS.WALLET_CACHE);
    return null;
  } catch (error) {
    console.warn('Failed to get wallet cache:', error);
    return null;
  }
};

/**
 * Clear wallet cache
 */
export const clearWalletCache = () => {
  if (!isBrowser) return;
  
  try {
    localStorage.removeItem(SESSION_KEYS.WALLET_CACHE);
  } catch (error) {
    console.warn('Failed to clear wallet cache:', error);
  }
};

/**
 * Update last activity timestamp
 */
export const updateLastActivity = () => {
  if (!isBrowser) return;
  
  try {
    localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, Date.now().toString());
  } catch (error) {
    console.warn('Failed to update last activity:', error);
  }
};

/**
 * Check if session is still valid
 */
export const isSessionValid = () => {
  const sessionData = getSessionData();
  if (!sessionData) return false;
  
  // Check if session is expired (24 hours)
  const sessionAge = Date.now() - sessionData.lastActivity;
  return sessionAge <= 24 * 60 * 60 * 1000;
};
