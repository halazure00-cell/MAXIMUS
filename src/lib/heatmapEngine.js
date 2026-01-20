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
  NPH_MIN: 0, // Normalization bounds
  NPH_MAX: 100000,
  CR_MIN: 0,
  CR_MAX: 4, // Orders per hour
  DC_MIN: 0,
  DC_MAX: 50000, // Rupiah
  V_MIN: 0,
  V_MAX: 1,
  WEIGHTS: {
    NPH: 0.5, // Net Per Hour (primary)
    CR: 0.2, // Conversion Rate
    DC: 0.15, // Deadhead Cost (penalty)
    V: 0.10, // Volatility (penalty)
    C: 0.05, // Confidence (boost)
  },
  MIN_SCORE: 5.0, // Minimum viable score
  MAX_DISTANCE_KM: 10, // Hard limit
  EXPLORATION_BONUS: 0.2, // Boost for untried cells
  AVG_URBAN_SPEED_KPH: 25, // Conservative urban speed for deadhead calculations
};

/**
 * Min-max normalization
 * @param {number} value - Value to normalize
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Normalized value (0-1)
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
 * Calculate cell score
 * @param {object} cell - Cell data
 * @param {object} context - Context {userPos, fuelCostPerKm, baselineNPH}
 * @returns {number} Cell score (0-10+)
 */
export function computeScore(cell, context) {
  // Normalize metrics
  const nphNorm = normalize(
    cell.avg_nph || 0,
    CONFIG.NPH_MIN,
    CONFIG.NPH_MAX
  );
  
  const crNorm = normalize(
    cell.conversion_rate || 0,
    CONFIG.CR_MIN,
    CONFIG.CR_MAX
  );

  // Calculate deadhead cost for this cell
  const targetPos = {
    lat: cell.lat || cell.latitude,
    lon: cell.lon || cell.longitude,
  };
  const deadheadCost = computeDeadheadCost(context.userPos, targetPos, context);
  const dcNorm = normalize(deadheadCost, CONFIG.DC_MIN, CONFIG.DC_MAX);

  const vNorm = normalize(
    cell.volatility || 0,
    CONFIG.V_MIN,
    CONFIG.V_MAX
  );

  const confidence = cell.confidence || 0;

  // Weighted score
  const score =
    CONFIG.WEIGHTS.NPH * nphNorm +
    CONFIG.WEIGHTS.CR * crNorm -
    CONFIG.WEIGHTS.DC * dcNorm -
    CONFIG.WEIGHTS.V * vNorm +
    CONFIG.WEIGHTS.C * confidence;

  // Scale to 0-10 range
  return score * 10;
}

/**
 * Filter cells by context relevance
 * @param {array} cells - Array of cell data
 * @param {object} context - Context object
 * @returns {array} Filtered cells
 */
export function relevantCells(cells, context) {
  const {
    hour,
    dayType,
    userPos,
    fuelBudget = 50000,
    timeHorizon = 60,
    fuelCostPerKm = 2000,
  } = context;

  return cells.filter(cell => {
    // 1. Time match: ±1 hour window
    const cellHour = cell.hour_bucket || cell.hour || 0;
    const hourMatch = Math.abs(cellHour - hour) <= 1;

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

    return hourMatch && dayMatch && distMatch && fuelMatch;
  });
}

/**
 * Generate explanation text for recommendation
 * @param {object} cell - Cell data
 * @returns {string} Human-readable explanation
 */
export function generateReason(cell) {
  const reasons = [];

  // Primary reason (highest contributing factor)
  if (cell.avg_nph && cell.avg_nph > 40000) {
    reasons.push(`Net tinggi (Rp${(cell.avg_nph / 1000).toFixed(0)}k/jam)`);
  }

  if (cell.avg_wait_min && cell.avg_wait_min < 10) {
    reasons.push(`wait <${cell.avg_wait_min}min`);
  }

  if (cell.distance_km && cell.distance_km < 1.5) {
    reasons.push('jarak dekat');
  }

  if (cell.confidence && cell.confidence < 0.5) {
    reasons.push('⚠️ data terbatas');
  }

  // Default if no specific reasons
  if (reasons.length === 0) {
    reasons.push('Spot potensial');
  }

  // Max 3 reasons
  return reasons.slice(0, 3).join(', ');
}

/**
 * Generate top N recommendations
 * @param {array} cells - Array of cell data
 * @param {object} context - Context object
 * @param {object} options - Options {limit, includeExploration}
 * @returns {array} Ranked recommendations
 */
export function generateRecommendations(cells, context, options = {}) {
  const { limit = 5, includeExploration = false } = options;

  // 1. Filter to relevant cells
  let relevantCellList = relevantCells(cells, context);

  // 2. Score each cell
  relevantCellList = relevantCellList.map(cell => {
    const targetPos = {
      lat: cell.lat || cell.latitude,
      lon: cell.lon || cell.longitude,
    };
    
    const score = computeScore(cell, context);
    const distance_km = haversineDistance(
      context.userPos.lat,
      context.userPos.lon,
      targetPos.lat,
      targetPos.lon
    );
    const deadhead_cost = computeDeadheadCost(context.userPos, targetPos, context);

    return {
      ...cell,
      score,
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
 * Get time bucket (hour of day) from date
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
  hour,
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
    hour: hour !== undefined ? hour : getHourBucket(now),
    dayType: dayType || getDayType(now),
    fuelCostPerKm,
    fuelBudget,
    timeHorizon,
    baselineNPH,
  };
}

export default {
  normalize,
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
  getDayType,
  createContext,
  CONFIG,
};
