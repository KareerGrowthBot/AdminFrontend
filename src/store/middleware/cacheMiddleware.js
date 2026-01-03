/**
 * Middleware for caching API responses
 */
import { getCachedData, setCachedData, isCacheValid, clearCacheItem } from '../../utils/cache';

// Define cacheable endpoints
const CACHEABLE_ENDPOINTS = [
  '/api/admins',
  '/api/candidates',
  '/auth/me',
  // Add more cacheable endpoints as needed
];

// Define endpoints that should invalidate the cache
const CACHE_INVALIDATING_ENDPOINTS = [
  '/auth/logout',
  '/api/admins',
  '/api/candidates/invite',
  // Add more invalidating endpoints as needed
];

/**
 * Check if endpoint should be cached
 * @param {string} url - Request URL
 * @returns {boolean} Whether endpoint is cacheable
 */
export const isCacheable = (url) => {
  return CACHEABLE_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

/**
 * Get cached response if available and valid
 * @param {string} url - Request URL
 * @param {Object} config - Request config
 * @returns {Object|null} Cached response or null
 */
export const getCachedResponse = (url, config = {}) => {
  if (!isCacheable(url)) {
    return null;
  }
  
  const cacheKey = `${config.method || 'GET'}:${url}:${JSON.stringify(config.params || {})}`;
  const cachedData = getCachedData(cacheKey);
  
  if (cachedData && isCacheValid(cachedData.timestamp)) {
    console.log('Using cached data for:', url);
    return cachedData.data;
  }
  
  return null;
};

/**
 * Cache API response
 * @param {string} url - Request URL
 * @param {Object} config - Request config
 * @param {Object} response - API response
 */
export const cacheResponse = (url, config = {}, response) => {
  if (!isCacheable(url)) {
    return;
  }
  
  const cacheKey = `${config.method || 'GET'}:${url}:${JSON.stringify(config.params || {})}`;
  setCachedData(cacheKey, response);
  console.log('Cached response for:', url);
};

/**
 * Invalidate cache for endpoint
 * @param {string} url - Request URL
 */
export const invalidateCache = (url) => {
  if (CACHE_INVALIDATING_ENDPOINTS.some(endpoint => url.includes(endpoint))) {
    console.log('Invalidating cache for:', url);
    // Clear all cache entries that match this endpoint
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache:') && key.includes(url)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => clearCacheItem(key.replace('cache:', '')));
    } catch (error) {
      if (error.name === 'SecurityError' || error.message?.includes('storage')) {
        console.warn("Storage access not allowed in this context");
      } else {
        console.error('Error invalidating cache:', error);
      }
    }
  }
};

export default {
  isCacheable,
  getCachedResponse,
  cacheResponse,
  invalidateCache
};

