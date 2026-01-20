/**
 * Heatmap Aggregator - Data Processing for Driver Insights
 * 
 * This module aggregates order data into heatmap cells for analysis.
 * Implements the aggregation strategy from HEATMAP_DESIGN.md.
 * 
 * Phase 1 (MVP): Simple aggregation from orders without location tracking
 * Phase 2+: Full H3 grid with location events
 */

import { encodeLocation, getHourBucket, getDayType } from './heatmapEngine';
import { parseISO, differenceInDays, subDays } from 'date-fns';

/**
 * Aggregate orders into cells by hour/day for a specific spot
 * Phase 1: Uses strategic_spots mapping
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

  // Group by spot + hour + day_type
  const groups = {};

  strategicSpots.forEach(spot => {
    const spotOrders = recentOrders.filter(order => {
      // For Phase 1, we don't have exact pickup locations
      // Use time-based matching with strategic spots
      const orderDate = parseISO(order.created_at);
      const orderHour = getHourBucket(orderDate);
      const orderDayType = getDayType(orderDate);

      // Check if order falls within spot's time window
      const hourInRange = orderHour >= spot.start_hour && orderHour < spot.end_hour;
      const dayMatch = spot.is_weekend_only ? orderDayType === 'weekend' : true;

      return hourInRange && dayMatch;
    });

    // Create cells for each hour in the spot's range
    for (let hour = spot.start_hour; hour < spot.end_hour; hour++) {
      const dayTypes = spot.is_weekend_only ? ['weekend'] : ['weekday', 'weekend'];

      dayTypes.forEach(dayType => {
        const key = `${spot.id}_${hour}_${dayType}`;
        
        // Filter orders for this specific hour/day combination
        const cellOrders = spotOrders.filter(order => {
          const orderDate = parseISO(order.created_at);
          const orderHour = getHourBucket(orderDate);
          const orderDayType = getDayType(orderDate);
          return orderHour === hour && orderDayType === dayType;
        });

        if (cellOrders.length > 0) {
          groups[key] = {
            spot_id: spot.id,
            spot_name: spot.name,
            category: spot.category,
            lat: spot.latitude,
            lon: spot.longitude,
            hour_bucket: hour,
            day_type: dayType,
            orders: cellOrders,
          };
        }
      });
    }
  });

  // Compute metrics for each group
  const cells = Object.values(groups).map(group => {
    return computeCellMetrics(group, { decayDays });
  });

  return cells;
}

/**
 * Compute aggregated metrics for a cell
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

  // Estimate duration (proxy: assume 30 min per order)
  // This is a crude approximation for Phase 1
  // Phase 2+ will use actual location tracking
  const estimatedDurationHours = orders.length * 0.5; // 30 min per order

  // Net Per Hour
  const avg_nph = estimatedDurationHours > 0
    ? totalNetWeighted / totalWeight / estimatedDurationHours
    : 0;

  // Conversion Rate (orders per hour)
  const conversion_rate = estimatedDurationHours > 0
    ? orders.length / estimatedDurationHours
    : 0;

  // Volatility (coefficient of variation)
  const nphValues = weightedOrders.map(o => {
    const nph = (o.net_profit || 0) / 0.5; // Assume 30 min per order
    return nph;
  });
  const mean_nph = nphValues.reduce((sum, v) => sum + v, 0) / Math.max(nphValues.length, 1);
  const variance = nphValues.reduce((sum, v) => sum + Math.pow(v - mean_nph, 2), 0) / Math.max(nphValues.length, 1);
  const stdDev = Math.sqrt(variance);
  const volatility = mean_nph > 0 ? stdDev / mean_nph : 0;

  // Confidence (based on sample size)
  const confidence = Math.min(1, orders.length / 10);

  // Average wait time (proxy)
  const avg_wait_min = conversion_rate > 0 ? 60 / conversion_rate : 60;

  return {
    spot_id: group.spot_id,
    spot_name: group.spot_name,
    category: group.category,
    lat: group.lat,
    lon: group.lon,
    hour_bucket: group.hour_bucket,
    day_type: group.day_type,
    order_count: orders.length,
    avg_nph: Math.round(avg_nph),
    conversion_rate: Math.round(conversion_rate * 100) / 100,
    volatility: Math.round(volatility * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    avg_wait_min: Math.round(avg_wait_min),
    last_aggregated_at: new Date().toISOString(),
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

  // Group by H3 cell + hour + day_type
  const groups = {};

  recentOrders.forEach(order => {
    const orderDate = parseISO(order.created_at);
    const hour = getHourBucket(orderDate);
    const dayType = getDayType(orderDate);
    const cellId = encodeLocation(order.pickup_lat, order.pickup_lon);
    const key = `${cellId}_${hour}_${dayType}`;

    if (!groups[key]) {
      groups[key] = {
        cell_id: cellId,
        hour_bucket: hour,
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
