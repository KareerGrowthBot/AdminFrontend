/**
 * Simple in-memory cache for API responses to prevent duplicate calls
 */

// In-memory cache store
const apiCache = new Map();

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Generate cache key from endpoint and params
 */
const getCacheKey = (endpoint, params = {}) => {
  const paramsStr = JSON.stringify(params);
  return `${endpoint}:${paramsStr}`;
};

/**
 * Get cached API response if available and valid
 */
export const getCachedResponse = (endpoint, params = {}) => {
  const cacheKey = getCacheKey(endpoint, params);
  const cached = apiCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Using cached API response for:', endpoint);
    return cached.data;
  }
  
  // Remove expired cache
  if (cached) {
    apiCache.delete(cacheKey);
  }
  
  return null;
};

/**
 * Cache API response
 */
export const setCachedResponse = (endpoint, params = {}, data) => {
  const cacheKey = getCacheKey(endpoint, params);
  apiCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  console.log('Cached API response for:', endpoint);
};

/**
 * Clear cache for specific endpoint
 */
export const clearCache = (endpoint, params = {}) => {
  const cacheKey = getCacheKey(endpoint, params);
  apiCache.delete(cacheKey);
};

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  apiCache.clear();
  console.log('Cleared all API cache');
};

/**
 * Clear cache for endpoints matching pattern
 */
export const clearCacheByPattern = (pattern) => {
  const keysToDelete = [];
  apiCache.forEach((value, key) => {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => apiCache.delete(key));
  console.log(`Cleared ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
};

