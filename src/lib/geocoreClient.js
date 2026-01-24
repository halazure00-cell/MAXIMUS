/**
 * Geocore API Client
 * Communicates with maximus-geocore backend service for heatmap data
 */

import { createLogger } from './logger';

const logger = createLogger('GeocoreClient');

const GEOCORE_API_URL = import.meta.env.VITE_GEOCORE_API_URL;
const GEOCORE_API_KEY = import.meta.env.VITE_GEOCORE_API_KEY;
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Check if geocore is properly configured
 * @returns {boolean}
 */
export function isGeocoreConfigured() {
    const isConfigured = Boolean(GEOCORE_API_URL && GEOCORE_API_KEY);
    logger.debug('Geocore configuration check', { 
        configured: isConfigured,
        hasUrl: Boolean(GEOCORE_API_URL),
        hasKey: Boolean(GEOCORE_API_KEY)
    });
    return isConfigured;
}

/**
 * Create a fetch request with timeout
 * @param {string} url
 * @param {object} options
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': GEOCORE_API_KEY,
                ...options.headers,
            },
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

/**
 * Get heatmap data with H3 indexing
 * @param {object} params
 * @param {number} params.resolution - H3 resolution (default: 9)
 * @param {string} params.startDate - ISO date string
 * @param {string} params.endDate - ISO date string
 * @param {number} params.limit - Max results
 * @returns {Promise<Array>}
 */
export async function getHeatmapData({ 
    resolution = 9, 
    startDate = null, 
    endDate = null, 
    limit = 100 
} = {}) {
    if (!isGeocoreConfigured()) {
        logger.warn('Geocore not configured, skipping heatmap data fetch');
        return [];
    }

    try {
        const params = new URLSearchParams();
        if (resolution !== null && resolution !== undefined) params.append('resolution', resolution);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (limit) params.append('limit', limit);

        const url = `${GEOCORE_API_URL}/api/heatmap?${params.toString()}`;
        logger.debug('Fetching heatmap data', { url, params: Object.fromEntries(params) });

        const response = await fetchWithTimeout(url, { method: 'GET' });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        logger.info('Heatmap data fetched successfully', { count: data?.length || 0 });
        return data || [];
    } catch (error) {
        logger.error('Failed to fetch heatmap data', error);
        throw error;
    }
}

/**
 * Get pre-aggregated heatmap cells
 * @param {object} params
 * @param {number} params.minIntensity - Minimum intensity threshold
 * @param {number} params.limit - Max results
 * @returns {Promise<Array>}
 */
export async function getHeatmapCells({ minIntensity = 0, limit = 100 } = {}) {
    if (!isGeocoreConfigured()) {
        logger.warn('Geocore not configured, skipping heatmap cells fetch');
        return [];
    }

    try {
        const params = new URLSearchParams();
        if (minIntensity !== null && minIntensity !== undefined) params.append('minIntensity', minIntensity);
        if (limit) params.append('limit', limit);

        const url = `${GEOCORE_API_URL}/api/heatmap/cells?${params.toString()}`;
        logger.debug('Fetching heatmap cells', { url, params: Object.fromEntries(params) });

        const response = await fetchWithTimeout(url, { method: 'GET' });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        logger.info('Heatmap cells fetched successfully', { count: data?.length || 0 });
        return data || [];
    } catch (error) {
        logger.error('Failed to fetch heatmap cells', error);
        throw error;
    }
}

/**
 * Submit location point to geocore (non-blocking)
 * @param {number} latitude
 * @param {number} longitude
 * @param {object} metadata - Optional metadata
 * @returns {Promise<void>}
 */
export async function submitLocationPoint(latitude, longitude, metadata = {}) {
    if (!isGeocoreConfigured()) {
        logger.debug('Geocore not configured, skipping location submission');
        return;
    }

    try {
        const url = `${GEOCORE_API_URL}/api/locations`;
        const body = {
            latitude,
            longitude,
            timestamp: new Date().toISOString(),
            ...metadata,
        };

        logger.debug('Submitting location point', { latitude, longitude });

        // Non-blocking - don't wait for response
        fetchWithTimeout(url, {
            method: 'POST',
            body: JSON.stringify(body),
        }).catch(error => {
            logger.warn('Failed to submit location (non-blocking)', error);
        });
    } catch (error) {
        logger.warn('Failed to submit location (non-blocking)', error);
    }
}

/**
 * Check geocore service health
 * @returns {Promise<boolean>}
 */
export async function checkGeocoreHealth() {
    if (!isGeocoreConfigured()) {
        logger.debug('Geocore not configured, health check skipped');
        return false;
    }

    try {
        const url = `${GEOCORE_API_URL}/health`;
        logger.debug('Checking geocore health', { url });

        const response = await fetchWithTimeout(url, { method: 'GET' });
        const isHealthy = response.ok;
        
        logger.info('Geocore health check', { healthy: isHealthy, status: response.status });
        return isHealthy;
    } catch (error) {
        logger.warn('Geocore health check failed', error);
        return false;
    }
}
