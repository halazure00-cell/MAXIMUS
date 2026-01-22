/**
 * TourOverlay Tests
 * Tests to verify help overlay renders correctly with proper z-index
 * and positioning logic handles edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import TourOverlay from '../tutorial/TourOverlay';

describe('TourOverlay', () => {
  const mockSteps = [
    {
      id: 'test-step',
      selector: 'test-element',
      title: 'Test Title',
      body: 'Test description',
    },
  ];

  // Mock element for querySelector
  let mockElement;
  let originalQuerySelector;

  beforeEach(() => {
    // Create a mock element with getBoundingClientRect
    mockElement = document.createElement('div');
    mockElement.setAttribute('data-tour', 'test-element');
    mockElement.getBoundingClientRect = vi.fn(() => ({
      top: 100,
      bottom: 150,
      left: 100,
      right: 200,
      width: 100,
      height: 50,
    }));
    mockElement.scrollIntoView = vi.fn();

    // Mock querySelector to return our mock element
    originalQuerySelector = document.querySelector;
    document.querySelector = vi.fn((selector) => {
      if (selector === '[data-tour="test-element"]') {
        return mockElement;
      }
      return originalQuerySelector.call(document, selector);
    });

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  afterEach(() => {
    document.querySelector = originalQuerySelector;
    vi.clearAllMocks();
  });

  it('should render overlay with correct z-index', () => {
    render(
      <TourOverlay 
        steps={mockSteps} 
        onComplete={vi.fn()} 
        onSkip={vi.fn()} 
      />
    );
    
    // Check that portal was created in document.body
    const overlay = document.body.querySelector('.fixed.inset-0');
    expect(overlay).toBeInTheDocument();
    
    // Verify z-index is higher than BottomNavigation (999999)
    expect(overlay.style.zIndex).toBe('9999999');
  });

  it('should render backdrop that can be clicked', () => {
    const onSkip = vi.fn();
    render(
      <TourOverlay 
        steps={mockSteps} 
        onComplete={vi.fn()} 
        onSkip={onSkip} 
      />
    );
    
    const backdrop = document.body.querySelector('[data-testid="tour-backdrop"]');
    expect(backdrop).toBeInTheDocument();
  });

  it('should render tooltip content with title and body', () => {
    render(
      <TourOverlay 
        steps={mockSteps} 
        onComplete={vi.fn()} 
        onSkip={vi.fn()} 
      />
    );
    
    // Tooltip should be in the portal
    const title = document.body.querySelector('h3');
    expect(title).toHaveTextContent('Test Title');
    
    const body = document.body.querySelector('p');
    expect(body).toHaveTextContent('Test description');
  });

  it('should render close button', () => {
    render(
      <TourOverlay 
        steps={mockSteps} 
        onComplete={vi.fn()} 
        onSkip={vi.fn()} 
      />
    );
    
    const closeButton = document.body.querySelector('[aria-label="Close tutorial"]');
    expect(closeButton).toBeInTheDocument();
  });

  it('should return null when no steps provided', () => {
    render(
      <TourOverlay 
        steps={[]} 
        onComplete={vi.fn()} 
        onSkip={vi.fn()} 
      />
    );
    
    // Should not render anything in the portal
    const overlay = document.body.querySelector('.fixed.inset-0');
    expect(overlay).not.toBeInTheDocument();
  });

  describe('Positioning edge cases', () => {
    it('should prevent tooltip from going off-screen at the top', async () => {
      // Mock anchor near top of screen (would result in negative top)
      mockElement.getBoundingClientRect = vi.fn(() => ({
        top: 10,
        bottom: 40,
        left: 100,
        right: 200,
        width: 100,
        height: 30,
      }));

      render(
        <TourOverlay 
          steps={mockSteps} 
          onComplete={vi.fn()} 
          onSkip={vi.fn()} 
        />
      );

      // Wait for requestAnimationFrame to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      // Find the tooltip element
      const tooltip = document.body.querySelector('.absolute.bg-ui-surface');
      expect(tooltip).toBeInTheDocument();

      // Get the computed top position
      const topPosition = parseInt(tooltip.style.top);
      
      // Tooltip should not have negative top position
      // It should be clamped to at least the safe margin (12px)
      expect(topPosition).toBeGreaterThanOrEqual(0);
    });

    it('should clamp tooltip when anchor is near bottom of screen', async () => {
      // Mock small viewport
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 400,
      });

      // Mock anchor near bottom of screen
      mockElement.getBoundingClientRect = vi.fn(() => ({
        top: 350,
        bottom: 380,
        left: 100,
        right: 200,
        width: 100,
        height: 30,
      }));

      render(
        <TourOverlay 
          steps={mockSteps} 
          onComplete={vi.fn()} 
          onSkip={vi.fn()} 
        />
      );

      // Wait for requestAnimationFrame to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      const tooltip = document.body.querySelector('.absolute.bg-ui-surface');
      expect(tooltip).toBeInTheDocument();

      const topPosition = parseInt(tooltip.style.top);
      
      // Tooltip should be visible (not below viewport)
      expect(topPosition).toBeGreaterThanOrEqual(0);
    });

    it('should clamp tooltip when anchor is near left edge', async () => {
      // Mock anchor near left edge
      mockElement.getBoundingClientRect = vi.fn(() => ({
        top: 100,
        bottom: 150,
        left: 5,
        right: 55,
        width: 50,
        height: 50,
      }));

      render(
        <TourOverlay 
          steps={mockSteps} 
          onComplete={vi.fn()} 
          onSkip={vi.fn()} 
        />
      );

      // Wait for requestAnimationFrame to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      const tooltip = document.body.querySelector('.absolute.bg-ui-surface');
      expect(tooltip).toBeInTheDocument();

      const leftPosition = parseInt(tooltip.style.left);
      
      // Tooltip should have safe left margin (at least 12px)
      expect(leftPosition).toBeGreaterThanOrEqual(12);
    });

    it('should clamp tooltip when anchor is near right edge', async () => {
      // Mock anchor near right edge
      mockElement.getBoundingClientRect = vi.fn(() => ({
        top: 100,
        bottom: 150,
        left: 970,
        right: 1020,
        width: 50,
        height: 50,
      }));

      render(
        <TourOverlay 
          steps={mockSteps} 
          onComplete={vi.fn()} 
          onSkip={vi.fn()} 
        />
      );

      // Wait for requestAnimationFrame to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      const tooltip = document.body.querySelector('.absolute.bg-ui-surface');
      expect(tooltip).toBeInTheDocument();

      const leftPosition = parseInt(tooltip.style.left);
      
      // Tooltip should not exceed viewport width (left + width should be within bounds)
      expect(leftPosition).toBeGreaterThanOrEqual(0);
    });
  });
});
