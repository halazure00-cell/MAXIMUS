/**
 * TourOverlay Tests
 * Tests to verify help overlay renders correctly with proper z-index
 */

import { describe, it, expect, vi } from 'vitest';
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

  it('should render overlay with correct z-index', () => {
    const { container } = render(
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
    const { container } = render(
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
});
