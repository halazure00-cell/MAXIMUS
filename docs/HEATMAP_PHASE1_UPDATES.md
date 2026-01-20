# Phase 1 MVP - Field Realism Updates

## Summary of Changes (2026-01-20)

This document summarizes the major improvements made to the heatmap system based on field realism and statistical robustness review.

---

## 1. Input Validation - Realistic Fallback

### Issue
Orders table has NO `pickup_lat` or `pickup_lon` fields. Original implementation incorrectly assumed H3 cell mapping would work.

### Solution
- Implemented **explicit time-based fallback** using `strategic_spots` table
- Added clear documentation that Phase 1 uses time windows (not coordinates)
- All cells marked with `is_estimate: true` flag
- Will upgrade to H3 grid in Phase 2 when coordinates are added

### Code Changes
- `heatmapAggregator.js`: Added `getPeriodsForSpot()` helper for time-based mapping
- Comments clearly state: "Phase 1 limitation: NO pickup coordinates"

---

## 2. Robust Normalization (Percentile-Based)

### Issue
Min-max normalization with fixed bounds (0-100k, 0-4, etc.) is fragile:
- Sensitive to outliers
- Assumes fixed distributions across all drivers/cities
- Breaks with extreme values

### Solution
- Implemented `normalizeRobust()` using **p10-p90 clamping**
- Data-driven bounds calculated from actual values
- Outliers automatically clamped to percentile range
- More resilient to sparse data

### Formula
```javascript
// Old (fragile)
normalize(value, 0, 100000)

// New (robust)
normalizeRobust(value, allValues)
  → Calculate p10 and p90 from allValues
  → Clamp value to [p10, p90]
  → Normalize to [0, 1]
```

### Code Changes
- `heatmapEngine.js`: New `normalizeRobust()` function
- CONFIG updated to use percentile thresholds (10th, 90th)
- Legacy `normalize()` kept for backward compatibility

---

## 3. Confidence as Multiplicative Factor

### Issue
Confidence was additive (5% weight), allowing low-data cells to score high:
```javascript
// Old (misleading)
score = 0.5*NPH + 0.2*CR - 0.15*DC - 0.1*V + 0.05*confidence
// Cell with 1 order and NPH=100k could score 8.5+
```

### Solution
Confidence now **multiplicative** (30-100% penalty):
```javascript
// New (realistic)
base_score = 0.5*NPH + 0.2*CR - 0.15*DC - 0.1*V
confidence_multiplier = 0.3 + (0.7 * confidence)
final_score = base_score * confidence_multiplier * 10
```

| Orders | Confidence | Multiplier | Effect |
|--------|-----------|------------|--------|
| 1      | 0.1       | 0.37       | 63% penalty |
| 5      | 0.5       | 0.65       | 35% penalty |
| 10     | 1.0       | 1.00       | No penalty |

### Code Changes
- `heatmapEngine.js`: `computeScore()` now returns `{score, breakdown}`
- Confidence removed from weights, applied multiplicatively
- MIN_SCORE lowered to 3.0 (was 5.0) to account for penalty

---

## 4. Practical Time Periods (Not 24 Hours)

### Issue
24 hourly buckets cause data sparsity:
- Most cells have 0-2 orders per hour
- Drivers don't think in hourly terms
- Aggregation too granular for realistic use

### Solution
Implemented **5 practical time periods**:
```javascript
TIME_PERIODS: {
  'pagi': { start: 5, end: 11, label: 'Pagi (05:00-11:00)' },
  'siang': { start: 11, end: 15, label: 'Siang (11:00-15:00)' },
  'sore': { start: 15, end: 19, label: 'Sore (15:00-19:00)' },
  'malam': { start: 19, end: 23, label: 'Malam (19:00-23:00)' },
  'tengah_malam': { start: 23, end: 5, label: 'Tengah Malam (23:00-05:00)' },
}
```

### Benefits
- Better data aggregation (4-6 hour windows)
- Aligns with driver mental models
- More robust recommendations
- Easier to understand and act on

### Code Changes
- `heatmapEngine.js`: New `getTimePeriod()` and `getTimePeriodLabel()` functions
- `heatmapAggregator.js`: Aggregation uses time periods, not hourly buckets
- `localDb.js`: Cache schema updated for `time_period`
- `Insight.jsx`: Integration updated to use time periods

---

## 5. Honest Labeling of Estimates

### Issue
Claimed specific wait times without actual computation:
- "wait <8min" → FALSE (not computed)
- "Net Rp45k/jam" → MISLEADING (estimate, not measured)

### Solution
All estimates **clearly labeled**:
```javascript
// Old (misleading)
"Net tinggi (Rp48k/jam), wait <10 menit"

// New (honest)
"Est. net tinggi (~Rp48k/jam), 12 orderan (basis data)"
```

### Removed
- `avg_wait_min` field (not computed in Phase 1)
- Any claims of specific wait times
- Unlabeled NPH/CR values

### Added
- `is_estimate: true` flag on all cells
- "Est." or "estimasi" prefix on estimated values
- Sample count shown: "X orderan (basis data)"

### Code Changes
- `heatmapAggregator.js`: Removed `avg_wait_min` computation
- `heatmapEngine.js`: `generateReason()` updated with "Est." labels
- Cell objects now include `is_estimate: true`

---

## 6. Dev QA Debug View

### New Component: `HeatmapDebugView.jsx`

**Access**: Add `?debug=heatmap` to any URL

**Features**:
- Summary stats (orders, cells, recommendations)
- Current context (time period, day type, baseline NPH)
- **Score breakdown** for each recommendation:
  - Raw values (NPH, CR, DC, V)
  - Normalized values (0-1 range)
  - Confidence multiplier
  - Base score vs. final score
  - Sample count with warnings

**Example**:
```
#1 Stasiun Hall
Final Score: 7.23
Sample Count: 12 orders ✓

[Show detailed breakdown]
  NPH (raw): Rp 45,000
  NPH (norm): 0.450
  ...
  Confidence: 0.80
  Conf. Multiplier: 0.860
  Base Score: 0.723
```

### Code Changes
- `src/components/HeatmapDebugView.jsx`: NEW component
- `src/App.jsx`: Debug mode routing
- `heatmapEngine.js`: `generateRecommendations()` supports `debugMode` option

---

## 7. Manual Test Checklist

### New Document: `HEATMAP_MANUAL_TEST_CHECKLIST.md`

**10 Comprehensive Tests**:
1. Input Validation & Fallback
2. Robust Normalization  
3. Multiplicative Confidence
4. Practical Time Periods
5. Honest Labeling of Estimates
6. Score Breakdown (Debug Mode)
7. Cache Behavior
8. Fallback to Strategic Spots
9. Performance
10. Edge Cases

**Format**:
- Step-by-step instructions
- Expected results with pass/fail checkboxes
- Space for test data recording
- Summary section with tester sign-off

---

## Summary of Improvements

| Aspect | Before | After | Impact |
|--------|--------|-------|--------|
| **Input** | Assumed H3 cells | Time-based fallback | Realistic |
| **Normalization** | Fixed bounds | p10-p90 clamping | Robust |
| **Confidence** | Additive 5% | Multiplicative 30-100% | Prevents bad recs |
| **Time Buckets** | 24 hourly | 5 practical periods | Better aggregation |
| **Labeling** | Misleading | "Est." + samples | Honest |
| **QA** | None | Debug view + checklist | Validation ready |

---

## Migration Notes

### Breaking Changes
- `hour_bucket` → `time_period` (cache keys changed)
- `avg_wait_min` removed from cell objects
- Scores now 0-10 range (was 0-10+)
- Cache must be cleared on first load after update

### Backward Compatibility
- Legacy `normalize()` function preserved
- `getHourBucket()` kept but deprecated
- Old cache entries will expire naturally (1 hour TTL)

---

## Testing Instructions

### Quick Validation
1. Add real order data (10+ orders)
2. Navigate to `/insight?debug=heatmap`
3. Check score breakdowns match formula:
   ```
   base = 0.5*NPH_norm + 0.2*CR_norm - 0.15*DC_norm - 0.1*V_norm
   final = base * (0.3 + 0.7*confidence) * 10
   ```
4. Verify all estimates labeled correctly
5. Check time periods (not hourly buckets)

### Full Testing
Follow `docs/HEATMAP_MANUAL_TEST_CHECKLIST.md`

---

## Next Steps (Phase 2)

1. **Add pickup coordinates** to orders table
2. Migrate to **H3 grid** (level 8)
3. Add **actual location tracking** (privacy-safe)
4. Compute **real wait times** (not estimates)
5. Remove `is_estimate` flag when coordinates available

---

**Document Version**: 1.0  
**Date**: 2026-01-20  
**Status**: Phase 1 MVP Complete with Field Realism Fixes
