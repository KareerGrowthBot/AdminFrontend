/**
 * LocalStorage utility functions
 */

const getData = (key) => {
  try {
    // Check if localStorage is available (not in service worker, iframe with restrictions, etc.)
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    // Handle "Access to storage is not allowed from this context" error
    if (error.name === 'SecurityError' || error.message?.includes('storage')) {
      console.warn("Storage access not allowed in this context:", error.message);
    } else {
      console.error('Error reading from localStorage:', error);
    }
  }
  return null;
};

const setData = (key, value) => {
  try {
    // Check if localStorage is available (not in service worker, iframe with restrictions, etc.)
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Handle "Access to storage is not allowed from this context" error
    if (error.name === 'SecurityError' || error.message?.includes('storage')) {
      console.warn("Storage access not allowed in this context:", error.message);
    } else {
      console.error('Error saving to localStorage:', error);
    }
  }
};

const removeData = (key) => {
  try {
    // Check if localStorage is available (not in service worker, iframe with restrictions, etc.)
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(key);
  } catch (error) {
    // Handle "Access to storage is not allowed from this context" error
    if (error.name === 'SecurityError' || error.message?.includes('storage')) {
      console.warn("Storage access not allowed in this context:", error.message);
    } else {
      console.error('Error removing from localStorage:', error);
    }
  }
};

const clearAll = () => {
  try {
    // Check if localStorage is available (not in service worker, iframe with restrictions, etc.)
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    localStorage.clear();
  } catch (error) {
    // Handle "Access to storage is not allowed from this context" error
    if (error.name === 'SecurityError' || error.message?.includes('storage')) {
      console.warn("Storage access not allowed in this context:", error.message);
    } else {
      console.error('Error clearing localStorage:', error);
    }
  }
};

export { getData, setData, removeData, clearAll };

