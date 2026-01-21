/**
 * Component Tests
 * Basic smoke tests for UI components
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../Card';
import PrimaryButton from '../PrimaryButton';

describe('UI Components', () => {
  describe('Card', () => {
    it('should render children correctly', () => {
      render(<Card>Test Content</Card>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });

    it('should have base styling classes', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('rounded-ui-xl');
      expect(card).toHaveClass('bg-ui-surface');
    });
  });

  describe('PrimaryButton', () => {
    it('should render button with text', () => {
      render(<PrimaryButton>Click Me</PrimaryButton>);
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('should be clickable', () => {
      let clicked = false;
      render(<PrimaryButton onClick={() => { clicked = true; }}>Click</PrimaryButton>);
      
      const button = screen.getByRole('button');
      button.click();
      expect(clicked).toBe(true);
    });

    it('should handle disabled state', () => {
      render(<PrimaryButton disabled>Disabled Button</PrimaryButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should have minimum touch target height', () => {
      const { container } = render(<PrimaryButton>Button</PrimaryButton>);
      const button = container.querySelector('button');
      const style = window.getComputedStyle(button);
      expect(style.minHeight).toBe('44px');
    });
  });
});
