/**
 * Location Service for robust geolocation handling
 * 
 * Features:
 * - Throttled updates to prevent spam
 * - Graceful error handling for permission denied, timeout, etc.
 * - Permission state detection
 * - Haversine distance calculation
 */

/**
 * @typedef {Object} LocationData
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} accuracy - Accuracy in meters
 * @property {number} ts - Timestamp
 */

/**
 * @typedef {Object} LocationError
 * @property {string} code - 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED'
 * @property {string} message - Human-readable error message
 */

// Error code mapping
const ERROR_CODES = {
  1: 'PERMISSION_DENIED',
  2: 'POSITION_UNAVAILABLE',
  3: 'TIMEOUT',
};

const ERROR_MESSAGES = {
  PERMISSION_DENIED: 'Izin lokasi ditolak. Aktifkan di pengaturan browser/HP.',
  POSITION_UNAVAILABLE: 'Lokasi tidak tersedia. Pastikan GPS aktif.',
  TIMEOUT: 'Timeout mendapatkan lokasi. Coba lagi.',
  NOT_SUPPORTED: 'Geolocation tidak didukung di perangkat ini.',
};

/**
 * Watch user location with throttling and error handling
 * 
 * @param {Object} options
 * @param {Function} options.onUpdate - Callback for location updates
 * @param {Function} options.onError - Callback for errors
 * @param {number} options.throttleMs - Minimum interval between updates (default: 4000ms)
 * @param {boolean} options.enableHighAccuracy - Use high accuracy mode (default: true)
 * @param {number} options.timeout - Timeout in ms (default: 12000)
 * @param {number} options.maximumAge - Maximum age of cached position (default: 10000)
 * @returns {Function} Cleanup function to stop watching
 */
export function watchLocation({
  onUpdate,
  onError,
  throttleMs = 4000,
  enableHighAccuracy = true,
  timeout = 12000,
  maximumAge = 10000,
} = {}) {
  if (!('geolocation' in navigator)) {
    onError?.({
      code: 'NOT_SUPPORTED',
      message: ERROR_MESSAGES.NOT_SUPPORTED,
    });
    return () => {};
  }

  let lastEmit = 0;

  const handleSuccess = (position) => {
    const now = Date.now();
    if (now - lastEmit < throttleMs) return;
    lastEmit = now;

    const { latitude, longitude, accuracy } = position.coords;
    onUpdate?.({
      latitude,
      longitude,
      accuracy,
      ts: position.timestamp,
    });
  };

  const handleError = (err) => {
    const code = ERROR_CODES[err.code] || 'UNKNOWN';
    const message = ERROR_MESSAGES[code] || err.message || 'Error mendapatkan lokasi.';
    onError?.({ code, message, raw: err });
  };

  const id = navigator.geolocation.watchPosition(
    handleSuccess,
    handleError,
    {
      enableHighAccuracy,
      timeout,
      maximumAge,
    }
  );

  return () => {
    navigator.geolocation.clearWatch(id);
  };
}

/**
 * Get current position once
 * 
 * @param {Object} options
 * @param {boolean} options.enableHighAccuracy - Use high accuracy mode (default: true)
 * @param {number} options.timeout - Timeout in ms (default: 10000)
 * @param {number} options.maximumAge - Maximum age of cached position (default: 0)
 * @returns {Promise<LocationData>}
 */
export function getCurrentPosition({
  enableHighAccuracy = true,
  timeout = 10000,
  maximumAge = 0,
} = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject({
        code: 'NOT_SUPPORTED',
        message: ERROR_MESSAGES.NOT_SUPPORTED,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        resolve({
          latitude,
          longitude,
          accuracy,
          ts: position.timestamp,
        });
      },
      (err) => {
        const code = ERROR_CODES[err.code] || 'UNKNOWN';
        const message = ERROR_MESSAGES[code] || err.message || 'Error mendapatkan lokasi.';
        reject({ code, message, raw: err });
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  });
}

/**
 * Check geolocation permission state
 * 
 * @returns {Promise<'granted' | 'denied' | 'prompt' | 'unsupported'>}
 */
export async function checkLocationPermission() {
  if (!('geolocation' in navigator)) {
    return 'unsupported';
  }

  if (!('permissions' in navigator)) {
    // Fallback: try to get position to determine state
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state; // 'granted', 'denied', or 'prompt'
  } catch {
    return 'prompt';
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * 
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lon1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lon2 - Longitude of point 2 (degrees)
 * @returns {number|null} Distance in kilometers, or null if invalid input
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  // Validate inputs - check for null/undefined and NaN
  if (
    lat1 === null || lat1 === undefined ||
    lon1 === null || lon1 === undefined ||
    lat2 === null || lat2 === undefined ||
    lon2 === null || lon2 === undefined ||
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
  ) {
    return null;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number}
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 * @param {number|null} distance - Distance in kilometers
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string}
 */
export function formatDistance(distance, decimals = 1) {
  if (distance == null) return '-';
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(decimals)} km`;
}

/**
 * Get user-friendly location status message
 * @param {string} permissionState - Permission state
 * @returns {{ status: string, canRetry: boolean, message: string }}
 */
export function getLocationStatusMessage(permissionState) {
  switch (permissionState) {
    case 'granted':
      return {
        status: 'active',
        canRetry: false,
        message: 'Lokasi aktif',
      };
    case 'denied':
      return {
        status: 'denied',
        canRetry: false,
        message: 'Izin lokasi ditolak. Aktifkan di pengaturan browser/HP.',
      };
    case 'prompt':
      return {
        status: 'prompt',
        canRetry: true,
        message: 'Izinkan akses lokasi untuk fitur ini.',
      };
    case 'unsupported':
      return {
        status: 'unsupported',
        canRetry: false,
        message: 'Geolocation tidak didukung di perangkat ini.',
      };
    default:
      return {
        status: 'unknown',
        canRetry: true,
        message: 'Status lokasi tidak diketahui.',
      };
  }
}
