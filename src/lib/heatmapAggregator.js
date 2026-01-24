/**
 * Heatmap Aggregator - Data Processing for Driver Insights
 * 
 * This module aggregates order data into heatmap cells for analysis.
 * Implements the aggregation strategy from HEATMAP_DESIGN.md.
 * 
 * Phase 1 (MVP): Simple aggregation from orders WITHOUT location tracking
 * Uses strategic_spots as fallback mapping (time-based + manual spot tagging)
 * Phase 2+: Full H3 grid with actual pickup coordinates
 */

import { getTimePeriod, getDayType, getTimePeriodLabel, encodeLocation } from './heatmapEngine';
import { parseISO, differenceInDays, subDays } from 'date-fns';

// Configuration constants
const CONFIG = {
  DEFAULT_ORDER_DURATION_HOURS: 0.5, // Assume 30 minutes per order (Phase 1 proxy - LABELED AS ESTIMATE)
};

/**
 * Aggregate orders into cells by time period/day for strategic spots
 * Phase 1: Uses strategic_spots mapping (NO pickup coordinates available)
 * This is a realistic fallback until Phase 2 adds location tracking
 * @param {array} orders - Array of order objects
 * @param {array} strategicSpots - Array of strategic spot objects
 * @param {object} options - Options {windowDays, decayDays}
 * @returns {array} Array of aggregated cell data
 */
export function aggregateOrdersToSpots(orders, strategicSpots, options = {}) {
  const { windowDays = 30, decayDays = 7 } = options;
  const now = new Date();
  const cutoffDate = subDays(now, windowDays);

  // Filter to recent orders
  const recentOrders = orders.filter(order => {
    const orderDate = parseISO(order.created_at);
    return orderDate >= cutoffDate;
  });

  // Group by spot + time_period + day_type
  const groups = {};

  strategicSpots.forEach(spot => {
    const spotOrders = recentOrders.filter(order => {
      // Phase 1 limitation: NO pickup coordinates in orders table
      // Fallback: Use time-based matching with strategic spots
      // This is less accurate but realistic given data constraints
      const orderDate = parseISO(order.created_at);
      const orderPeriod = getTimePeriod(orderDate);
      const orderDayType = getDayType(orderDate);

      // Map spot's hourly range to time periods
      const spotPeriods = getPeriodsForSpot(spot);
      const periodMatch = spotPeriods.includes(orderPeriod);
      const dayMatch = spot.is_weekend_only ? orderDayType === 'weekend' : true;

      return periodMatch && dayMatch;
    });

    // Create cells for each time period the spot covers
    const spotPeriods = getPeriodsForSpot(spot);
    spotPeriods.forEach(timePeriod => {
      const dayTypes = spot.is_weekend_only ? ['weekend'] : ['weekday', 'weekend'];

      dayTypes.forEach(dayType => {
        const key = `${spot.id}_${timePeriod}_${dayType}`;
        
        // Filter orders for this specific period/day combination
        const cellOrders = spotOrders.filter(order => {
          const orderDate = parseISO(order.created_at);
          const orderPeriod = getTimePeriod(orderDate);
          const orderDayType = getDayType(orderDate);
          return orderPeriod === timePeriod && orderDayType === dayType;
        });

        if (cellOrders.length > 0) {
          groups[key] = {
            spot_id: spot.id,
            spot_name: spot.name,
            category: spot.category,
            lat: spot.latitude,
            lon: spot.longitude,
            time_period: timePeriod,
            time_period_label: getTimePeriodLabel(timePeriod),
            day_type: dayType,
            orders: cellOrders,
          };
        }
      });
    });
  });

  // Compute metrics for each group
  const cells = Object.values(groups).map(group => {
    return computeCellMetrics(group, { decayDays });
  });

  return cells;
}

/**
 * Get time periods that a spot covers based on its start/end hours
 * Helper function for Phase 1 time-based mapping
 */
function getPeriodsForSpot(spot) {
  const periods = ['pagi', 'siang', 'sore', 'malam', 'tengah_malam'];
  const periodRanges = {
    'pagi': { start: 5, end: 11 },
    'siang': { start: 11, end: 15 },
    'sore': { start: 15, end: 19 },
    'malam': { start: 19, end: 23 },
    'tengah_malam': { start: 23, end: 5 },
  };
  
  const matchedPeriods = [];
  const spotStart = spot.start_hour;
  const spotEnd = spot.end_hour;
  
  periods.forEach(period => {
    const range = periodRanges[period];
    // Check if spot's hours overlap with this period
    const overlaps = (spotStart < range.end && spotEnd > range.start) ||
                     (range.start > range.end && (spotStart >= range.start || spotEnd <= range.end));
    if (overlaps) {
      matchedPeriods.push(period);
    }
  });
  
  return matchedPeriods.length > 0 ? matchedPeriods : ['siang']; // Default to siang
}

/**
 * Compute aggregated metrics for a cell
 * Phase 1: All duration/wait metrics are ESTIMATES (labeled as such)
 * @param {object} group - Grouped order data
 * @param {object} options - Options {decayDays}
 * @returns {object} Cell metrics
 */
function computeCellMetrics(group, options = {}) {
  const { decayDays = 7 } = options;
  const now = new Date();
  const orders = group.orders || [];

  // Apply time decay weighting
  const weightedOrders = orders.map(order => {
    const orderDate = parseISO(order.created_at);
    const daysAgo = differenceInDays(now, orderDate);
    const weight = Math.exp(-daysAgo / decayDays);
    return { ...order, weight };
  });

  // Total weighted values
  const totalWeight = weightedOrders.reduce((sum, o) => sum + o.weight, 0);
  const totalNetWeighted = weightedOrders.reduce(
    (sum, o) => sum + (o.net_profit || 0) * o.weight,
    0
  );

  // Estimate duration (LABELED AS ESTIMATE - no location tracking in Phase 1)
  // This is a crude approximation for Phase 1
  // Phase 2+ will use actual location tracking
  const estimatedDurationHours = orders.length * CONFIG.DEFAULT_ORDER_DURATION_HOURS;

  // Net Per Hour (ESTIMATE)
  const avg_nph = estimatedDurationHours > 0
    ? totalNetWeighted / totalWeight / estimatedDurationHours
    : 0;

  // Conversion Rate (orders per hour) - ESTIMATE
  const conversion_rate = estimatedDurationHours > 0
    ? orders.length / estimatedDurationHours
    : 0;

  // Volatility (coefficient of variation)
  const nphValues = weightedOrders.map(o => {
    const nph = (o.net_profit || 0) / CONFIG.DEFAULT_ORDER_DURATION_HOURS;
    return nph;
  });
  const mean_nph = nphValues.reduce((sum, v) => sum + v, 0) / Math.max(nphValues.length, 1);
  const variance = nphValues.reduce((sum, v) => sum + Math.pow(v - mean_nph, 2), 0) / Math.max(nphValues.length, 1);
  const stdDev = Math.sqrt(variance);
  const volatility = mean_nph > 0 ? stdDev / mean_nph : 0;

  // Confidence (based on sample size)
  const confidence = Math.min(1, orders.length / 10);

  // DO NOT compute avg_wait_min - we don't have actual wait time data in Phase 1
  // Removed misleading metric

  return {
    spot_id: group.spot_id,
    spot_name: group.spot_name,
    category: group.category,
    lat: group.lat,
    lon: group.lon,
    time_period: group.time_period,
    time_period_label: group.time_period_label,
    day_type: group.day_type,
    order_count: orders.length,
    avg_nph: Math.round(avg_nph), // Labeled as estimate in UI
    conversion_rate: Math.round(conversion_rate * 100) / 100, // Labeled as estimate in UI
    volatility: Math.round(volatility * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    // avg_wait_min removed - not computed in Phase 1
    last_aggregated_at: new Date().toISOString(),
    is_estimate: true, // Flag to indicate all metrics are estimates
  };
}

/**
 * Aggregate orders into H3 cells (Phase 2+)
 * Requires orders with pickup coordinates
 * @param {array} orders - Array of order objects with lat/lon
 * @param {object} options - Options {windowDays, decayDays}
 * @returns {array} Array of aggregated cell data
 */
export function aggregateOrdersToCells(orders, options = {}) {
  const { windowDays = 30, decayDays = 7 } = options;
  const now = new Date();
  const cutoffDate = subDays(now, windowDays);

  // Filter to recent orders with coordinates
  const recentOrders = orders.filter(order => {
    const orderDate = parseISO(order.created_at);
    const hasCoords = order.pickup_lat && order.pickup_lon;
    return orderDate >= cutoffDate && hasCoords;
  });

  // Group by H3 cell + time_period + day_type
  const groups = {};

  recentOrders.forEach(order => {
    const orderDate = parseISO(order.created_at);
    const timePeriod = getTimePeriod(orderDate); // Use 5 time periods, not hourly
    const dayType = getDayType(orderDate);
    const cellId = encodeLocation(order.pickup_lat, order.pickup_lon);
    const key = `${cellId}_${timePeriod}_${dayType}`;

    if (!groups[key]) {
      groups[key] = {
        cell_id: cellId,
        time_period: timePeriod, // Changed from hour_bucket to time_period
        day_type: dayType,
        orders: [],
      };
    }

    groups[key].orders.push(order);
  });

  // Compute metrics for each group
  const cells = Object.values(groups).map(group => {
    return computeCellMetrics(group, { decayDays });
  });

  return cells;
}

/**
 * Get global baseline metrics across all orders
 * @param {array} orders - Array of order objects
 * @returns {object} Baseline metrics {baselineNPH, avgDistance}
 */
export function getBaselineMetrics(orders) {
  if (orders.length === 0) {
    return {
      baselineNPH: 30000, // Default assumption
      avgDistance: 5,
    };
  }

  // Calculate average NPH (crude estimate)
  const totalNet = orders.reduce((sum, o) => sum + (o.net_profit || 0), 0);
  const estimatedHours = orders.length * 0.5; // 30 min per order
  const baselineNPH = totalNet / Math.max(estimatedHours, 1);

  // Calculate average distance
  const distances = orders.filter(o => o.distance > 0).map(o => o.distance);
  const avgDistance = distances.length > 0
    ? distances.reduce((sum, d) => sum + d, 0) / distances.length
    : 5;

  return {
    baselineNPH: Math.round(baselineNPH),
    avgDistance: Math.round(avgDistance * 10) / 10,
  };
}

/**
 * Enrich strategic spots with aggregated metrics
 * @param {array} strategicSpots - Array of strategic spot objects
 * @param {array} cells - Array of aggregated cell data
 * @returns {array} Enriched spots
 */
export function enrichSpotsWithMetrics(strategicSpots, cells) {
  return strategicSpots.map(spot => {
    // Find matching cells for this spot
    const spotCells = cells.filter(c => c.spot_id === spot.id);

    if (spotCells.length === 0) {
      return {
        ...spot,
        avg_nph: null,
        confidence: 0,
        order_count: 0,
      };
    }

    // Aggregate across all time buckets for this spot
    const totalOrders = spotCells.reduce((sum, c) => sum + c.order_count, 0);
    const avgNPH = spotCells.reduce((sum, c) => sum + c.avg_nph, 0) / spotCells.length;
    const avgConfidence = spotCells.reduce((sum, c) => sum + c.confidence, 0) / spotCells.length;

    return {
      ...spot,
      avg_nph: Math.round(avgNPH),
      confidence: Math.round(avgConfidence * 100) / 100,
      order_count: totalOrders,
      cells: spotCells, // Include time-bucketed data
    };
  });
}

export default {
  aggregateOrdersToSpots,
  aggregateOrdersToCells,
  getBaselineMetrics,
  enrichSpotsWithMetrics,
};
