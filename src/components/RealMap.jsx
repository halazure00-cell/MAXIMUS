import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabaseClient';
import Card from './Card';
import PrimaryButton from './PrimaryButton';
import SectionTitle from './SectionTitle';

// --- Leaflet Icon Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

// --- Custom Icons ---
const userIcon = L.divIcon({
    className: 'custom-div-icon',
    html: '<div class="user-marker-pulse"></div><div class="user-marker-dot"></div>',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -10]
});

const activeStrategyIcon = L.divIcon({
    className: 'custom-div-icon',
    html: '<div class="active-strategy-ring"></div><div class="active-strategy-pin"></div>',
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -10]
});

const createCategoryIcon = (color) => L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0, 0, 0, 0.25);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -6]
});

const categoryIcons = {
    Bike: createCategoryIcon('var(--ui-color-info)'),
    Food: createCategoryIcon('var(--ui-color-warning)'),
    Wisata: createCategoryIcon('var(--ui-color-success)')
};

const BANDUNG_CENTER = [-6.9175, 107.6191];

const StrategyCard = ({ recommendation }) => {
    if (!recommendation) return null;

    return (
        <div className="absolute left-4 right-4 top-4 pointer-events-auto">
            <Card className="bg-ui-surface/95 p-4 shadow-ui-md backdrop-blur">
                <SectionTitle className="text-[10px] tracking-[0.3em]">{recommendation.title}</SectionTitle>
                <div className="mt-1 text-xs text-ui-muted">{recommendation.subtitle}</div>
            </Card>
        </div>
    );
};

const RecenterFab = ({ userPos }) => {
    const map = useMap();

    const handleClick = () => {
        const target = userPos ?? BANDUNG_CENTER;
        map.setView(target, map.getZoom(), { animate: true });
    };

    return (
        <div className="leaflet-top leaflet-right">
            <div className="leaflet-control">
                <PrimaryButton
                    type="button"
                    onClick={handleClick}
                    className="rounded-full bg-ui-surface/90 px-3 py-2 text-xs text-ui-text shadow-ui-sm hover:bg-ui-surface"
                >
                    Recenter
                </PrimaryButton>
            </div>
        </div>
    );
};

export default function RealMap() {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const [strategicSpots, setStrategicSpots] = useState([]);
    const [currentRecommendation, setCurrentRecommendation] = useState(null);
    const [userPos, setUserPos] = useState(null);
    const [timeTick, setTimeTick] = useState(Date.now());
    const [spotsLoading, setSpotsLoading] = useState(true);
    const [spotsError, setSpotsError] = useState(false);
    const [geoError, setGeoError] = useState(false);

    const currentDate = new Date(timeTick);
    const currentHour = currentDate.getHours();
    const isWeekend = [0, 6].includes(currentDate.getDay());

    const filteredSpots = Array.isArray(strategicSpots)
        ? strategicSpots.filter((spot) => {
            if (!spot) return false;
            if (spot.start_hour === undefined || spot.end_hour === undefined) return false;

            const startHour = Number.parseInt(spot.start_hour, 10);
            const endHour = Number.parseInt(spot.end_hour, 10);

            if (Number.isNaN(startHour) || Number.isNaN(endHour)) return false;

            const isWithinTime = startHour <= endHour
                ? currentHour >= startHour && currentHour < endHour
                : currentHour >= startHour || currentHour < endHour;

            if (!isWithinTime) return false;
            if (spot.is_weekend_only && !isWeekend) return false;
            return true;
        })
        : [];

    useEffect(() => {
        const fetchSpots = async () => {
            setSpotsLoading(true);
            setSpotsError(false);
            try {
                const { data, error } = await supabase
                    .from('strategic_spots')
                    .select('*');

                if (error) {
                    console.error('Error fetching spots:', error);
                    setStrategicSpots([]);
                    setSpotsError(true);
                    return;
                }

                setStrategicSpots(data || []);
            } catch (err) {
                console.error('Unexpected error:', err);
                setStrategicSpots([]);
                setSpotsError(true);
            } finally {
                setSpotsLoading(false);
            }
        };

        fetchSpots();

        const pollInterval = setInterval(fetchSpots, 300000);

        return () => {
            clearInterval(pollInterval);
        };
    }, []);

    useEffect(() => {
        if (!navigator.geolocation) {
            setUserPos(BANDUNG_CENTER);
            setGeoError(true);
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setUserPos([position.coords.latitude, position.coords.longitude]);
                setGeoError(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                setUserPos(BANDUNG_CENTER);
                setGeoError(true);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 10000
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    const toRad = (value) => (value * Math.PI) / 180;

    const getDistanceKm = (from, to) => {
        const [lat1, lng1] = from;
        const [lat2, lng2] = to;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) ** 2
            + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return 6371 * c;
    };

    useEffect(() => {
        const updateRecommendation = () => {
            setTimeTick(Date.now());

            if (filteredSpots.length > 0) {
                const spotsWithCoords = filteredSpots.filter((spot) => {
                    const lat = spot.latitude ?? spot.lat;
                    const lng = spot.longitude ?? spot.lng;
                    return lat != null && lng != null;
                });

                if (spotsWithCoords.length === 0) {
                    setCurrentRecommendation({
                        isFree: true,
                        title: '☕ Mode Bebas / Ngetem Santai',
                        subtitle: 'Tidak ada spot dengan koordinat valid.'
                    });
                    return;
                }

                const nearestSpot = userPos
                    ? spotsWithCoords
                        .map((candidate) => {
                            const lat = candidate.latitude ?? candidate.lat;
                            const lng = candidate.longitude ?? candidate.lng;
                            return {
                                spot: candidate,
                                distanceKm: getDistanceKm(userPos, [lat, lng])
                            };
                        })
                        .sort((a, b) => a.distanceKm - b.distanceKm)[0]?.spot
                    : null;

                const spot = nearestSpot || spotsWithCoords[0];
                const lat = spot.latitude ?? spot.lat;
                const lng = spot.longitude ?? spot.lng;

                setCurrentRecommendation({
                    isFree: false,
                    title: `🔥 HOT SPOT JAM ${currentHour}:00`,
                    subtitle: userPos
                        ? `Geser ke ${spot.name}. Strategi: ${spot.notes || 'Standby.'}`
                        : 'Rekomendasi terdekat menunggu lokasi aktif.',
                    lat,
                    lng
                });
            } else {
                setCurrentRecommendation({
                    isFree: true,
                    title: '☕ Mode Bebas / Ngetem Santai',
                    subtitle: 'Belum ada rotasi terjadwal. Cek area perumahan.'
                });
            }
        };

        const timer = setInterval(updateRecommendation, 60000);
        updateRecommendation();

        return () => clearInterval(timer);
    }, [filteredSpots, userPos, currentHour]);

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    return (
        <div 
            className="relative w-full overflow-hidden" 
            style={{ 
                height: 'calc(100dvh - 64px - env(safe-area-inset-bottom, 0px))',
                maxHeight: 'calc(100dvh - 64px - env(safe-area-inset-bottom, 0px))',
                zIndex: 0
            }}
        >
            <div className="absolute inset-0 z-[100] pointer-events-none">
                <div className="absolute left-4 top-4 pointer-events-auto">
                    <PrimaryButton
                        type="button"
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 rounded-full bg-ui-surface/95 px-4 py-2 text-xs text-ui-text shadow-ui-md hover:bg-ui-surface"
                    >
                        Kembali
                    </PrimaryButton>
                </div>
                <StrategyCard recommendation={currentRecommendation} />
                <div className="absolute left-4 right-4 top-20 space-y-2 text-xs text-ui-muted">
                    {spotsLoading && (
                        <div className="rounded-full bg-ui-surface/90 px-3 py-1 shadow-ui-sm">
                            Memuat lokasi strategis…
                        </div>
                    )}
                    {spotsError && (
                        <div className="rounded-full bg-ui-surface/90 px-3 py-1 shadow-ui-sm">
                            Gagal memuat lokasi strategis.
                        </div>
                    )}
                    {geoError && (
                        <div className="rounded-full bg-ui-surface/90 px-3 py-1 shadow-ui-sm">
                            Lokasi tidak tersedia, menampilkan titik default.
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full h-full" style={{ zIndex: 0 }}>
                <MapContainer
                    center={BANDUNG_CENTER}
                    zoom={13}
                    zoomControl={false}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%', zIndex: 0 }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url={settings?.darkMode
                            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                        }
                    />

                    <RecenterFab userPos={userPos} />

                    {userPos && (
                        <Marker position={userPos} icon={userIcon}>
                            <Popup>
                                <span className="font-bold text-ui-info">Posisi Anda</span>
                            </Popup>
                        </Marker>
                    )}

                    {filteredSpots.map((spot) => {
                        const lat = spot.latitude ?? spot.lat;
                        const lng = spot.longitude ?? spot.lng;

                        if (lat == null || lng == null) return null;

                        const categoryIcon = categoryIcons[spot.category] || activeStrategyIcon;

                        return (
                            <Marker
                                key={spot.id}
                                position={[lat, lng]}
                                icon={categoryIcon}
                                zIndexOffset={1000}
                            >
                            <Popup className="custom-popup" closeButton={false}>
                                <div className="p-1 min-w-[200px]">
                                        <div className="text-xs font-bold uppercase tracking-wider mb-1 text-ui-success">
                                            REKOMENDASI JAM INI
                                        </div>
                                        <h3 className="font-bold text-lg text-ui-text mb-1">{spot.name}</h3>
                                        <p className="text-sm text-ui-muted leading-snug bg-ui-surface-muted p-2 rounded-ui-md border border-ui-border italic">
                                            "{spot.notes ?? 'Tidak ada catatan.'}"
                                        </p>
                                </div>
                            </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>
        </div>
    );
}
