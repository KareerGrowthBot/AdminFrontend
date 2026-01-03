/**
 * Logger utility for API requests and responses
 * Only active in development mode
 */

/**
 * Log API request
 * @param {Object} config - Axios request config
 */
export const logRequest = (config) => {
  if (!import.meta.env.DEV) {
    return;
  }

  console.group(`%cAPI REQUEST: ${config.method?.toUpperCase()} ${config.url}`, 'color: #3498db; font-weight: bold');
  console.log('%cConfig:', 'color: #7f8c8d', config);
  if (config.data) {
    console.log('%cData:', 'color: #2ecc71', config.data);
  }
  console.groupEnd();
};

/**
 * Log API response
 * @param {Object} response - Axios response object
 */
export const logResponse = (response) => {
  if (!import.meta.env.DEV) {
    return;
  }

  console.group(`%cAPI RESPONSE: ${response.config?.method?.toUpperCase()} ${response.config?.url}`, 'color: #2ecc71; font-weight: bold');
  console.log('%cStatus:', 'color: #2ecc71', response.status);
  console.log('%cData:', 'color: #2ecc71', response.data);
  console.groupEnd();
};

/**
 * Log API error
 * @param {Error} error - Error object
 */
export const logError = (error) => {
  if (!import.meta.env.DEV) {
    return;
  }

  console.group(`%cAPI ERROR: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, 'color: #e74c3c; font-weight: bold');
  console.error('%cError:', 'color: #e74c3c', error);
  if (error.response) {
    console.error('%cResponse:', 'color: #e74c3c', error.response.data);
    console.error('%cStatus:', 'color: #e74c3c', error.response.status);
  }
  console.groupEnd();
};

export default {
  logRequest,
  logResponse,
  logError
};

