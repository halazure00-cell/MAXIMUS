/**
 * Heatmap Engine - Driver Decision Support System
 * 
 * This module implements the scoring algorithm for driver heatmap recommendations.
 * Based on HEATMAP_DESIGN.md specifications.
 * 
 * Key Features:
 * - Net Per Hour (NPH) optimization
 * - Deadhead cost penalty
 * - Conversion rate scoring
 * - Volatility/risk assessment
 * - Confidence weighting
 * - Offline-first compatible
 */

import { latLngToCell, cellToLatLng, gridDisk } from 'h3-js';
import { haversineDistance } from './location';

// Configuration constants
const CONFIG = {
  H3_RESOLUTION: 8, // ~0.46 km² cells (~800m diameter)
  CONFIDENCE_THRESHOLD: 10, // Min orders for full confidence
  MIN_ORDERS_FOR_RECOMMENDATION: 5, // Cold start threshold
  
  // Robust normalization: use percentile clamping instead of fixed bounds
  PERCENTILE_LOW: 10, // p10 for robust min
  PERCENTILE_HIGH: 90, // p90 for robust max
  
  WEIGHTS: {
    NPH: 0.5, // Net Per Hour (primary)
    CR: 0.2, // Conversion Rate
    DC: 0.15, // Deadhead Cost (penalty)
    V: 0.10, // Volatility (penalty)
    // Confidence is now multiplicative, not additive
  },
  MIN_SCORE: 3.0, // Minimum viable score (lowered since confidence is multiplicative)
  MAX_DISTANCE_KM: 10, // Hard limit
  EXPLORATION_BONUS: 0.2, // Boost for untried cells
  AVG_URBAN_SPEED_KPH: 25, // Conservative urban speed for deadhead calculations
  
  // Practical time periods (not 24 hourly buckets)
  TIME_PERIODS: {
    'pagi': { start: 5, end: 11, label: 'Pagi (05:00-11:00)' },      // Morning
    'siang': { start: 11, end: 15, label: 'Siang (11:00-15:00)' },   // Lunch/Afternoon
    'sore': { start: 15, end: 19, label: 'Sore (15:00-19:00)' },     // Evening commute
    'malam': { start: 19, end: 23, label: 'Malam (19:00-23:00)' },   // Night
    'tengah_malam': { start: 23, end: 5, label: 'Tengah Malam (23:00-05:00)' }, // Late night (wraps around)
  },
};

/**
 * Robust normalization using percentile clamping
 * More resilient to outliers than min-max normalization
 * @param {number} value - Value to normalize
 * @param {number[]} allValues - All values in the dataset for percentile calculation
 * @returns {number} Normalized value (0-1)
 */
export function normalizeRobust(value, allValues) {
  if (!allValues || allValues.length === 0) return 0;
  
  // Sort values for percentile calculation
  const sorted = [...allValues].filter(v => v != null && !isNaN(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  
  // Calculate p10 and p90
  const p10Index = Math.floor(sorted.length * CONFIG.PERCENTILE_LOW / 100);
  const p90Index = Math.floor(sorted.length * CONFIG.PERCENTILE_HIGH / 100);
  const p10 = sorted[p10Index] || sorted[0];
  const p90 = sorted[p90Index] || sorted[sorted.length - 1];
  
  // Clamp value between p10 and p90, then normalize
  const clamped = Math.max(p10, Math.min(p90, value));
  const range = p90 - p10;
  
  return range > 0 ? (clamped - p10) / range : 0;
}

/**
 * Legacy normalize function (kept for backward compatibility)
 * Use normalizeRobust for new code
 */
export function normalize(value, min, max) {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Encode lat/lon to H3 cell ID
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {string} H3 cell ID
 */
export function encodeLocation(lat, lon) {
  return latLngToCell(lat, lon, CONFIG.H3_RESOLUTION);
}

/**
 * Decode H3 cell ID to lat/lon centroid
 * @param {string} cellId - H3 cell ID
 * @returns {[number, number]} [lat, lon]
 */
export function decodeLocation(cellId) {
  return cellToLatLng(cellId);
}

/**
 * Get neighboring cells (1-ring)
 * @param {string} cellId - H3 cell ID
 * @returns {string[]} Array of cell IDs (self + 6 neighbors)
 */
export function getNeighbors(cellId) {
  return gridDisk(cellId, 1);
}

/**
 * Calculate deadhead cost
 * @param {object} userPos - User position {lat, lon}
 * @param {object} targetPos - Target position {lat, lon}
 * @param {object} context - Context {fuelCostPerKm, baselineNPH}
 * @returns {number} Deadhead cost in Rupiah
 */
export function computeDeadheadCost(userPos, targetPos, context) {
  const distanceKm = haversineDistance(
    userPos.lat,
    userPos.lon,
    targetPos.lat,
    targetPos.lon
  );

  const fuelCost = distanceKm * (context.fuelCostPerKm || 2000);
  
  // Opportunity cost: time spent deadheading could be earning
  const durationHours = distanceKm / CONFIG.AVG_URBAN_SPEED_KPH;
  const opportunityCost = durationHours * (context.baselineNPH || 30000);

  return fuelCost + opportunityCost;
}

/**
 * Calculate cell score with robust normalization and multiplicative confidence
 * @param {object} cell - Cell data
 * @param {object} context - Context {userPos, fuelCostPerKm, baselineNPH, allCells}
 * @returns {object} {score, breakdown} - Score and detailed breakdown for debugging
 */
export function computeScore(cell, context) {
  const allCells = context.allCells || [];
  
  // Extract all values for robust normalization
  const allNPH = allCells.map(c => c.avg_nph || 0);
  const allCR = allCells.map(c => c.conversion_rate || 0);
  const allV = allCells.map(c => c.volatility || 0);
  
  // Robust normalize metrics
  const nphNorm = normalizeRobust(cell.avg_nph || 0, allNPH);
  const crNorm = normalizeRobust(cell.conversion_rate || 0, allCR);
  const vNorm = normalizeRobust(cell.volatility || 0, allV);

  // Calculate deadhead cost for this cell
  const targetPos = {
    lat: cell.lat || cell.latitude,
    lon: cell.lon || cell.longitude,
  };
  const deadheadCost = computeDeadheadCost(context.userPos, targetPos, context);
  
  // Deadhead normalization using all computed deadhead costs
  const allDeadhead = allCells.map(c => {
    const pos = { lat: c.lat || c.latitude, lon: c.lon || c.longitude };
    return computeDeadheadCost(context.userPos, pos, context);
  });
  const dcNorm = normalizeRobust(deadheadCost, allDeadhead);

  // Confidence as multiplicative factor (0.3 to 1.0 range)
  // Prevents low-data cells from getting high scores
  const confidence = cell.confidence || 0;
  const confidenceMultiplier = 0.3 + (0.7 * confidence); // 30% base + 70% scaled by confidence

  // Weighted score (before confidence multiplier)
  const baseScore =
    CONFIG.WEIGHTS.NPH * nphNorm +
    CONFIG.WEIGHTS.CR * crNorm -
    CONFIG.WEIGHTS.DC * dcNorm -
    CONFIG.WEIGHTS.V * vNorm;

  // Apply confidence as multiplicative factor
  const score = baseScore * confidenceMultiplier * 10; // Scale to 0-10 range

  // Return score with breakdown for debugging
  return {
    score,
    breakdown: {
      nph_raw: cell.avg_nph || 0,
      nph_norm: nphNorm,
      cr_raw: cell.conversion_rate || 0,
      cr_norm: crNorm,
      dc_raw: deadheadCost,
      dc_norm: dcNorm,
      v_raw: cell.volatility || 0,
      v_norm: vNorm,
      confidence: confidence,
      confidence_multiplier: confidenceMultiplier,
      base_score: baseScore,
      final_score: score,
      sample_count: cell.order_count || 0,
    },
  };
}

/**
 * Filter cells by context relevance
 * @param {array} cells - Array of cell data
 * @param {object} context - Context object
 * @returns {array} Filtered cells
 */
export function relevantCells(cells, context) {
  const {
    timePeriod,
    dayType,
    userPos,
    fuelBudget = 50000,
    timeHorizon = 60,
    fuelCostPerKm = 2000,
  } = context;

  return cells.filter(cell => {
    // 1. Time period match
    const cellPeriod = cell.time_period || cell.timePeriod || 'siang';
    const periodMatch = cellPeriod === timePeriod;

    // 2. Day type match
    const cellDayType = cell.day_type || cell.dayType || 'weekday';
    const dayMatch = cellDayType === dayType;

    // 3. Distance constraint
    const targetPos = {
      lat: cell.lat || cell.latitude,
      lon: cell.lon || cell.longitude,
    };
    const dist = haversineDistance(
      userPos.lat,
      userPos.lon,
      targetPos.lat,
      targetPos.lon
    );
    const maxDist = timeHorizon < 60 ? 3 : 7; // km
    const distMatch = dist <= maxDist && dist <= CONFIG.MAX_DISTANCE_KM;

    // 4. Fuel budget
    const fuelCost = dist * fuelCostPerKm;
    const fuelMatch = fuelCost <= fuelBudget;

    return periodMatch && dayMatch && distMatch && fuelMatch;
  });
}

/**
 * Generate explanation text for recommendation
 * Phase 1: All metrics are estimates, clearly labeled
 * @param {object} cell - Cell data
 * @returns {string} Human-readable explanation
 */
export function generateReason(cell) {
  const reasons = [];

  // Primary reason (highest contributing factor)
  // Note: All values are estimates in Phase 1 (no location tracking yet)
  if (cell.avg_nph && cell.avg_nph > 40000) {
    reasons.push(`Est. net tinggi (~Rp${(cell.avg_nph / 1000).toFixed(0)}k/jam)`);
  }

  // Don't claim specific wait time in minutes unless actually computed
  // In Phase 1, we only have order count, not actual wait times
  if (cell.order_count && cell.order_count > 3) {
    reasons.push(`${cell.order_count} orderan (basis data)`);
  }

  if (cell.distance_km && cell.distance_km < 1.5) {
    reasons.push('jarak dekat');
  }

  if (cell.confidence && cell.confidence < 0.5) {
    reasons.push('⚠️ data terbatas');
  }

  // Default if no specific reasons
  if (reasons.length === 0) {
    reasons.push('Spot potensial (estimasi)');
  }

  // Max 3 reasons
  return reasons.slice(0, 3).join(', ');
}

/**
 * Generate top N recommendations
 * @param {array} cells - Array of cell data
 * @param {object} context - Context object
 * @param {object} options - Options {limit, includeExploration, debugMode}
 * @returns {array} Ranked recommendations
 */
export function generateRecommendations(cells, context, options = {}) {
  const { limit = 5, includeExploration = false, debugMode = false } = options;

  // 1. Filter to relevant cells
  let relevantCellList = relevantCells(cells, context);

  // Add allCells to context for robust normalization
  const contextWithCells = { ...context, allCells: relevantCellList };

  // 2. Score each cell with breakdown
  relevantCellList = relevantCellList.map(cell => {
    const targetPos = {
      lat: cell.lat || cell.latitude,
      lon: cell.lon || cell.longitude,
    };
    
    const scoreResult = computeScore(cell, contextWithCells);
    const distance_km = haversineDistance(
      context.userPos.lat,
      context.userPos.lon,
      targetPos.lat,
      targetPos.lon
    );
    const deadhead_cost = computeDeadheadCost(context.userPos, targetPos, context);

    return {
      ...cell,
      score: scoreResult.score,
      breakdown: scoreResult.breakdown,
      distance_km,
      deadhead_cost,
      reason: '', // Will be generated later
    };
  });

  // 3. Apply exploration bonus if enabled
  if (includeExploration) {
    relevantCellList.forEach(cell => {
      if ((cell.order_count || 0) === 0) {
        cell.score += CONFIG.EXPLORATION_BONUS * 10;
        cell.is_exploration = true;
      }
    });
  }

  // 4. Sort by score descending
  relevantCellList.sort((a, b) => b.score - a.score);

  // 5. Filter actionable (score > minimum threshold)
  const actionable = relevantCellList.filter(c => c.score >= CONFIG.MIN_SCORE);

  // 6. Take top N
  const topCells = actionable.slice(0, limit);

  // 7. Generate explanations and ranks
  topCells.forEach((cell, idx) => {
    cell.rank = idx + 1;
    cell.reason = generateReason(cell);
    
    // In debug mode, keep breakdown; otherwise remove it
    if (!debugMode) {
      delete cell.breakdown;
    }
  });

  return topCells;
}

/**
 * Check if fallback to strategic spots is needed
 * @param {array} recommendations - Generated recommendations
 * @param {number} totalOrders - Total orders by user
 * @returns {boolean} True if fallback needed
 */
export function needsFallback(recommendations, totalOrders) {
  // Cold start: <5 orders total
  if (totalOrders < CONFIG.MIN_ORDERS_FOR_RECOMMENDATION) {
    return true;
  }

  // Insufficient recommendations
  if (recommendations.length < 3) {
    return true;
  }

  // All recommendations have low confidence
  const lowConfidence = recommendations.every(r => (r.confidence || 0) < 0.3);
  if (lowConfidence) {
    return true;
  }

  return false;
}

/**
 * Get time period (practical buckets instead of hourly)
 * @param {Date} date - Date object
 * @returns {string} Time period key ('pagi', 'siang', 'sore', 'malam', 'tengah_malam')
 */
export function getTimePeriod(date = new Date()) {
  const hour = date.getHours();
  
  for (const [key, period] of Object.entries(CONFIG.TIME_PERIODS)) {
    // Handle wrap-around for tengah_malam (23:00-05:00)
    if (period.start > period.end) {
      if (hour >= period.start || hour < period.end) {
        return key;
      }
    } else {
      if (hour >= period.start && hour < period.end) {
        return key;
      }
    }
  }
  
  return 'siang'; // Default fallback
}

/**
 * Get time period label
 * @param {string} periodKey - Time period key
 * @returns {string} Human-readable label
 */
export function getTimePeriodLabel(periodKey) {
  return CONFIG.TIME_PERIODS[periodKey]?.label || periodKey;
}

/**
 * Get time bucket (hour of day) - DEPRECATED, use getTimePeriod instead
 * @param {Date} date - Date object
 * @returns {number} Hour (0-23)
 */
export function getHourBucket(date = new Date()) {
  return date.getHours();
}

/**
 * Get day type from date
 * @param {Date} date - Date object
 * @returns {string} 'weekday' | 'weekend'
 */
export function getDayType(date = new Date()) {
  const day = date.getDay();
  return day === 0 || day === 6 ? 'weekend' : 'weekday';
}

/**
 * Create context object from current state
 * @param {object} params - Parameters
 * @returns {object} Context object
 */
export function createContext({
  userLat,
  userLon,
  timePeriod,
  dayType,
  fuelCostPerKm = 2000,
  fuelBudget = 50000,
  timeHorizon = 60,
  baselineNPH = 30000,
}) {
  const now = new Date();
  
  return {
    userPos: {
      lat: userLat,
      lon: userLon,
    },
    timePeriod: timePeriod || getTimePeriod(now),
    dayType: dayType || getDayType(now),
    fuelCostPerKm,
    fuelBudget,
    timeHorizon,
    baselineNPH,
  };
}

export default {
  normalize,
  normalizeRobust,
  encodeLocation,
  decodeLocation,
  getNeighbors,
  computeDeadheadCost,
  computeScore,
  relevantCells,
  generateReason,
  generateRecommendations,
  needsFallback,
  getHourBucket,
  getTimePeriod,
  getTimePeriodLabel,
  getDayType,
  createContext,
  CONFIG,
};
