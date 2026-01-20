# Manual Test Checklist for Heatmap System

## Prerequisites
- [ ] Real driver order data (minimum 10 orders with timestamps)
- [ ] Strategic spots configured in database
- [ ] Development environment running (`npm run dev`)
- [ ] Browser console open (F12) for logs

## Test 1: Input Validation & Fallback
**Goal**: Verify system handles missing pickup locations correctly

### Steps:
1. [ ] Open browser console and filter for "Heatmap" logs
2. [ ] Navigate to Insight tab
3. [ ] Check console for warning: "Phase 1 limitation: NO pickup coordinates"
4. [ ] Verify aggregation uses time-based matching with strategic_spots
5. [ ] Confirm all cells have `is_estimate: true` flag

**Expected**: System falls back to time-based mapping, logs warning clearly

**Pass/Fail**: ___________

---

## Test 2: Robust Normalization
**Goal**: Verify percentile-based normalization handles outliers

### Steps:
1. [ ] Access debug view: Add `?debug=heatmap` to URL
2. [ ] Click "Show detailed breakdown" on top recommendation
3. [ ] Check normalized values (nph_norm, cr_norm, dc_norm, v_norm)
4. [ ] Verify all normalized values are between 0 and 1
5. [ ] Check if extreme outliers are clamped (p10-p90 range)

**Expected**: Normalized values in 0-1 range, outliers clamped

**Test Data**:
- NPH raw: _______ → Normalized: _______
- CR raw: _______ → Normalized: _______
- Outlier present: YES / NO

**Pass/Fail**: ___________

---

## Test 3: Multiplicative Confidence
**Goal**: Verify low-data cells get penalized appropriately

### Steps:
1. [ ] In debug view, find a cell with low sample count (<5 orders)
2. [ ] Check `confidence` value (should be <0.5)
3. [ ] Check `confidence_multiplier` (should be 0.3 to 0.65)
4. [ ] Verify `final_score` is significantly lower than `base_score`
5. [ ] Compare with high-confidence cell (>10 orders)

**Expected**: Low-confidence cells get 30-65% penalty on score

**Test Data**:
- Low confidence cell: Sample count=___, Confidence=___, Multiplier=___, Score=___
- High confidence cell: Sample count=___, Confidence=___, Multiplier=___, Score=___

**Pass/Fail**: ___________

---

## Test 4: Practical Time Periods
**Goal**: Verify 5 time periods instead of 24 hourly buckets

### Steps:
1. [ ] Check aggregated cells in debug view
2. [ ] Verify cells use `time_period` field (not `hour_bucket`)
3. [ ] Confirm only 5 periods: pagi, siang, sore, malam, tengah_malam
4. [ ] Test at different times of day:
   - 08:00 → Expected period: pagi
   - 13:00 → Expected period: siang
   - 17:00 → Expected period: sore
   - 21:00 → Expected period: malam
   - 01:00 → Expected period: tengah_malam

**Expected**: All cells aggregated by 5 practical periods

**Pass/Fail**: ___________

---

## Test 5: Honest Labeling of Estimates
**Goal**: Verify no misleading wait time claims

### Steps:
1. [ ] Check recommendation reasons in UI
2. [ ] Verify NPH labeled as "Est. net tinggi" (not "Net tinggi")
3. [ ] Confirm NO mentions of specific wait times (e.g., "wait <8min")
4. [ ] Verify sample count shown: "X orderan (basis data)"
5. [ ] Check cells have `is_estimate: true` flag

**Expected**: All estimates labeled clearly, no misleading wait time claims

**Examples**:
- Reason text: _______________________________________
- Contains "Est." or "estimasi": YES / NO
- Contains wait time claim: YES / NO

**Pass/Fail**: ___________

---

## Test 6: Score Breakdown (Debug Mode)
**Goal**: Verify score calculation transparency

### Steps:
1. [ ] Access debug view (`?debug=heatmap`)
2. [ ] Expand breakdown for top recommendation
3. [ ] Manually verify score calculation:
   ```
   base_score = 0.5*nph_norm + 0.2*cr_norm - 0.15*dc_norm - 0.1*v_norm
   final_score = base_score * confidence_multiplier * 10
   ```
4. [ ] Confirm breakdown matches formula

**Expected**: Score breakdown matches documented formula

**Manual Calculation**:
- NPH_norm=___ × 0.5 = ___
- CR_norm=___ × 0.2 = ___
- DC_norm=___ × -0.15 = ___
- V_norm=___ × -0.1 = ___
- Base = ___
- Base × Conf.Mult(___) × 10 = Final(___) ✓/✗

**Pass/Fail**: ___________

---

## Test 7: Cache Behavior
**Goal**: Verify offline-first caching works

### Steps:
1. [ ] Navigate to Insight tab (triggers aggregation)
2. [ ] Check IndexedDB: Application tab → IndexedDB → maximus_local → heatmap_cache
3. [ ] Verify cells cached with correct `time_period` and `day_type`
4. [ ] Refresh page (should use cache, check console for "Using cached heatmap cells")
5. [ ] Wait 1 hour, refresh again (should re-aggregate)

**Expected**: First load aggregates, subsequent loads use cache (1hr TTL)

**Pass/Fail**: ___________

---

## Test 8: Fallback to Strategic Spots
**Goal**: Verify graceful degradation when insufficient data

### Steps:
1. [ ] Test with <5 orders total
2. [ ] Verify system falls back to static strategic_spots
3. [ ] Check console for "Cold start" or "Fallback" message
4. [ ] Confirm UI shows generic recommendations

**Expected**: System falls back to strategic spots, no errors

**Pass/Fail**: ___________

---

## Test 9: Performance
**Goal**: Verify system performs well with real data

### Steps:
1. [ ] Open browser Performance tab
2. [ ] Navigate to Insight tab, record performance
3. [ ] Check aggregation time in console logs
4. [ ] Verify page loads in <2 seconds
5. [ ] Check memory usage (should be <10 MB overhead)

**Expected**: Aggregation <100ms for 1000 orders, page load <2s

**Measured**:
- Aggregation time: ___ ms
- Page load time: ___ s
- Memory overhead: ___ MB

**Pass/Fail**: ___________

---

## Test 10: Edge Cases
**Goal**: Verify robustness to edge cases

### Steps:
1. [ ] Test with 0 orders → Should show "no data" message
2. [ ] Test with 1-4 orders → Should fall back to strategic spots
3. [ ] Test with all orders in same time period → Should show only 1 period
4. [ ] Test with no user location → Should not generate recommendations
5. [ ] Test with extreme NPH values (e.g., negative, >1M) → Should clamp

**Expected**: System handles all edge cases gracefully, no crashes

**Pass/Fail**: ___________

---

## Summary
- Total tests: 10
- Passed: ___
- Failed: ___
- Critical issues found: _________________
- Minor issues found: _________________

## Sign-off
- Tester: _______________
- Date: _______________
- Build/Commit: _______________

---

## Notes
Use this space to document any issues, anomalies, or suggestions:

______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
