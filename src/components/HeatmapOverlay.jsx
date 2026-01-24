/**
 * HeatmapOverlay Component
 * Fullscreen map overlay showing H3 hexagon heatmap with user location
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup, useMap } from 'react-leaflet';
import { cellToBoundary } from 'h3-js';
import { 
    X, 
    RefreshCw, 
    Navigation, 
    Flame,
    Loader2,
    AlertTriangle,
    Inbox
} from 'lucide-react';
import { createLogger } from '../lib/logger';
import 'leaflet/dist/leaflet.css';

const logger = createLogger('HeatmapOverlay');

// Color palette for heatmap intensity
const HEATMAP_COLORS = {
    cold: '#3B82F6',    // Blue - low intensity
    cool: '#22D3EE',    // Cyan
    warm: '#FACC15',    // Yellow
    hot: '#F97316',     // Orange
    fire: '#EF4444',    // Red - high intensity
};

// Map configuration
const DEFAULT_CENTER = [-6.9175, 107.6191]; // Bandung
const DEFAULT_ZOOM = 13;

/**
 * Get color based on intensity value
 * @param {number} intensity
 * @param {number} maxIntensity
 * @returns {string}
 */
function getIntensityColor(intensity, maxIntensity) {
    const ratio = maxIntensity > 0 ? intensity / maxIntensity : 0;
    
    if (ratio <= 0.2) return HEATMAP_COLORS.cold;
    if (ratio <= 0.4) return HEATMAP_COLORS.cool;
    if (ratio <= 0.6) return HEATMAP_COLORS.warm;
    if (ratio <= 0.8) return HEATMAP_COLORS.hot;
    return HEATMAP_COLORS.fire;
}

/**
 * Get opacity based on intensity
 * @param {number} intensity
 * @param {number} maxIntensity
 * @returns {number}
 */
function getIntensityOpacity(intensity, maxIntensity) {
    const ratio = maxIntensity > 0 ? intensity / maxIntensity : 0;
    return 0.3 + (ratio * 0.5); // Range: 0.3 to 0.8
}

/**
 * Component to recenter map when center prop changes
 */
function MapRecenter({ center }) {
    const map = useMap();
    
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    
    return null;
}

/**
 * HexagonLayer - Renders H3 hexagons on map
 */
function HexagonLayer({ cells, maxIntensity, onCellClick }) {
    if (!cells || cells.length === 0) return null;

    return (
        <>
            {cells.map((cell) => {
                const { h3Index, intensity, stats = {} } = cell;
                
                try {
                    // Convert H3 index to boundary coordinates
                    const boundary = cellToBoundary(h3Index, true); // [lat, lng] format
                    const color = getIntensityColor(intensity, maxIntensity);
                    const opacity = getIntensityOpacity(intensity, maxIntensity);

                    return (
                        <Polygon
                            key={h3Index}
                            positions={boundary}
                            pathOptions={{
                                fillColor: color,
                                fillOpacity: opacity,
                                color: color,
                                weight: 1,
                                opacity: 0.8,
                            }}
                            className="heatmap-cell"
                            eventHandlers={{
                                click: () => onCellClick(cell),
                            }}
                        >
                            <Popup>
                                <div className="text-xs">
                                    <p className="font-semibold">Zona {h3Index.slice(-6)}</p>
                                    <p className="text-ui-muted">Intensitas: {intensity}</p>
                                    {stats.orderCount > 0 && (
                                        <p className="text-ui-muted">Order: {stats.orderCount}</p>
                                    )}
                                </div>
                            </Popup>
                        </Polygon>
                    );
                } catch (error) {
                    logger.error('Failed to render hexagon', { h3Index, error });
                    return null;
                }
            })}
        </>
    );
}

/**
 * UserLocationMarker - Shows user location with pulse animation
 */
function UserLocationMarker({ position }) {
    if (!position) return null;

    return (
        <>
            {/* Pulse ring */}
            <CircleMarker
                center={position}
                radius={20}
                pathOptions={{
                    fillColor: '#3B82F6',
                    fillOpacity: 0,
                    color: '#3B82F6',
                    weight: 2,
                    opacity: 1,
                }}
                className="user-location-pulse"
            />
            {/* Main marker */}
            <CircleMarker
                center={position}
                radius={8}
                pathOptions={{
                    fillColor: '#3B82F6',
                    fillOpacity: 1,
                    color: '#FFFFFF',
                    weight: 2,
                    opacity: 1,
                }}
            >
                <Popup>
                    <div className="text-xs">
                        <p className="font-semibold">Lokasi Anda</p>
                    </div>
                </Popup>
            </CircleMarker>
        </>
    );
}

/**
 * BottomSheet - Slides up when hexagon is clicked
 */
function BottomSheet({ cell, onClose, onNavigate }) {
    if (!cell) return null;

    const { h3Index, intensity, stats = {}, center } = cell;
    const zoneId = h3Index.slice(-6);

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-ui-surface dark:bg-ui-surface border-t border-ui-border rounded-t-2xl shadow-lg z-[1000] max-h-[60vh] overflow-y-auto"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
        >
            <div className="p-4">
                {/* Handle bar */}
                <div className="w-12 h-1 bg-ui-muted/30 rounded-full mx-auto mb-4" />

                {/* Zone info */}
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-ui-text mb-1">
                        Zona {zoneId}
                    </h3>
                    <div className="flex items-center gap-2">
                        <Flame className="text-ui-danger" size={16} />
                        <span className="text-sm text-ui-muted">
                            Intensitas: <span className="font-semibold text-ui-text">{intensity}</span>
                        </span>
                    </div>
                </div>

                {/* Stats grid */}
                {(stats.orderCount > 0 || stats.nph > 0 || stats.conversionRate > 0) && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {stats.orderCount > 0 && (
                            <div className="text-center p-3 bg-ui-surface-muted rounded-ui-lg">
                                <p className="text-xs text-ui-muted">Order</p>
                                <p className="text-lg font-bold text-ui-text">{stats.orderCount}</p>
                            </div>
                        )}
                        {stats.nph > 0 && (
                            <div className="text-center p-3 bg-ui-surface-muted rounded-ui-lg">
                                <p className="text-xs text-ui-muted">NPH</p>
                                <p className="text-lg font-bold text-ui-text">{stats.nph.toFixed(1)}</p>
                            </div>
                        )}
                        {stats.conversionRate > 0 && (
                            <div className="text-center p-3 bg-ui-surface-muted rounded-ui-lg">
                                <p className="text-xs text-ui-muted">Conv Rate</p>
                                <p className="text-lg font-bold text-ui-text">{stats.conversionRate.toFixed(0)}%</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-ui-surface-muted text-ui-text rounded-ui-lg font-medium press-effect"
                    >
                        Tutup
                    </button>
                    <button
                        onClick={() => onNavigate(center)}
                        className="flex-1 py-3 px-4 bg-ui-primary text-ui-background rounded-ui-lg font-medium press-effect flex items-center justify-center gap-2"
                    >
                        <Navigation size={16} />
                        Navigasi ke Zona Ini
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

/**
 * Main HeatmapOverlay Component
 */
export default function HeatmapOverlay({ 
    isOpen, 
    onClose, 
    cells = [], 
    userLocation = null,
    isLoading = false,
    error = null,
    onRefresh = null,
}) {
    const [selectedCell, setSelectedCell] = useState(null);
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const mapRef = useRef(null);

    // Calculate max intensity for color scaling
    const maxIntensity = useMemo(() => {
        if (!cells || cells.length === 0) return 100;
        return Math.max(...cells.map(c => c.intensity || 0));
    }, [cells]);

    // Update map center based on user location or cells
    useEffect(() => {
        if (userLocation) {
            setMapCenter([userLocation.lat, userLocation.lng]);
        } else if (cells && cells.length > 0 && cells[0].center) {
            setMapCenter([cells[0].center.lat, cells[0].center.lng]);
        }
    }, [userLocation, cells]);

    // Handle cell click
    const handleCellClick = (cell) => {
        setSelectedCell(cell);
        logger.debug('Cell clicked', { h3Index: cell.h3Index, intensity: cell.intensity });
    };

    // Navigate to zone
    const handleNavigate = (center) => {
        if (center && center.lat && center.lng) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`;
            window.open(url, '_blank');
        }
        setSelectedCell(null);
    };

    // Jump to top spot
    const jumpToTopSpot = () => {
        if (cells && cells.length > 0) {
            const topCell = cells.reduce((max, cell) => 
                (cell.intensity > max.intensity) ? cell : max
            , cells[0]);
            
            setSelectedCell(topCell);
            if (topCell.center) {
                setMapCenter([topCell.center.lat, topCell.center.lng]);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ui-background dark:bg-ui-inverse z-[9999]"
        >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-ui-surface/95 dark:bg-ui-surface/95 backdrop-blur-sm border-b border-ui-border z-[1001] shadow-sm"
                style={{ paddingTop: 'env(safe-area-inset-top, 16px)' }}>
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-ui-surface-muted rounded-ui-lg press-effect"
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                    <div className="flex-1 text-center">
                        <h2 className="text-lg font-bold text-ui-text">Heatmap Live</h2>
                        <p className="text-xs text-ui-muted">{cells?.length || 0} zona terdeteksi</p>
                    </div>
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="p-2 hover:bg-ui-surface-muted rounded-ui-lg press-effect disabled:opacity-50"
                        aria-label="Refresh"
                    >
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Legend */}
                <div className="px-4 pb-3">
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-ui-muted">Intensitas:</span>
                        <div className="flex-1 flex items-center gap-1">
                            <div className="flex-1 h-2 rounded-full" 
                                style={{ 
                                    background: `linear-gradient(to right, ${HEATMAP_COLORS.cold}, ${HEATMAP_COLORS.cool}, ${HEATMAP_COLORS.warm}, ${HEATMAP_COLORS.hot}, ${HEATMAP_COLORS.fire})`
                                }} 
                            />
                        </div>
                        <div className="flex gap-4 text-[10px] text-ui-muted">
                            <span>Rendah</span>
                            <span>Tinggi</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="absolute inset-0" style={{ 
                top: 'calc(env(safe-area-inset-top, 16px) + 140px)',
                paddingBottom: 'env(safe-area-inset-bottom, 16px)'
            }}>
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-ui-background/80 dark:bg-ui-inverse/80 z-[1000]">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 text-ui-primary animate-spin mx-auto mb-2" />
                            <p className="text-sm text-ui-muted">Memuat data heatmap...</p>
                        </div>
                    </div>
                )}

                {error && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-ui-background dark:bg-ui-inverse z-[1000]">
                        <div className="text-center p-6 max-w-sm">
                            <AlertTriangle className="w-12 h-12 text-ui-danger mx-auto mb-3" />
                            <p className="text-sm font-medium text-ui-text mb-1">Gagal Memuat Data</p>
                            <p className="text-xs text-ui-muted mb-4">{error}</p>
                            {onRefresh && (
                                <button
                                    onClick={onRefresh}
                                    className="px-4 py-2 bg-ui-primary text-ui-background rounded-ui-lg font-medium press-effect"
                                >
                                    Coba Lagi
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {!isLoading && !error && cells.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-ui-background dark:bg-ui-inverse z-[1000]">
                        <div className="text-center p-6 max-w-sm">
                            <Inbox className="w-12 h-12 text-ui-muted mx-auto mb-3" />
                            <p className="text-sm font-medium text-ui-text mb-1">Tidak Ada Data</p>
                            <p className="text-xs text-ui-muted">Belum ada zona yang terdeteksi</p>
                        </div>
                    </div>
                )}

                {!isLoading && !error && cells.length > 0 && (
                    <MapContainer
                        ref={mapRef}
                        center={mapCenter}
                        zoom={DEFAULT_ZOOM}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        <MapRecenter center={mapCenter} />
                        <HexagonLayer 
                            cells={cells} 
                            maxIntensity={maxIntensity}
                            onCellClick={handleCellClick}
                        />
                        <UserLocationMarker position={userLocation ? [userLocation.lat, userLocation.lng] : null} />
                    </MapContainer>
                )}
            </div>

            {/* FAB - Top Spot Button */}
            {!isLoading && !error && cells.length > 0 && (
                <button
                    onClick={jumpToTopSpot}
                    className="fab fixed bottom-24 right-4 px-4 py-3 bg-ui-danger text-white rounded-full shadow-lg press-effect flex items-center gap-2"
                    style={{ bottom: 'calc(env(safe-area-inset-bottom, 16px) + 96px)' }}
                >
                    <Flame size={20} />
                    <span className="text-sm font-medium">Top Spot</span>
                </button>
            )}

            {/* Bottom Sheet */}
            <AnimatePresence>
                {selectedCell && (
                    <BottomSheet
                        cell={selectedCell}
                        onClose={() => setSelectedCell(null)}
                        onNavigate={handleNavigate}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
