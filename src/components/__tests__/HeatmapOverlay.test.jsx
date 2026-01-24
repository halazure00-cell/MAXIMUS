/**
 * HeatmapOverlay Component Tests
 * Tests for the HeatmapOverlay component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HeatmapOverlay from '../HeatmapOverlay';

// Mock the react-leaflet components
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Polygon: () => <div data-testid="polygon" />,
  CircleMarker: () => <div data-testid="circle-marker" />,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({ 
    setView: vi.fn(),
    getZoom: vi.fn(() => 13),
  }),
}));

describe('HeatmapOverlay', () => {
  const mockCells = [
    {
      h3Index: '891f1d4a9ffffff',
      intensity: 50,
      stats: { orderCount: 10, nph: 5.5, conversionRate: 80 },
      center: { lat: -6.9175, lng: 107.6191 }
    },
    {
      h3Index: '891f1d4b1ffffff',
      intensity: 75,
      stats: { orderCount: 15, nph: 7.0, conversionRate: 85 },
      center: { lat: -6.9180, lng: 107.6195 }
    }
  ];

  const mockUserLocation = { lat: -6.9175, lng: 107.6191 };

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <HeatmapOverlay isOpen={false} onClose={vi.fn()} cells={mockCells} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render header with title when isOpen is true', () => {
    render(
      <HeatmapOverlay 
        isOpen={true} 
        onClose={vi.fn()} 
        cells={mockCells}
        userLocation={mockUserLocation}
      />
    );
    expect(screen.getByText('Heatmap Live')).toBeInTheDocument();
  });

  it('should show cell count in header', () => {
    render(
      <HeatmapOverlay 
        isOpen={true} 
        onClose={vi.fn()} 
        cells={mockCells}
      />
    );
    expect(screen.getByText('2 zona terdeteksi')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <HeatmapOverlay 
        isOpen={true} 
        onClose={vi.fn()} 
        cells={[]}
        isLoading={true}
      />
    );
    expect(screen.getByText('Memuat data heatmap...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    const errorMessage = 'Failed to load data';
    render(
      <HeatmapOverlay 
        isOpen={true} 
        onClose={vi.fn()} 
        cells={[]}
        error={errorMessage}
      />
    );
    expect(screen.getByText('Gagal Memuat Data')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should show empty state when no cells', () => {
    render(
      <HeatmapOverlay 
        isOpen={true} 
        onClose={vi.fn()} 
        cells={[]}
      />
    );
    expect(screen.getByText('Tidak Ada Data')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    render(
      <HeatmapOverlay 
        isOpen={true} 
        onClose={mockOnClose} 
        cells={mockCells}
      />
    );
    
    const closeButton = screen.getByLabelText('Close');
    closeButton.click();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should show Top Spot button when cells are available', () => {
    render(
      <HeatmapOverlay 
        isOpen={true} 
        onClose={vi.fn()} 
        cells={mockCells}
      />
    );
    expect(screen.getByText('Top Spot')).toBeInTheDocument();
  });
});
