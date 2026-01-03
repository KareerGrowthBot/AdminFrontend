/**
 * Asset utility functions
 */

/**
 * Convert relative path to absolute URL
 * Examples:
 * 1. In a background image: <div style={{backgroundImage: `url('${toAbsoluteUrl('/media/misc/pattern-1.jpg')}')`}}>...
 * 2. In img tag: <img src={toAbsoluteUrl('/media/avatars/300-2.jpg')} />
 */
export const toAbsoluteUrl = (pathname) => {
  const baseUrl = import.meta.env.BASE_URL;
  if (baseUrl && baseUrl !== '/') {
    return import.meta.env.BASE_URL + pathname;
  } else {
    return pathname;
  }
};

