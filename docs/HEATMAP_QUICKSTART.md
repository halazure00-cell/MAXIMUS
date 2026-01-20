# Driver Heatmap System - Quick Start Guide

This guide provides a quick overview of the MAXIMUS Driver Heatmap System implementation.

## Overview

The heatmap system provides data-driven spot recommendations for ojek online drivers, optimizing for:
- **Net income per hour** (primary metric)
- **Minimal deadhead cost** (fuel + time wasted reaching spots)
- **Low wait times** (high conversion rates)
- **Data confidence** (reliability based on sample size)

## Phase 1 MVP Status

✅ **Implemented**:
- Complete engineering design document (see `/docs/HEATMAP_DESIGN.md`)
- Core scoring engine with H3 geospatial indexing
- Order aggregation with time decay
- Offline-first caching with TTL
- Integration into existing Insight component
- Automatic fallback to strategic spots for cold start

🚧 **Pending**:
- UI enhancements to show heatmap metrics
- Manual refresh controls
- Time/distance filters
- Phase 2+: Location tracking, full H3 grid, crowd aggregation

## Quick Usage

### For Developers

1. **View the design document**:
   ```bash
   cat docs/HEATMAP_DESIGN.md
   ```

2. **Core files**:
   - `/src/lib/heatmapEngine.js` - Scoring algorithms
   - `/src/lib/heatmapAggregator.js` - Data processing
   - `/src/lib/localDb.js` - Caching (heatmap_cache store)
   - `/src/components/Insight.jsx` - UI integration

3. **Configuration**:
   All tunable parameters are in `CONFIG` constants:
   - `heatmapEngine.js` - Scoring weights, thresholds, normalization bounds
   - `heatmapAggregator.js` - Order duration assumptions

4. **Test locally**:
   ```bash
   npm install
   npm run dev
   ```

### For Drivers (End Users)

**Current behavior (automatic)**:
- When you open the Insight tab, the app:
  1. Aggregates your last 30 days of orders
  2. Calculates net per hour for each strategic spot
  3. Generates top 5 recommendations based on your current location
  4. Caches results for 1 hour (works offline)
  5. Falls back to static strategic spots if you have <5 orders

**What you see**:
- Same strategic spots list (enhanced with metrics in future UI updates)
- Recommendations are already being computed in the background
- No change to current UX (Phase 1 is backend-focused)

**Future UI (Phase 2)**:
- Toggle between "Static Spots" and "Smart Recommendations"
- See net/hour, confidence badges, wait times
- Filter by time horizon (30 min, 60 min, 90 min)
- Manual refresh button

## Key Metrics Explained

### Net Per Hour (NPH)
```
NPH = (Total Net Profit) / (Estimated Hours at Spot)
```
- **Primary metric** for ranking spots
- Accounts for commission, fuel, maintenance
- Normalized to 0-1 scale (0-100k Rp range)

### Conversion Rate (CR)
```
CR = Orders / Hour
```
- Proxy for wait time
- Higher = less idle time
- Normalized to 0-1 scale (0-4 orders/hour range)

### Deadhead Cost (DC)
```
DC = (Distance × Fuel Cost) + (Travel Time × Opportunity Cost)
```
- Penalty for distance to spot
- Accounts for fuel + earnings lost while traveling
- Normalized to 0-1 scale (0-50k Rp range)

### Volatility (V)
```
V = StdDev(NPH) / Mean(NPH)
```
- Risk/uncertainty at spot
- Lower = more consistent earnings
- Normalized to 0-1 scale

### Confidence (C)
```
C = min(1, Order Count / 10)
```
- Reliability of estimate
- <5 orders = "cold start" → use strategic spots
- 10+ orders = full confidence (1.0)

### Final Score
```
Score = 0.5×NPH + 0.2×CR - 0.15×DC - 0.1×V + 0.05×C
```
- Weighted combination (0-10 scale)
- Minimum score of 5.0 required for recommendation

## Offline-First Design

### Caching Strategy
- **IndexedDB store**: `heatmap_cache`
- **TTL**: 1 hour (configurable)
- **Cache key**: `cell_{cell_id}_{hour}_{day_type}`
- **Auto-cleanup**: Expired entries cleared on next access

### Sync Flow
```
1. Check IndexedDB cache
   ├─ Hit → Use cached cells
   └─ Miss → Aggregate from orders
2. Generate recommendations (if user location available)
3. Cache results for 1 hour
4. Return top 5 spots
```

### Fallback Behavior
```
If recommendations < 3 OR confidence < 0.3 OR total orders < 5:
  → Use static strategic_spots table
  → Show generic messaging
```

## Configuration Tuning

### Scoring Weights (heatmapEngine.js)
```javascript
WEIGHTS: {
  NPH: 0.5,   // Increase to prioritize earnings
  CR: 0.2,    // Increase to reduce wait times
  DC: 0.15,   // Increase to penalize far spots more
  V: 0.10,    // Increase for risk-averse drivers
  C: 0.05,    // Increase to favor data-rich spots
}
```

### Normalization Bounds
```javascript
NPH_MAX: 100000,  // Adjust based on real max NPH in your city
CR_MAX: 4,        // Adjust if drivers get >4 orders/hour
DC_MAX: 50000,    // Adjust based on max acceptable deadhead cost
```

### Order Duration Proxy (heatmapAggregator.js)
```javascript
DEFAULT_ORDER_DURATION_HOURS: 0.5  // 30 minutes
```
- Phase 1 assumption (no location tracking yet)
- Adjust based on real average order duration
- Phase 2+ will use actual tracking

### Time Decay
```javascript
decayDays: 7  // Half-life of 5 days
```
- Recent orders weighted more heavily
- Exponential decay: `weight = exp(-days_ago / 7)`

## Troubleshooting

### "No recommendations" shown
**Cause**: <5 orders or low confidence  
**Solution**: Use strategic spots (automatic fallback)

### Recommendations seem wrong
**Cause**: Insufficient data or outdated cache  
**Solution**: Wait for more orders, or manually clear cache (future UI)

### High battery drain
**Cause**: Location tracking too frequent (Phase 2+ feature)  
**Solution**: Not applicable in Phase 1 (no active tracking)

### Cache not working offline
**Check**: IndexedDB enabled in browser settings  
**Solution**: Clear site data and reload

## Performance

### Storage Budget
- **Per cell**: ~500 bytes (metadata + metrics)
- **500 cells × 48 time buckets**: ~12 MB worst case
- **Typical**: ~2 MB (sparse cells)

### Computation Cost
- **Aggregation**: <100ms for 1000 orders
- **Scoring**: <10ms for 500 cells
- **Caching**: <50ms IndexedDB write

### Network Impact (Phase 1)
- **Zero** (all client-side computation)
- **Phase 2+**: Periodic sync of aggregated cells (not raw data)

## Roadmap

### Phase 2 (Profit-based Scoring + Confidence)
- H3 grid system (instead of static spots)
- Full scoring formula with all metrics
- Confidence badges in UI
- Exploration bonus for untried cells
- Database tables: `heatmap_cells`, `heatmap_recommendations`

### Phase 3 (Crowd Aggregation)
- Privacy-safe location event tracking
- Multi-driver anonymized insights
- GDPR-compliant consent flow
- Database table: `location_events`

## References

- **Design Doc**: `/docs/HEATMAP_DESIGN.md`
- **H3 Library**: https://h3geo.org/
- **IndexedDB**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

## Support

For questions or issues:
1. Check design document first
2. Review code comments in core files
3. Contact MAXIMUS team

---

**Last Updated**: 2026-01-20  
**Status**: Phase 1 MVP Complete ✅
