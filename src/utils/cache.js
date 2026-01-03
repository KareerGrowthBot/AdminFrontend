/**
 * Utilities for caching API responses
 */
import { getData, setData, removeData } from './LocalStorage';

// Default cache duration in milliseconds (5 minutes)
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000;

// Get cached data
export const getCachedData = (key) => {
  console.log('Getting cached data for key:', key);
  
  try {
    const cachedItem = getData(`cache:${key}`);
    if (!cachedItem) {
      console.log('No cached data found for key:', key);
      return null;
    }
    
    console.log('Retrieved cached data for key:', key);
    return cachedItem;
  } catch (error) {
    console.error('Error retrieving cached data:', error);
    return null;
  }
};

// Set cached data
export const setCachedData = (key, data, duration = DEFAULT_CACHE_DURATION) => {
  console.log('Setting cached data for key:', key);
  
  try {
    const item = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + duration
    };
    
    setData(`cache:${key}`, item);
    console.log('Successfully cached data for key:', key);
    return true;
  } catch (error) {
    console.error('Error caching data:', error);
    return false;
  }
};

// Check if cache is still valid
export const isCacheValid = (timestamp, duration = DEFAULT_CACHE_DURATION) => {
  const now = Date.now();
  const isValid = timestamp + duration > now;
  
  console.log('Cache validity check:', isValid ? 'Valid' : 'Expired');
  return isValid;
};

// Clear specific cache item
export const clearCacheItem = (key) => {
  console.log('Clearing cache for key:', key);
  removeData(`cache:${key}`);
};

// Clear all cache
export const clearCache = () => {
  console.log('Clearing all cache');
  
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache:')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => removeData(key));
    console.log(`Cleared ${keysToRemove.length} cache items`);
  } catch (error) {
    if (error.name === 'SecurityError' || error.message?.includes('storage')) {
      console.warn("Storage access not allowed in this context");
    } else {
      console.error('Error clearing cache:', error);
    }
  }
};

// Clear expired cache
export const clearExpiredCache = () => {
  console.log('Clearing expired cache items');
  
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    
    const now = Date.now();
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache:')) {
        try {
          const cachedItem = getData(key);
          if (cachedItem && cachedItem.expiry < now) {
            keysToRemove.push(key);
          }
        } catch (error) {
          console.error('Error parsing cached item:', error);
          keysToRemove.push(key); // Remove invalid items
        }
      }
    }
    
    keysToRemove.forEach(key => removeData(key));
    console.log(`Cleared ${keysToRemove.length} expired cache items`);
  } catch (error) {
    if (error.name === 'SecurityError' || error.message?.includes('storage')) {
      console.warn("Storage access not allowed in this context");
    } else {
      console.error('Error clearing expired cache:', error);
    }
  }
};

