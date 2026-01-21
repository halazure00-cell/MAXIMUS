# Tutorial System - QA Checklist

## Overview
This document provides a comprehensive QA checklist for the MAXIMUS tutorial system implementation.

## Architecture Summary

### Layer 1: Tutorial State Management
- **TutorialContext** (`/src/context/TutorialContext.jsx`)
  - Stores tutorial version, onboarding completion, completed tours, dismissed tips
  - Persists state to localStorage (`maximus_tutorial_state`)
  - Provides methods: `completeOnboarding`, `completePageTour`, `dismissTip`, `resetTutorials`

### Layer 2: Core Tour Engine
- **TourOverlay** (`/src/components/tutorial/TourOverlay.jsx`)
  - Lightweight custom tour component
  - Features: step navigation, element highlighting, scroll-into-view, ESC key support
  - Handles missing selectors gracefully (skips silently)
  - Adapts to dark/light mode automatically

### Layer 3: Components
- **OnboardingSlides** (`/src/components/tutorial/OnboardingSlides.jsx`) - First-time onboarding
- **Microtip** (`/src/components/tutorial/Microtip.jsx`) - Contextual one-time tooltips
- **HelpButton** (`/src/components/tutorial/HelpButton.jsx`) - Tour trigger button
- **Tour Configs** (`/src/components/tutorial/tourConfigs.js`) - Page-specific tour steps

---

## QA Test Cases

### 1. First-Time Onboarding

#### Test: Onboarding appears once
- [ ] **Setup**: Clear localStorage or use incognito mode
- [ ] **Action**: Sign in to the app
- [ ] **Expected**: Onboarding slides appear after successful login
- [ ] **Verify**: 5 slides are shown with progress dots
- [ ] **Status**: ⏳ Pending

#### Test: Skip works
- [ ] **Setup**: Trigger onboarding
- [ ] **Action**: Click "Lewati" button
- [ ] **Expected**: Onboarding closes immediately
- [ ] **Verify**: Tutorial state marks onboarding as completed
- [ ] **Status**: ⏳ Pending

#### Test: Complete works
- [ ] **Setup**: Trigger onboarding
- [ ] **Action**: Navigate through all slides and click "Mulai" on last slide
- [ ] **Expected**: Onboarding closes after completion
- [ ] **Verify**: Tutorial state marks onboarding as completed
- [ ] **Status**: ⏳ Pending

#### Test: Onboarding doesn't repeat
- [ ] **Setup**: Complete onboarding once
- [ ] **Action**: Sign out and sign in again
- [ ] **Expected**: Onboarding does NOT appear
- [ ] **Verify**: localStorage shows `onboardingCompleted: true`
- [ ] **Status**: ⏳ Pending

---

### 2. Page Tours

#### Test: Home page tour trigger
- [ ] **Setup**: Navigate to Home page
- [ ] **Action**: Click help button (?) in top-right
- [ ] **Expected**: Tour starts with step 1 of 6
- [ ] **Verify**: Target elements are highlighted correctly
- [ ] **Status**: ⏳ Pending

#### Test: Tour navigation controls
- [ ] **Setup**: Start Home page tour
- [ ] **Action**: Click "Lanjut" to go through all steps
- [ ] **Expected**: Each step highlights the correct element
- [ ] **Action**: Click "Kembali" to go back
- [ ] **Expected**: Previous step is shown
- [ ] **Status**: ⏳ Pending

#### Test: Tour skip functionality
- [ ] **Setup**: Start any page tour
- [ ] **Action**: Click "Lewati" or press ESC key
- [ ] **Expected**: Tour closes immediately
- [ ] **Verify**: Page tour is marked as completed in state
- [ ] **Status**: ⏳ Pending

#### Test: Profile page tour with reset
- [ ] **Setup**: Navigate to Profile page
- [ ] **Action**: Click help button (?)
- [ ] **Expected**: Tour starts and shows profile-specific steps
- [ ] **Status**: ⏳ Pending

---

### 3. Missing Selector Handling

#### Test: Tour handles missing elements gracefully
- [ ] **Setup**: Modify DOM to hide a tour target element
- [ ] **Action**: Start tour that references missing element
- [ ] **Expected**: Tour skips missing element silently (no crash)
- [ ] **Verify**: Console shows no errors
- [ ] **Status**: ⏳ Pending

---

### 4. Microtips

#### Test: Microtip shows once
- [ ] **Setup**: Clear tutorial state
- [ ] **Action**: Navigate to a page with microtip
- [ ] **Expected**: Microtip appears with dismiss button
- [ ] **Action**: Dismiss the tip
- [ ] **Expected**: Tip never shows again
- [ ] **Status**: ⏳ Pending (not yet implemented)

---

### 5. Reset Tutorial

#### Test: Reset works correctly
- [ ] **Setup**: Complete onboarding and some page tours
- [ ] **Action**: Navigate to Profile, click "Reset Tutorial"
- [ ] **Expected**: Success toast appears
- [ ] **Action**: Sign out and sign in
- [ ] **Expected**: Onboarding appears again
- [ ] **Verify**: All tutorial state is cleared
- [ ] **Status**: ⏳ Pending

---

### 6. Offline Mode

#### Test: Tutorials work offline
- [ ] **Setup**: Open app while online
- [ ] **Action**: Enable airplane mode or disconnect network
- [ ] **Action**: Start a page tour
- [ ] **Expected**: Tour works normally without network
- [ ] **Status**: ⏳ Pending

#### Test: Tutorial state persists offline
- [ ] **Setup**: Complete a tour offline
- [ ] **Action**: Close app and reopen while offline
- [ ] **Expected**: Tour is marked as completed (from localStorage)
- [ ] **Status**: ⏳ Pending

---

### 7. Dark/Light Mode Compatibility

#### Test: Tours adapt to dark mode
- [ ] **Setup**: Enable dark mode in Profile settings
- [ ] **Action**: Start any page tour
- [ ] **Expected**: Tour overlay and tooltips use dark mode colors
- [ ] **Verify**: All text is readable in dark mode
- [ ] **Status**: ⏳ Pending

#### Test: Tours adapt to light mode
- [ ] **Setup**: Disable dark mode
- [ ] **Action**: Start any page tour
- [ ] **Expected**: Tour uses light mode colors
- [ ] **Status**: ⏳ Pending

---

### 8. Build & Performance

#### Test: Build passes
- [ ] **Action**: Run `npm run build`
- [ ] **Expected**: Build completes without errors
- [ ] **Verify**: Tutorial components are code-split
- [ ] **Status**: ✅ Passed (OnboardingSlides: 2.89 kB, TourOverlay: 3.48 kB)

#### Test: Bundle size impact
- [ ] **Setup**: Check bundle size before/after tutorial implementation
- [ ] **Expected**: Main bundle increase is minimal (<10 kB)
- [ ] **Verify**: Tutorial components are lazy-loaded
- [ ] **Status**: ✅ Passed (Lazy loading confirmed)

#### Test: No performance regression
- [ ] **Setup**: Test app loading and navigation speed
- [ ] **Expected**: No noticeable slowdown
- [ ] **Verify**: Lighthouse performance score unchanged
- [ ] **Status**: ⏳ Pending

---

### 9. Business Logic Isolation

#### Test: Tours don't interfere with order creation
- [ ] **Setup**: Start Home page tour
- [ ] **Action**: Fill in order details and submit while tour is active
- [ ] **Expected**: Order is saved successfully
- [ ] **Verify**: Tour doesn't block user actions
- [ ] **Status**: ⏳ Pending

#### Test: Tours don't affect calculations
- [ ] **Setup**: Complete any tour
- [ ] **Action**: Verify profit calculations and heatmap data
- [ ] **Expected**: All calculations remain accurate
- [ ] **Status**: ⏳ Pending

---

## Browser Compatibility

### Desktop
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

### Mobile
- [ ] Chrome Android (latest)
- [ ] Safari iOS (latest)
- [ ] Low-end Android devices (primary target)

---

## Accessibility

- [ ] ESC key closes tours
- [ ] All interactive elements have min-height of 44px
- [ ] Tooltip text is readable at all zoom levels
- [ ] Focus management works correctly

---

## Known Issues / Notes

_Document any known issues or edge cases discovered during testing._

---

## Sign-Off

### Development
- [ ] All code changes committed
- [ ] Linter passes (warnings acceptable)
- [ ] Build succeeds

### Testing
- [ ] All critical test cases passed
- [ ] No regressions in existing features
- [ ] Offline mode verified

### Deployment
- [ ] Ready for production deployment

**Date**: _______________________  
**Tester**: _______________________  
**Status**: ⏳ In Progress
